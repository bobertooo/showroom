import { useState, useEffect, useCallback } from 'react'
import { getAllPacks, savePack, deletePack as deleteFromDB } from '../utils/storage'

export function usePacks() {
    const [packs, setPacks] = useState([])
    const [loading, setLoading] = useState(true)

    const loadPacks = useCallback(async () => {
        try {
            const data = await getAllPacks()
            setPacks(data)
        } catch (error) {
            console.error('Failed to load packs:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadPacks()
    }, [loadPacks])

    const addPack = useCallback(async (pack) => {
        const saved = await savePack(pack)
        setPacks(prev => {
            const idx = prev.findIndex(p => p.id === saved.id)
            if (idx > -1) {
                const updated = [...prev]
                updated[idx] = saved
                return updated
            }
            return [...prev, saved]
        })
        return saved
    }, [])

    const updatePack = useCallback(async (pack) => {
        const saved = await savePack(pack)
        setPacks(prev => prev.map(p => p.id === saved.id ? saved : p))
        return saved
    }, [])

    const removePack = useCallback(async (id) => {
        await deleteFromDB(id)
        setPacks(prev => prev.filter(p => p.id !== id))
    }, [])

    return { packs, loading, addPack, updatePack, removePack, reload: loadPacks }
}
