import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function useAuth() {
    return useContext(AuthContext)
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check local storage for persisted session
        const storedUser = localStorage.getItem('showroom_user')
        if (storedUser) {
            setUser(JSON.parse(storedUser))
        }
        setLoading(false)
    }, [])

    const login = (username, password) => {
        return new Promise((resolve, reject) => {
            // Mock authentication delay
            setTimeout(() => {
                if (username === 'robert' && password === 'password') {
                    const userData = { username, role: 'admin' }
                    setUser(userData)
                    localStorage.setItem('showroom_user', JSON.stringify(userData))
                    resolve(userData)
                } else if (username && password) {
                    // Allow other users to login as 'user' role
                    const userData = { username, role: 'user' }
                    setUser(userData)
                    localStorage.setItem('showroom_user', JSON.stringify(userData))
                    resolve(userData)
                } else {
                    reject(new Error('Invalid credentials'))
                }
            }, 500)
        })
    }

    const signup = (username, password) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const userData = { username, role: 'user' }
                setUser(userData)
                localStorage.setItem('showroom_user', JSON.stringify(userData))
                resolve(userData)
            }, 500)
        })
    }

    const logout = () => {
        setUser(null)
        localStorage.removeItem('showroom_user')
    }

    const value = {
        user,
        login,
        signup,
        logout,
        loading
    }

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    )
}
