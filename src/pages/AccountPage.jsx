import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useBundle } from '../hooks/useBundle'
import { useMockups } from '../hooks/useMockups'

function AccountPage() {
    const { user } = useAuth()
    const { bundle, loading: bundleLoading } = useBundle()
    const { mockups, loading: mockupsLoading } = useMockups()
    const navigate = useNavigate()

    if (!user) {
        return null // RequireAuth handles redirect
    }

    const bundleMockups = bundle.map(id => mockups.find(m => m.id === id)).filter(Boolean).slice(0, 4)

    return (
        <div className="page fade-in">
            <div className="container" style={{ maxWidth: '800px' }}>
                <h1 style={{ marginBottom: 'var(--space-2xl)', textAlign: 'center' }}>My Account</h1>

                {/* Profile Section */}
                <div className="card" style={{ padding: 'var(--space-xl)', marginBottom: 'var(--space-2xl)' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-lg)' }}>Profile Details</h2>
                    <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Name</div>
                            <div style={{ fontWeight: '500' }}>{user.displayName || user.username || 'N/A'}</div>
                        </div>
                        {user.email && (
                            <div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Email</div>
                                <div style={{ fontWeight: '500' }}>{user.email}</div>
                            </div>
                        )}
                        <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Role</div>
                            <div style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                background: user.role === 'admin' ? 'var(--color-accent-primary)' : 'var(--color-bg-secondary)',
                                color: user.role === 'admin' ? 'white' : 'var(--color-text)',
                                borderRadius: '999px',
                                fontSize: '0.75rem',
                                fontWeight: '600'
                            }}>
                                {user.role === 'admin' ? 'Admin' : 'User'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Saved Bundles Section */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>My Saved Bundles</h2>
                    <div style={{
                        height: '1px', flex: 1,
                        background: 'linear-gradient(to right, var(--color-border), transparent)'
                    }} />
                </div>

                {bundleLoading || mockupsLoading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div className="loading-spinner" />
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-lg)' }}>
                        <div
                            className="card card-clickable"
                            style={{ overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                            onClick={() => navigate(`/pack/my-bundle`)}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)' }}
                            onMouseLeave={e => { e.currentTarget.style.transform = '' }}
                        >
                            {/* Thumbnail grid */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: bundleMockups.length >= 2 ? '1fr 1fr' : '1fr',
                                gridTemplateRows: bundleMockups.length >= 3 ? '1fr 1fr' : '1fr',
                                aspectRatio: '1',
                                overflow: 'hidden',
                                background: 'var(--color-bg-secondary)'
                            }}>
                                {bundleMockups.length === 0 ? (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>📦</div>
                                ) : (
                                    bundleMockups.map((m, i) => (
                                        <img key={m.id} src={m.image} alt={m.name} style={{
                                            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                                            opacity: i === 3 && bundle.length > 4 ? 0.6 : 1
                                        }} />
                                    ))
                                )}
                                {bundleMockups.length === 4 && bundle.length > 4 && (
                                    <div style={{
                                        position: 'absolute', bottom: 0, right: 0,
                                        background: 'rgba(0,0,0,0.6)', color: 'white',
                                        fontSize: '0.75rem', padding: '3px 6px', borderTopLeftRadius: '6px'
                                    }}>
                                        +{bundle.length - 4} more
                                    </div>
                                )}
                            </div>

                            {/* Pack info */}
                            <div style={{ padding: 'var(--space-md)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <div style={{ fontWeight: '700', fontSize: '1rem' }}>My Bundle</div>
                                    <div style={{
                                        background: 'var(--color-accent-primary)', color: 'white',
                                        fontSize: '0.7rem', fontWeight: '600', borderRadius: '999px',
                                        padding: '2px 8px'
                                    }}>
                                        {bundle.length} template{bundle.length !== 1 ? 's' : ''}
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                                    Your custom collection of mockup templates
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default AccountPage
