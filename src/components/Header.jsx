import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Header() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/')
    }

    return (
        <header className="header">
            <div className="container header-content">
                <NavLink to="/" className="logo">
                    <div className="logo-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <rect x="7" y="7" width="10" height="10" rx="1" />
                        </svg>
                    </div>
                    <span>Showroom</span>
                </NavLink>

                <nav className="nav">
                    <NavLink
                        to="/create"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        Create
                    </NavLink>
                    <NavLink
                        to="/gallery"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        Gallery
                    </NavLink>

                    {user && user.role === 'admin' && (
                        <NavLink
                            to="/admin"
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        >
                            Admin
                        </NavLink>
                    )}

                    {!user ? (
                        <>
                            <NavLink to="/login" className="nav-link">
                                Log In
                            </NavLink>
                            <NavLink
                                to="/signup"
                                className="btn btn-primary"
                                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', color: 'white', textDecoration: 'none' }}
                            >
                                Sign Up
                            </NavLink>
                        </>
                    ) : (
                        <button
                            onClick={handleLogout}
                            className="nav-link"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontSize: '0.95rem'
                            }}
                        >
                            Log Out
                        </button>
                    )}
                </nav>
            </div>
        </header>
    )
}

export default Header
