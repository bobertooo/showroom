import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = path.join(__dirname, 'data')
const MOCKUPS_FILE = path.join(DATA_DIR, 'mockups.json')
const IMAGES_DIR = path.join(DATA_DIR, 'images')

async function patchDimensions() {
    try {
        const raw = await fs.readFile(MOCKUPS_FILE, 'utf-8')
        const mockups = JSON.parse(raw)

        let updatedCount = 0

        for (const mockup of mockups) {
            if (mockup.mockupWidth && mockup.mockupHeight) continue;

            const filename = mockup.image.split('/').pop()
            const imagePath = path.join(IMAGES_DIR, filename)

            try {
                const metadata = await sharp(imagePath).metadata()
                mockup.mockupWidth = metadata.width
                mockup.mockupHeight = metadata.height
                updatedCount++
                console.log(`Updated ${mockup.name} (${metadata.width}x${metadata.height})`)
            } catch (err) {
                console.warn(`Could not read image for ${mockup.id} at ${imagePath}:`, err.message)
            }
        }

        if (updatedCount > 0) {
            await fs.writeFile(MOCKUPS_FILE, JSON.stringify(mockups, null, 2), 'utf-8')
            console.log(`\nSuccessfully patched ${updatedCount} mockups with dimensions!`)
        } else {
            console.log('\nAll mockups already have dimensions. No changes made.')
        }

    } catch (err) {
        console.error('Error patching dimensions:', err)
        process.exit(1)
    }
}

patchDimensions()
