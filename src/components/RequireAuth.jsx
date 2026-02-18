
import { useAuth } from '../context/AuthContext'
import { Navigate, useLocation } from 'react-router-dom'

function RequireAuth({ children, adminOnly = false }) {
    const { user, loading } = useAuth()
    const location = useLocation()

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>Loading...</div>
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    if (adminOnly && user.role !== 'admin') {
        return <Navigate to="/" replace />
    }

    return children
}

export default RequireAuth
