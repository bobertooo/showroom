/**
 * Seed script: migrates the existing backup JSON (with base64 images)
 * into the new server-side file-based storage format.
 *
 * Usage: node seed.js
 */

import fs from 'fs/promises'
import { existsSync, mkdirSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = path.join(__dirname, 'data')
const IMAGES_DIR = path.join(DATA_DIR, 'images')
const MOCKUPS_FILE = path.join(DATA_DIR, 'mockups.json')
const BACKUP_FILE = path.join(__dirname, 'public', 'mockup-studio-backup-1771215388413.json')

async function seed() {
    console.log('🌱 Starting seed migration...')

    // Ensure directories
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR)
    if (!existsSync(IMAGES_DIR)) mkdirSync(IMAGES_DIR)

    // Check if already seeded
    if (existsSync(MOCKUPS_FILE)) {
        const existing = JSON.parse(await fs.readFile(MOCKUPS_FILE, 'utf-8'))
        if (existing.length > 0) {
            console.log(`⚠️  data/mockups.json already has ${existing.length} mockups. Skipping seed.`)
            console.log('   Delete data/mockups.json to re-seed.')
            return
        }
    }

    // Read backup
    if (!existsSync(BACKUP_FILE)) {
        console.log('❌ Backup file not found at:', BACKUP_FILE)
        console.log('   Nothing to seed. The server will start with an empty database.')
        await fs.writeFile(MOCKUPS_FILE, '[]', 'utf-8')
        return
    }

    console.log('📖 Reading backup file...')
    const raw = await fs.readFile(BACKUP_FILE, 'utf-8')
    const data = JSON.parse(raw)
    const mockups = Array.isArray(data) ? data : (data.mockups || [])

    console.log(`📦 Found ${mockups.length} mockups to migrate.`)

    const migrated = []
    let imageCount = 0

    for (const mockup of mockups) {
        if (!mockup.image || !mockup.placement) {
            console.log(`   ⏭️  Skipping mockup without image/placement: ${mockup.id || 'unknown'}`)
            continue
        }

        const id = mockup.id || `mockup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        let imageUrl = mockup.image

        // Extract base64 image to file
        if (mockup.image.startsWith('data:')) {
            const match = mockup.image.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/)
            if (match) {
                const ext = match[1] === 'jpeg' ? 'jpg' : match[1]
                const filename = `${id}.${ext}`
                const filepath = path.join(IMAGES_DIR, filename)

                await fs.writeFile(filepath, Buffer.from(match[2], 'base64'))
                imageUrl = `/api/images/${filename}`
                imageCount++
            }
        }

        migrated.push({
            id,
            name: mockup.name || 'Untitled Mockup',
            type: mockup.type || 'poster',
            image: imageUrl,
            placement: mockup.placement,
            edited: mockup.edited ?? false,
            createdAt: mockup.createdAt || new Date().toISOString()
        })
    }

    await fs.writeFile(MOCKUPS_FILE, JSON.stringify(migrated, null, 2), 'utf-8')

    console.log(`\n✅ Seed complete!`)
    console.log(`   ${migrated.length} mockups written to data/mockups.json`)
    console.log(`   ${imageCount} images saved to data/images/`)
}

seed().catch(err => {
    console.error('❌ Seed failed:', err)
    process.exit(1)
})
