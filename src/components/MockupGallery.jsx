import { useNavigate } from 'react-router-dom'
import { useMockups } from '../hooks/useMockups'
import { calculatePlacementAspect } from '../utils/imageUtils'
import { useMemo } from 'react'

function MockupGallery({ filter, designAspectCategory }) {
    const { mockups, loading } = useMockups()
    const navigate = useNavigate()

    const filteredAndSorted = useMemo(() => {
        let result = filter && filter !== 'all'
            ? mockups.filter(m => m.type === filter)
            : [...mockups]

        if (designAspectCategory) {
            result.forEach(m => {
                const aspect = calculatePlacementAspect(m)
                let cat = 'square'
                if (aspect < 0.95) cat = 'portrait'
                else if (aspect > 1.05) cat = 'landscape'

                m._aspectCategory = cat
                m._isRecommended = cat === designAspectCategory
            })

            // Sort recommended to top
            result.sort((a, b) => {
                if (a._isRecommended && !b._isRecommended) return -1
                if (!a._isRecommended && b._isRecommended) return 1
                return new Date(b.createdAt) - new Date(a.createdAt) // newer first
            })
        }

        return result
    }, [mockups, filter, designAspectCategory])

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
            {filteredAndSorted.map((mockup) => (
                <div
                    key={mockup.id}
                    className="card card-clickable gallery-item"
                    onClick={() => navigate(`/preview/${mockup.id}`)}
                    style={{ position: 'relative' }}
                >
                    <img src={mockup.image} alt={mockup.name || 'Mockup Template'} loading="lazy" decoding="async" />

                    {mockup._isRecommended && (
                        <div style={{
                            position: 'absolute',
                            top: '12px',
                            left: '12px',
                            background: 'var(--color-bg-primary)',
                            color: 'var(--color-accent-primary)',
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            <span style={{ fontSize: '1rem' }}>⭐️</span> Recommended
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}

export default MockupGallery
