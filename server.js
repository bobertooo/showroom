import 'dotenv/config'
import express from 'express'
import fs from 'fs/promises'
import { existsSync, mkdirSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import bcrypt from 'bcryptjs'
import session from 'express-session'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import Stripe from 'stripe'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// ===== Paths =====
const DATA_DIR = path.join(__dirname, 'data')
const IMAGES_DIR = path.join(DATA_DIR, 'images')
const MOCKUPS_FILE = path.join(DATA_DIR, 'mockups.json')
const USERS_FILE = path.join(DATA_DIR, 'users.json')

// Ensure data directories exist
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR)
if (!existsSync(IMAGES_DIR)) mkdirSync(IMAGES_DIR)
if (!existsSync(MOCKUPS_FILE)) {
    fs.writeFile(MOCKUPS_FILE, '[]', 'utf-8')
}
if (!existsSync(USERS_FILE)) {
    fs.writeFile(USERS_FILE, '[]', 'utf-8')
}

// ===== Security Middleware =====

app.use(helmet({ contentSecurityPolicy: false })) // CSP disabled for dev flexibility

app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? (process.env.ALLOWED_ORIGIN || true) // same-origin in prod; set ALLOWED_ORIGIN for custom domain
        : 'http://localhost:3000',
    credentials: true
}))

// ===== Serve Images (before rate limiter so static assets aren't throttled) =====

app.use('/api/images', express.static(IMAGES_DIR))

// Rate limiting — 500 requests per 15 minutes per IP
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again later.' }
})

// Stricter rate limit for auth endpoints — 50 attempts per 15 minutes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts. Please try again later.' }
})

app.use('/api', apiLimiter)
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/signup', authLimiter)

// ===== Session =====

app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'lax'
    }
}))

app.use(passport.initialize())
app.use(passport.session())

// Body parsing (must come AFTER raw body middleware for Stripe webhooks)
// Stripe webhook needs raw body — must be registered before express.json()
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook)

app.use(express.json({ limit: '50mb' }))

// ===== User Helpers =====

async function readUsers() {
    try {
        const raw = await fs.readFile(USERS_FILE, 'utf-8')
        return JSON.parse(raw)
    } catch {
        return []
    }
}

async function writeUsers(users) {
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8')
}

async function findUserByUsername(username) {
    const users = await readUsers()
    return users.find(u => u.username === username.toLowerCase()) || null
}

async function findUserByEmail(email) {
    const users = await readUsers()
    return users.find(u => u.email === email.toLowerCase()) || null
}

async function findUserById(id) {
    const users = await readUsers()
    return users.find(u => u.id === id) || null
}

function generateUserId() {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function isAdmin(user) {
    return user && user.role === 'admin'
}

// ===== Passport Serialization =====

passport.serializeUser((user, done) => {
    done(null, user.id)
})

passport.deserializeUser(async (id, done) => {
    try {
        const user = await findUserById(id)
        done(null, user)
    } catch (err) {
        done(err)
    }
})

// ===== Google OAuth Strategy =====

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails?.[0]?.value?.toLowerCase()
            if (!email) return done(new Error('No email from Google'))

            let user = await findUserByEmail(email)

            if (!user) {
                // Auto-create user on first Google login
                const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase()
                const users = await readUsers()
                user = {
                    id: generateUserId(),
                    username: profile.displayName || email.split('@')[0],
                    email,
                    googleId: profile.id,
                    role: (adminEmail && email === adminEmail) ? 'admin' : 'user',
                    plan: 'free',
                    createdAt: new Date().toISOString()
                }
                users.push(user)
                await writeUsers(users)
            } else if (!user.googleId) {
                // Link Google account to existing user
                const users = await readUsers()
                const idx = users.findIndex(u => u.id === user.id)
                users[idx].googleId = profile.id
                await writeUsers(users)
                user = users[idx]
            }

            done(null, user)
        } catch (err) {
            done(err)
        }
    }))

    console.log('✅ Google OAuth configured')
} else {
    console.log('⚠️  Google OAuth not configured (missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET in .env)')
}

// ===== Stripe Setup =====

const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null

if (stripe) {
    console.log('✅ Stripe configured')
} else {
    console.log('⚠️  Stripe not configured (missing STRIPE_SECRET_KEY in .env)')
}

// ===== Auth Middleware =====

function requireAuth(req, res, next) {
    if (req.isAuthenticated()) return next()
    res.status(401).json({ error: 'Authentication required' })
}

function requireAdmin(req, res, next) {
    if (req.isAuthenticated() && isAdmin(req.user)) return next()
    res.status(403).json({ error: 'Admin access required' })
}

// ===== Sanitization =====

function sanitizeId(id) {
    // Only allow alphanumeric, underscores, and hyphens
    return id.replace(/[^a-zA-Z0-9_-]/g, '')
}

// (Images are served above, before the rate limiter)

// ===== Mockup Helpers =====

async function readMockups() {
    try {
        const raw = await fs.readFile(MOCKUPS_FILE, 'utf-8')
        return JSON.parse(raw)
    } catch (err) {
        // Only return [] if the file doesn't exist yet; re-throw on parse
        // errors so callers don't accidentally overwrite valid data with []
        if (err.code === 'ENOENT') return []
        console.error('Failed to read mockups.json:', err.message)
        throw err
    }
}

async function writeMockups(mockups) {
    await fs.writeFile(MOCKUPS_FILE, JSON.stringify(mockups, null, 2), 'utf-8')
}

function generateMockupId() {
    return `mockup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

async function saveImageFile(dataUrl, id) {
    if (!dataUrl || !dataUrl.startsWith('data:')) {
        return dataUrl
    }

    const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/)
    if (!match) return dataUrl

    const safeId = sanitizeId(id)
    const ext = match[1] === 'jpeg' ? 'jpg' : match[1]
    const base64Data = match[2]
    const filename = `${safeId}.${ext}`
    const filepath = path.join(IMAGES_DIR, filename)

    // Extra safety: verify the resolved path is inside IMAGES_DIR
    const resolvedPath = path.resolve(filepath)
    if (!resolvedPath.startsWith(path.resolve(IMAGES_DIR))) {
        throw new Error('Invalid file path')
    }

    await fs.writeFile(filepath, Buffer.from(base64Data, 'base64'))
    return `/api/images/${filename}`
}

async function deleteImageFile(imageUrl) {
    if (!imageUrl || !imageUrl.startsWith('/api/images/')) return
    const filename = imageUrl.replace('/api/images/', '')
    const filepath = path.join(IMAGES_DIR, sanitizeId(filename.split('.')[0]) + '.' + (filename.split('.')[1] || 'png'))
    try {
        await fs.unlink(filepath)
    } catch {
        // File may not exist
    }
}

async function imageToDataUrl(imageUrl) {
    if (!imageUrl || !imageUrl.startsWith('/api/images/')) return imageUrl
    const filename = imageUrl.replace('/api/images/', '')
    const filepath = path.join(IMAGES_DIR, filename)
    try {
        const data = await fs.readFile(filepath)
        const ext = path.extname(filename).slice(1)
        const mime = ext === 'jpg' ? 'jpeg' : ext
        return `data:image/${mime};base64,${data.toString('base64')}`
    } catch {
        return imageUrl
    }
}

// ============================================================
//  AUTH ROUTES
// ============================================================

// POST /api/auth/signup — Create a new account
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { username, password } = req.body

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' })
        }
        if (username.length < 3) {
            return res.status(400).json({ error: 'Username must be at least 3 characters' })
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' })
        }

        const existing = await findUserByUsername(username)
        if (existing) {
            return res.status(409).json({ error: 'Username already taken' })
        }

        const hashedPassword = await bcrypt.hash(password, 12)
        const users = await readUsers()
        const newUser = {
            id: generateUserId(),
            username: username.toLowerCase(),
            password: hashedPassword,
            role: 'user', // NEVER auto-assign admin
            plan: 'free',
            createdAt: new Date().toISOString()
        }
        users.push(newUser)
        await writeUsers(users)

        // Auto-login after signup
        const safeUser = { ...newUser }
        delete safeUser.password
        req.login(safeUser, (err) => {
            if (err) return res.status(500).json({ error: 'Login failed after signup' })
            res.json(safeUser)
        })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// POST /api/auth/login — Log in with username + password
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' })
        }

        const user = await findUserByUsername(username)
        if (!user || !user.password) {
            return res.status(401).json({ error: 'Invalid credentials' })
        }

        const match = await bcrypt.compare(password, user.password)
        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' })
        }

        const safeUser = { ...user }
        delete safeUser.password
        req.login(safeUser, (err) => {
            if (err) return res.status(500).json({ error: 'Login failed' })
            res.json(safeUser)
        })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// GET /api/auth/me — Get current user
app.get('/api/auth/me', (req, res) => {
    if (req.isAuthenticated()) {
        const safeUser = { ...req.user }
        delete safeUser.password
        res.json(safeUser)
    } else {
        res.status(401).json({ error: 'Not authenticated' })
    }
})

// POST /api/auth/logout — Log out
app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
        if (err) return res.status(500).json({ error: 'Logout failed' })
        req.session.destroy()
        res.json({ success: true })
    })
})

// ===== Google OAuth Routes =====

const googleConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)

app.get('/api/auth/google', (req, res, next) => {
    if (!googleConfigured) {
        return res.redirect('/login?error=google_not_configured')
    }
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next)
})

app.get('/api/auth/google/callback', (req, res, next) => {
    if (!googleConfigured) {
        return res.redirect('/login?error=google_not_configured')
    }
    passport.authenticate('google', { failureRedirect: '/login?error=google_failed' })(req, res, next)
}, (req, res) => {
    res.redirect('/')
})

// ============================================================
//  STRIPE ROUTES
// ============================================================

// POST /api/checkout/create-session — Create a Stripe Checkout session
app.post('/api/checkout/create-session', requireAuth, async (req, res) => {
    if (!stripe) {
        return res.status(503).json({ error: 'Payment system not configured' })
    }

    try {
        const { plan } = req.body
        const prices = {
            pro: {
                price_data: {
                    currency: 'usd',
                    product_data: { name: 'Showroom Pro' },
                    unit_amount: 2900, // $29.00
                    recurring: { interval: 'month' }
                },
                quantity: 1
            }
        }

        if (!prices[plan]) {
            return res.status(400).json({ error: 'Invalid plan' })
        }

        const sessionObj = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [prices[plan]],
            success_url: `${req.headers.origin || 'http://localhost:3000'}/create?checkout=success`,
            cancel_url: `${req.headers.origin || 'http://localhost:3000'}/pricing?checkout=cancelled`,
            client_reference_id: req.user.id,
            customer_email: req.user.email || undefined
        })

        res.json({ url: sessionObj.url })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// Stripe Webhook handler (registered above express.json)
async function handleStripeWebhook(req, res) {
    if (!stripe) return res.status(503).send('Stripe not configured')

    const sig = req.headers['stripe-signature']
    let event

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        )
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message)
        return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    if (event.type === 'checkout.session.completed') {
        const sessionObj = event.data.object
        const userId = sessionObj.client_reference_id

        if (userId) {
            const users = await readUsers()
            const idx = users.findIndex(u => u.id === userId)
            if (idx !== -1) {
                users[idx].plan = 'pro'
                users[idx].stripeCustomerId = sessionObj.customer
                users[idx].stripeSubscriptionId = sessionObj.subscription
                await writeUsers(users)
                console.log(`✅ User ${userId} upgraded to Pro`)
            }
        }
    }

    if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object
        const users = await readUsers()
        const idx = users.findIndex(u => u.stripeSubscriptionId === subscription.id)
        if (idx !== -1) {
            users[idx].plan = 'free'
            delete users[idx].stripeSubscriptionId
            await writeUsers(users)
            console.log(`⚠️  User ${users[idx].id} downgraded to Free`)
        }
    }

    res.json({ received: true })
}

// ============================================================
//  MOCKUP API ROUTES (Public read, Admin write)
// ============================================================

// GET /api/mockups — Public: anyone can view mockups
app.get('/api/mockups', async (req, res) => {
    try {
        const mockups = await readMockups()
        res.json(mockups)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// POST /api/mockups — Admin only: create mockup
app.post('/api/mockups', requireAdmin, async (req, res) => {
    try {
        const mockup = req.body
        const id = sanitizeId(mockup.id || generateMockupId())
        const imageUrl = await saveImageFile(mockup.image, id)

        const newMockup = {
            id,
            name: mockup.name || 'Untitled Mockup',
            type: mockup.type || 'poster',
            image: imageUrl,
            placement: mockup.placement,
            edited: mockup.edited ?? false,
            createdAt: mockup.createdAt || new Date().toISOString()
        }

        const mockups = await readMockups()
        mockups.push(newMockup)
        await writeMockups(mockups)

        res.json(newMockup)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// PUT /api/mockups/:id — Admin only: update mockup
app.put('/api/mockups/:id', requireAdmin, async (req, res) => {
    try {
        const id = sanitizeId(req.params.id)
        const updates = req.body
        const mockups = await readMockups()
        const index = mockups.findIndex(m => m.id === id)

        if (index === -1) {
            return res.status(404).json({ error: 'Mockup not found' })
        }

        let imageUrl = mockups[index].image
        if (updates.image && updates.image.startsWith('data:')) {
            await deleteImageFile(mockups[index].image)
            imageUrl = await saveImageFile(updates.image, id)
        }

        mockups[index] = {
            ...mockups[index],
            ...updates,
            id,
            image: imageUrl
        }

        await writeMockups(mockups)
        res.json(mockups[index])
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// DELETE /api/mockups/:id — Admin only: delete mockup
app.delete('/api/mockups/:id', requireAdmin, async (req, res) => {
    try {
        const id = sanitizeId(req.params.id)
        const mockups = await readMockups()
        const mockup = mockups.find(m => m.id === id)

        if (mockup) {
            await deleteImageFile(mockup.image)
        }

        const filtered = mockups.filter(m => m.id !== id)
        await writeMockups(filtered)
        res.json({ success: true })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// GET /api/mockups/export — Admin only
app.get('/api/mockups/export', requireAdmin, async (req, res) => {
    try {
        const mockups = await readMockups()
        const exportMockups = await Promise.all(
            mockups.map(async (m) => ({
                ...m,
                image: await imageToDataUrl(m.image)
            }))
        )

        const payload = {
            version: 1,
            exportedAt: new Date().toISOString(),
            mockups: exportMockups
        }

        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Content-Disposition', `attachment; filename="showroom-backup-${Date.now()}.json"`)
        res.json(payload)
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// POST /api/mockups/import — Admin only
app.post('/api/mockups/import', requireAdmin, async (req, res) => {
    try {
        const data = req.body
        const incoming = data.mockups || (Array.isArray(data) ? data : [])

        if (!Array.isArray(incoming)) {
            return res.status(400).json({ error: 'Invalid format: expected array of mockups' })
        }

        const mockups = await readMockups()
        const existingIds = new Set(mockups.map(m => m.id))
        let count = 0

        for (const mockup of incoming) {
            if (!mockup.image || !mockup.placement) continue

            const id = sanitizeId(mockup.id || generateMockupId())
            const imageUrl = await saveImageFile(mockup.image, id)

            const newMockup = {
                id,
                name: mockup.name || 'Untitled Mockup',
                type: mockup.type || 'poster',
                image: imageUrl,
                placement: mockup.placement,
                edited: mockup.edited ?? false,
                createdAt: mockup.createdAt || new Date().toISOString()
            }

            if (existingIds.has(id)) {
                const idx = mockups.findIndex(m => m.id === id)
                if (idx !== -1) {
                    await deleteImageFile(mockups[idx].image)
                    mockups[idx] = newMockup
                }
            } else {
                mockups.push(newMockup)
            }
            count++
        }

        await writeMockups(mockups)
        res.json({ imported: count })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// ===== Production: Serve built frontend =====
const distPath = path.join(__dirname, 'dist')
if (existsSync(distPath)) {
    app.use(express.static(distPath))
    app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'))
    })
}

// ===== Auto-seed admin from env vars (set SEED_ADMIN_USER + SEED_ADMIN_PASS in Railway) =====
async function autoSeedAdmin() {
    const seedUser = process.env.SEED_ADMIN_USER
    const seedPass = process.env.SEED_ADMIN_PASS
    if (!seedUser || !seedPass) return

    try {
        const users = await readUsers()
        const existing = users.find(u => u.username === seedUser)
        const hashed = await bcrypt.hash(seedPass, 12)

        if (existing) {
            existing.role = 'admin'
            existing.password = hashed
            await writeUsers(users)
            console.log(`✅ Auto-seed: promoted '${seedUser}' to admin`)
        } else {
            users.push({
                id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                username: seedUser,
                password: hashed,
                role: 'admin',
                plan: 'pro',
                createdAt: new Date().toISOString()
            })
            await writeUsers(users)
            console.log(`✅ Auto-seed: created admin user '${seedUser}'`)
        }
    } catch (err) {
        console.error('Auto-seed failed:', err.message)
    }
}

app.listen(PORT, async () => {
    console.log(`\n🚀 Showroom API server running on port ${PORT}`)
    console.log(`   Data directory: ${DATA_DIR}`)
    console.log(`   Images directory: ${IMAGES_DIR}`)
    console.log('')
    await autoSeedAdmin()
})

