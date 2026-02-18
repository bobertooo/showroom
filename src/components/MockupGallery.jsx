import { useNavigate } from 'react-router-dom'
import { useMockups } from '../hooks/useMockups'

function MockupGallery({ filter }) {
    const { mockups, loading } = useMockups()
    const navigate = useNavigate()

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

    const filtered = filter && filter !== 'all'
        ? mockups.filter(m => m.type === filter)
        : mockups

    if (filtered.length === 0) {
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
            {filtered.map((mockup) => (
                <div
                    key={mockup.id}
                    className="card card-clickable gallery-item"
                    onClick={() => navigate(`/preview/${mockup.id}`)}
                >
                    <img src={mockup.image} alt={mockup.name || 'Mockup Template'} />
                </div>
            ))}
        </div>
    )
}

export default MockupGallery
