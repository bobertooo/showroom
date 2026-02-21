import { useNavigate } from 'react-router-dom'
import { useMockups } from '../hooks/useMockups'
import { useBundle } from '../hooks/useBundle'
import { useAuth } from '../context/AuthContext'
import { useMemo, useState } from 'react'

function MockupGallery({ filter }) {
    const { mockups, loading } = useMockups()
    const { bundle, addToBundle, removeFromBundle } = useBundle()
    const { user } = useAuth()
    const navigate = useNavigate()
    const [hoveredId, setHoveredId] = useState(null)

    const filteredAndSorted = useMemo(() => {
        let result = filter && filter !== 'all'
            ? mockups.filter(m => m.type === filter)
            : [...mockups]

        // Default sort by newest first
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

        return result
    }, [mockups, filter])

    const handleBundleToggle = async (e, mockupId) => {
        e.stopPropagation()
        if (!user) {
            navigate('/login')
            return
        }

        if (bundle.includes(mockupId)) {
            await removeFromBundle(mockupId)
        } else {
            await addToBundle(mockupId)
        }
    }

    if (loading) {
        return (
            <div className="empty-state">
                <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                <p style={{ marginTop: 'var(--space-lg)' }}>Loading mockups...</p>
            </div>
        )
    }

    if (mockups.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">📦</div>
                <h3 className="empty-state-title">No Mockups Available</h3>
                <p className="empty-state-description">
                    Ask an admin to upload some mockup templates first.
                </p>
                <button
                    className="btn btn-primary"
                    onClick={() => navigate('/admin')}
                >
                    Go to Admin Panel
                </button>
            </div>
        )
    }



    if (filteredAndSorted.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <h3 className="empty-state-title">No Mockups Found</h3>
                <p className="empty-state-description">
                    No mockups match this category. Try a different filter.
                </p>
            </div>
        )
    }

    return (
        <div className="gallery-grid fade-in">
            {filteredAndSorted.map((mockup) => {
                const inBundle = bundle.includes(mockup.id)
                const isHovered = hoveredId === mockup.id

                return (
                    <div
                        key={mockup.id}
                        className="card card-clickable gallery-item"
                        onClick={() => navigate(`/preview/${mockup.id}`)}
                        onMouseEnter={() => setHoveredId(mockup.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        style={{ position: 'relative' }}
                    >
                        <img src={mockup.image} alt={mockup.name || 'Mockup Template'} loading="lazy" decoding="async" />

                        {(isHovered || inBundle) && (
                            <button
                                onClick={(e) => handleBundleToggle(e, mockup.id)}
                                className={`btn ${inBundle ? 'btn-primary' : 'btn-secondary'}`}
                                style={{
                                    position: 'absolute',
                                    top: '12px',
                                    right: '12px',
                                    padding: '4px 10px',
                                    fontSize: '0.8rem',
                                    opacity: (isHovered || inBundle) ? 1 : 0,
                                    transition: 'opacity 0.2s',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                {inBundle ? (
                                    <><span>✓</span> Added</>
                                ) : (
                                    <><span>+</span> Bundle</>
                                )}
                            </button>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

export default MockupGallery
