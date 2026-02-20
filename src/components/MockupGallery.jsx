import { useNavigate } from 'react-router-dom'
import { useMockups } from '../hooks/useMockups'
import { calculatePlacementAspect } from '../utils/imageUtils'
import { useMemo } from 'react'

function MockupGallery({ filter, designAspectRatio }) {
    const { mockups, loading } = useMockups()
    const navigate = useNavigate()

    const filteredAndSorted = useMemo(() => {
        let result = filter && filter !== 'all'
            ? mockups.filter(m => m.type === filter)
            : [...mockups]

        if (designAspectRatio) {
            result.forEach(m => {
                const aspect = calculatePlacementAspect(m)

                // Using log comparison to treat ratios symmetrically (e.g. 1:2 and 2:1 are equally distant from 1:1)
                m._logAspectDiff = Math.abs(Math.log(aspect / designAspectRatio))
            })

            // Sort closest match to the top
            result.sort((a, b) => {
                const diffA = a._logAspectDiff ?? 999
                const diffB = b._logAspectDiff ?? 999
                if (diffA !== diffB) return diffA - diffB
                return new Date(b.createdAt) - new Date(a.createdAt) // newer first if equal match
            })

            // Mark the strongest matches as Recommended
            result.forEach((m, idx) => {
                // Recommend if it's one of the top 2 closest, OR if its aspect ratio is extremely close (< 10% diff)
                m._isRecommended = idx < 2 || m._logAspectDiff < 0.1
            })
        }

        return result
    }, [mockups, filter, designAspectRatio])

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
