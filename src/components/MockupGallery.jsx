import { useNavigate } from 'react-router-dom'
import { useMockups } from '../hooks/useMockups'
import { useMemo } from 'react'

function MockupGallery({ filter }) {
    const { mockups, loading } = useMockups()
    const navigate = useNavigate()

    const filteredAndSorted = useMemo(() => {
        let result = filter && filter !== 'all'
            ? mockups.filter(m => m.type === filter)
            : [...mockups]

        // Default sort by newest first
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

        return result
    }, [mockups, filter])

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
                </div>
            ))}
        </div>
    )
}

export default MockupGallery
