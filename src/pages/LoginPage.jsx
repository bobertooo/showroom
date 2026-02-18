
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'

function LoginPage() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    // Redirect to where they were trying to go, or home
    const from = location.state?.from?.pathname || '/'

    // Check for Google OAuth error
    const params = new URLSearchParams(location.search)
    const googleError = params.get('error')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await login(username, password)
            navigate(from, { replace: true })
        } catch (err) {
            setError(err.message || 'Invalid credentials')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container" style={{ maxWidth: '400px', padding: 'var(--space-3xl) 0' }}>
            <div className="card" style={{ padding: 'var(--space-xl)' }}>
                <h2 style={{ marginBottom: 'var(--space-lg)', textAlign: 'center' }}>Welcome Back</h2>

                {(error || googleError) && (
                    <div style={{
                        background: '#fee2e2',
                        color: '#dc2626',
                        padding: 'var(--space-sm)',
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: 'var(--space-md)',
                        fontSize: '0.9rem'
                    }}>
                        {error || (googleError === 'google_not_configured'
                            ? 'Google sign-in is not configured yet. Please use username & password, or add Google OAuth credentials to .env.'
                            : 'Google sign-in failed. Please try again.')}
                    </div>
                )}

                {/* Google Sign-In */}
                <a
                    href="/api/auth/google"
                    className="btn btn-secondary"
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        marginBottom: 'var(--space-lg)',
                        textDecoration: 'none'
                    }}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Sign in with Google
                </a>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-md)',
                    marginBottom: 'var(--space-lg)',
                    color: 'var(--color-text-muted)',
                    fontSize: '0.85rem'
                }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
                    or
                    <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Username</label>
                        <input
                            type="text"
                            className="form-input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div style={{ marginTop: 'var(--space-lg)', textAlign: 'center', fontSize: '0.9rem' }}>
                    Don't have an account? <Link to="/signup" style={{ fontWeight: '600' }}>Sign up</Link>
                </div>
            </div>
        </div>
    )
}

export default LoginPage
