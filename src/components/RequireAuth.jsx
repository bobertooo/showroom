
import { useAuth } from '../context/AuthContext'
import { Navigate, useLocation } from 'react-router-dom'

function RequireAuth({ children, adminOnly = false }) {
    const { user, loading } = useAuth()
    const location = useLocation()

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>Loading...</div>
    }

    if (!user) {
        // Redirect them to the /login page, but save the current location they were
        // trying to go to when they were redirected. This allows us to send them
        // along to that page after they login, which is a nicer user experience.
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    if (adminOnly && user.username !== 'robert') {
        // If user is logged in but not authorized, redirect to home
        return <Navigate to="/" replace />
    }

    return children
}

export default RequireAuth
