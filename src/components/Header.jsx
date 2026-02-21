import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useRef, useEffect } from 'react'

function Header() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [menuOpen, setMenuOpen] = useState(false)
    const menuRef = useRef(null)

    const handleLogout = () => {
        setMenuOpen(false)
        logout()
        navigate('/')
    }

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false)
            }
        }
        if (menuOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [menuOpen])

    // Get user initials for the avatar
    const getInitials = () => {
        if (!user) return '?'
        if (user.displayName) {
            return user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        }
        if (user.username) {
            return user.username.slice(0, 2).toUpperCase()
        }
        return '?'
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
                        <div className="account-menu" ref={menuRef}>
                            <button
                                className="account-avatar"
                                onClick={() => setMenuOpen(!menuOpen)}
                                aria-label="My Account"
                                title={user.displayName || user.username}
                            >
                                {getInitials()}
                            </button>

                            {menuOpen && (
                                <div className="account-dropdown">
                                    <div className="account-dropdown-header">
                                        <div className="account-dropdown-name">
                                            {user.displayName || user.username}
                                        </div>
                                        {user.email && (
                                            <div className="account-dropdown-email">
                                                {user.email}
                                            </div>
                                        )}
                                    </div>
                                    <div className="account-dropdown-divider" />
                                    <button
                                        className="account-dropdown-item"
                                        onClick={() => {
                                            setMenuOpen(false)
                                            navigate('/account')
                                        }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                        My Account
                                    </button>
                                    <button
                                        className="account-dropdown-item"
                                        onClick={handleLogout}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                            <polyline points="16 17 21 12 16 7" />
                                            <line x1="21" y1="12" x2="9" y2="12" />
                                        </svg>
                                        Log Out
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </nav>
            </div>
        </header>
    )
}

export default Header
