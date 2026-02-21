import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'

export function useBundle() {
    const { user } = useAuth()
    const [bundle, setBundle] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchBundle = useCallback(async () => {
        if (!user) {
            setBundle([])
            setLoading(false)
            return
        }

        try {
            const res = await fetch('/api/bundle', { credentials: 'include' })
            if (res.ok) {
                const data = await res.json()
                setBundle(data)
            }
        } catch (error) {
            console.error('Failed to fetch bundle:', error)
        } finally {
            setLoading(false)
        }
    }, [user])

    useEffect(() => {
        fetchBundle()
    }, [fetchBundle])

    const addToBundle = async (mockupId) => {
        if (!user) return false
        try {
            const res = await fetch('/api/bundle/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mockupId }),
                credentials: 'include'
            })
            if (res.ok) {
                const data = await res.json()
                setBundle(data)
                return true
            }
        } catch (err) {
            console.error('Failed to add to bundle:', err)
        }
        return false
    }

    const removeFromBundle = async (mockupId) => {
        if (!user) return false
        try {
            const res = await fetch('/api/bundle/remove', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mockupId }),
                credentials: 'include'
            })
            if (res.ok) {
                const data = await res.json()
                setBundle(data)
                return true
            }
        } catch (err) {
            console.error('Failed to remove from bundle:', err)
        }
        return false
    }

    const isInBundle = (mockupId) => bundle.includes(mockupId)

    return { bundle, loading, addToBundle, removeFromBundle, isInBundle, reload: fetchBundle }
}
