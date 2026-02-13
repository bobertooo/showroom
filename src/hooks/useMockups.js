import { useState, useEffect, useCallback } from 'react'
import { getAllMockups, saveMockup, deleteMockup as deleteFromDB, getMockupById } from '../utils/storage'

export function useMockups() {
    const [mockups, setMockups] = useState([])
    const [loading, setLoading] = useState(true)

    const loadMockups = useCallback(async () => {
        try {
            const data = await getAllMockups()
            setMockups(data)
        } catch (error) {
            console.error('Failed to load mockups:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadMockups()
    }, [loadMockups])

    const addMockup = useCallback(async (mockup) => {
        const saved = await saveMockup(mockup)
        setMockups(prev => {
            const index = prev.findIndex(m => m.id === saved.id)
            if (index > -1) {
                // Update existing
                const updated = [...prev]
                updated[index] = saved
                return updated
            }
            // Add new
            return [...prev, saved]
        })
        return saved
    }, [])

    const deleteMockup = useCallback(async (id) => {
        await deleteFromDB(id)
        setMockups(prev => prev.filter(m => m.id !== id))
    }, [])

    return { mockups, loading, addMockup, deleteMockup, reload: loadMockups }
}

export function useMockup(id) {
    const [mockup, setMockup] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!id) {
            setLoading(false)
            return
        }

        getMockupById(id)
            .then(data => setMockup(data))
            .catch(error => console.error('Failed to load mockup:', error))
            .finally(() => setLoading(false))
    }, [id])

    return { mockup, loading }
}
