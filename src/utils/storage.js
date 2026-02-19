// Server-backed storage for mockup templates
// All data persists to the server filesystem via Express API

const API_OPTS = { credentials: 'include' }

export async function getAllMockups() {
    const response = await fetch('/api/mockups', API_OPTS)
    if (response.status === 429) {
        throw new Error('Rate limited — please wait a moment and try again')
    }
    if (!response.ok) throw new Error('Failed to fetch mockups')
    return response.json()
}

export async function getMockupById(id) {
    const mockups = await getAllMockups()
    return mockups.find(m => m.id === id) || null
}

export async function saveMockup(mockup) {
    const isUpdate = !!mockup.id
    const existingMockups = isUpdate ? await getAllMockups() : []
    const exists = isUpdate && existingMockups.some(m => m.id === mockup.id)

    if (exists) {
        // Update existing mockup
        const response = await fetch(`/api/mockups/${mockup.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(mockup)
        })
        if (!response.ok) throw new Error('Failed to update mockup')
        return response.json()
    } else {
        // Create new mockup
        const response = await fetch('/api/mockups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(mockup)
        })
        if (!response.ok) throw new Error('Failed to create mockup')
        return response.json()
    }
}

export async function deleteMockup(id) {
    const response = await fetch(`/api/mockups/${id}`, {
        method: 'DELETE',
        credentials: 'include'
    })
    if (!response.ok) throw new Error('Failed to delete mockup')
}

// ===== Packs =====

export async function getAllPacks() {
    const response = await fetch('/api/packs', API_OPTS)
    if (!response.ok) throw new Error('Failed to fetch packs')
    return response.json()
}

export async function savePack(pack) {
    const isUpdate = !!pack.id
    if (isUpdate) {
        const response = await fetch(`/api/packs/${pack.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(pack)
        })
        if (!response.ok) throw new Error('Failed to update pack')
        return response.json()
    } else {
        const response = await fetch('/api/packs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(pack)
        })
        if (!response.ok) throw new Error('Failed to create pack')
        return response.json()
    }
}

export async function deletePack(id) {
    const response = await fetch(`/api/packs/${id}`, {
        method: 'DELETE',
        credentials: 'include'
    })
    if (!response.ok) throw new Error('Failed to delete pack')
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
    // First get the count from regular endpoint
    const countResponse = await fetch('/api/mockups', API_OPTS)
    const allMockups = await countResponse.json()
    const count = allMockups.length

    // Then trigger the export download
    const response = await fetch('/api/mockups/export', API_OPTS)
    if (!response.ok) throw new Error('Failed to export mockups')

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mockup-studio-backup-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    return count
}

export function importMockups(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result)

                const response = await fetch('/api/mockups/import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(data)
                })

                if (!response.ok) throw new Error('Server import failed')
                const result = await response.json()
                resolve(result.imported)
            } catch (err) {
                reject(err)
            }
        }
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsText(file)
    })
}
