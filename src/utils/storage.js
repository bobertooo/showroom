// IndexedDB storage for mockup templates

const DB_NAME = 'MockupStudioDB'
const DB_VERSION = 1
const STORE_NAME = 'mockups'

let dbPromise = null

function getDB() {
    if (dbPromise) return dbPromise

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION)

        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(request.result)

        request.onupgradeneeded = (event) => {
            const db = event.target.result
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' })
            }
        }
    })

    return dbPromise
}

export async function getAllMockups() {
    const db = await getDB()
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.getAll()

        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })
}

export async function getMockupById(id) {
    const db = await getDB()
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.get(id)

        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })
}

export async function saveMockup(mockup) {
    const db = await getDB()
    const mockupWithId = {
        ...mockup,
        id: mockup.id || `mockup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: mockup.createdAt || new Date().toISOString()
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.put(mockupWithId)

        request.onsuccess = () => resolve(mockupWithId)
        request.onerror = () => reject(request.error)
    })
}

export async function deleteMockup(id) {
    const db = await getDB()
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.delete(id)

        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
    })
}

// Session storage for the current design
// Uses in-memory variable as primary store since large images
// can exceed sessionStorage's ~5MB quota
const DESIGN_KEY = 'mockup_studio_current_design'
let currentDesign = null

export function saveCurrentDesign(dataUrl) {
    currentDesign = dataUrl
    try {
        if (dataUrl) {
            sessionStorage.setItem(DESIGN_KEY, dataUrl)
        } else {
            sessionStorage.removeItem(DESIGN_KEY)
        }
    } catch (e) {
        // Image may exceed sessionStorage quota — in-memory store still works
    }
}

export function getCurrentDesign() {
    return currentDesign || sessionStorage.getItem(DESIGN_KEY)
}

// ===== Export / Import =====

export async function exportAllMockups() {
    const mockups = await getAllMockups()
    const payload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        mockups
    }
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mockup-studio-backup-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    return mockups.length
}

export function importMockups(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result)
                const mockups = data.mockups || data // support raw array or wrapped object
                if (!Array.isArray(mockups)) {
                    throw new Error('Invalid backup file: expected an array of mockups')
                }
                let count = 0
                for (const mockup of mockups) {
                    if (mockup.image && mockup.placement) {
                        await saveMockup(mockup)
                        count++
                    }
                }
                resolve(count)
            } catch (err) {
                reject(err)
            }
        }
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsText(file)
    })
}
