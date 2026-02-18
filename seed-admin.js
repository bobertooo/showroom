/**
 * Seed an admin user.
 *
 * Usage:
 *   node seed-admin.js <username> <password>
 *
 * Example:
 *   node seed-admin.js robert my-secure-password
 *
 * If the user already exists, their role will be promoted to admin.
 */

import fs from 'fs/promises'
import { existsSync, mkdirSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = path.join(__dirname, 'data')
const USERS_FILE = path.join(DATA_DIR, 'users.json')

async function seedAdmin() {
    const [, , username, password] = process.argv

    if (!username || !password) {
        console.error('Usage: node seed-admin.js <username> <password>')
        process.exit(1)
    }

    if (password.length < 6) {
        console.error('❌ Password must be at least 6 characters')
        process.exit(1)
    }

    // Ensure data directory
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR)

    // Load existing users
    let users = []
    if (existsSync(USERS_FILE)) {
        try {
            users = JSON.parse(await fs.readFile(USERS_FILE, 'utf-8'))
        } catch {
            users = []
        }
    }

    const existing = users.find(u => u.username === username.toLowerCase())

    if (existing) {
        // Promote to admin
        existing.role = 'admin'
        existing.password = await bcrypt.hash(password, 12)
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8')
        console.log(`✅ User "${username}" promoted to admin (password updated)`)
    } else {
        // Create new admin
        const hashedPassword = await bcrypt.hash(password, 12)
        const newUser = {
            id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            username: username.toLowerCase(),
            password: hashedPassword,
            role: 'admin',
            plan: 'pro',
            createdAt: new Date().toISOString()
        }
        users.push(newUser)
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8')
        console.log(`✅ Admin user "${username}" created`)
    }
}

seedAdmin().catch(err => {
    console.error('❌ Failed:', err)
    process.exit(1)
})
