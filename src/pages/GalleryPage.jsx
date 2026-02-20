import MockupGallery from '../components/MockupGallery'
import { getCurrentDesign } from '../utils/storage'
import { useMockups } from '../hooks/useMockups'
import { usePacks } from '../hooks/usePacks'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState, useMemo } from 'react'
import { calculatePlacementAspect } from '../utils/imageUtils'

const TYPE_LABELS = {
    'all': 'All',
    'wall-art': 'Wall Art',
    'poster': 'Poster',
    'clothing': 'Clothing',
    'accessories': 'Accessories'
}

function PackCard({ pack, mockups }) {
    const navigate = useNavigate()
    const packMockups = pack.mockupIds
        .map(id => mockups.find(m => m.id === id))
        .filter(Boolean)
        .slice(0, 4)

    return (
        <div
            className="card card-clickable"
            style={{ overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onClick={() => navigate(`/pack/${pack.id}`)}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = '' }}
        >
            {/* Thumbnail grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: packMockups.length >= 2 ? '1fr 1fr' : '1fr',
                gridTemplateRows: packMockups.length >= 3 ? '1fr 1fr' : '1fr',
                aspectRatio: '1',
                overflow: 'hidden',
                background: 'var(--color-bg-secondary)'
            }}>
                {packMockups.length === 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>📦</div>
                ) : (
                    packMockups.map((m, i) => (
                        <img key={m.id} src={m.image} alt={m.name} style={{
                            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                            opacity: i === 3 && pack.mockupIds.length > 4 ? 0.6 : 1
                        }} />
                    ))
                )}
                {packMockups.length === 4 && pack.mockupIds.length > 4 && (
                    <div style={{
                        position: 'absolute', bottom: 0, right: 0,
                        background: 'rgba(0,0,0,0.6)', color: 'white',
                        fontSize: '0.75rem', padding: '3px 6px', borderTopLeftRadius: '6px'
                    }}>
                        +{pack.mockupIds.length - 4} more
                    </div>
                )}
            </div>

            {/* Pack info */}
            <div style={{ padding: 'var(--space-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ fontWeight: '700', fontSize: '1rem' }}>{pack.name}</div>
                    <div style={{
                        background: 'var(--color-accent-primary)', color: 'white',
                        fontSize: '0.7rem', fontWeight: '600', borderRadius: '999px',
                        padding: '2px 8px'
                    }}>
                        {pack.mockupIds.length} template{pack.mockupIds.length !== 1 ? 's' : ''}
                    </div>
                </div>
                {pack.description && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                        {pack.description}
                    </div>
                )}
                <div style={{
                    marginTop: 'var(--space-sm)', fontSize: '0.8rem', color: 'var(--color-accent-primary)',
                    fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                    Apply to all templates
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </div>
            </div>
        </div>
    )
}

function GalleryPage() {
    const navigate = useNavigate()
    const [design, setDesign] = useState(null)
    const [filter, setFilter] = useState('all')
    const [isIndividualCollapsed, setIsIndividualCollapsed] = useState(false)
    const [designAspectCategory, setDesignAspectCategory] = useState(null)
    const { mockups } = useMockups()
    const { packs, loading: packsLoading } = usePacks()

    useEffect(() => {
        const currentDesign = getCurrentDesign()
        setDesign(currentDesign)

        if (currentDesign) {
            const img = new Image()
            img.onload = () => {
                const aspect = img.width / img.height
                if (aspect < 0.95) setDesignAspectCategory('portrait')
                else if (aspect > 1.05) setDesignAspectCategory('landscape')
                else setDesignAspectCategory('square')
            }
            img.src = currentDesign
        }
    }, [])

    // Derive available types from the actual mockups
    const availableTypes = useMemo(() => {
        const types = new Set(mockups.map(m => m.type))
        return ['all', ...Object.keys(TYPE_LABELS).filter(k => k !== 'all' && types.has(k))]
    }, [mockups])

    return (
        <div className="page fade-in">
            <div className="container">
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    marginBottom: 'var(--space-2xl)'
                }}>
                    <h1 style={{ marginBottom: 'var(--space-md)' }}>
                        Choose a Mockup
                    </h1>

                    {design ? (
                        <div className="card" style={{
                            padding: 'var(--space-md)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-md)',
                            maxWidth: '500px',
                            margin: '0 auto',
                            marginBottom: 'var(--space-lg)'
                        }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                background: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23333\' fill-opacity=\'0.2\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M0 0h10v10H0zM10 10h10v10H10z\'/%3E%3C/g%3E%3C/svg%3E")',
                                borderRadius: 'var(--radius-md)',
                                overflow: 'hidden',
                                flexShrink: 0,
                                border: '1px solid var(--color-border)'
                            }}>
                                <img
                                    src={design}
                                    alt="Current Design"
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                            </div>
                            <div style={{ flex: 1, textAlign: 'left' }}>
                                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                                    Current Design
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        className="btn btn-secondary"
                                        style={{ fontSize: '0.8rem', padding: '4px 12px' }}
                                        onClick={() => navigate('/create')}
                                    >
                                        Change Design
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="card" style={{
                            padding: 'var(--space-lg)',
                            marginBottom: 'var(--space-xl)',
                            textAlign: 'center',
                            background: 'rgba(245, 158, 11, 0.1)',
                            borderColor: 'var(--color-warning)'
                        }}>
                            <p style={{ color: 'var(--color-warning)', marginBottom: 'var(--space-md)' }}>
                                ⚠️ You haven't uploaded a design yet
                            </p>
                            <button
                                className="btn btn-primary"
                                onClick={() => navigate('/create')}
                            >
                                Upload Design First
                            </button>
                        </div>
                    )}

                </div>

                {/* Individual mockups section - Collapsible */}
                <div style={{ marginBottom: 'var(--space-2xl)' }}>
                    <div
                        style={{
                            display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)',
                            cursor: 'pointer', userSelect: 'none'
                        }}
                        onClick={() => setIsIndividualCollapsed(!isIndividualCollapsed)}
                    >
                        <h2 style={{ margin: 0, fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            Individual Mockups
                            <svg
                                width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                style={{
                                    transform: isIndividualCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.2s ease'
                                }}
                            >
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </h2>
                        <div style={{
                            height: '1px', flex: 1,
                            background: 'linear-gradient(to right, var(--color-border), transparent)'
                        }} />
                    </div>

                    {!isIndividualCollapsed && (
                        <div className="fade-in">
                            {/* Filter bar */}
                            {availableTypes.length > 2 && (
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'flex-start',
                                    gap: 'var(--space-sm)',
                                    marginBottom: 'var(--space-md)',
                                    flexWrap: 'wrap'
                                }}>
                                    {availableTypes.map(type => (
                                        <button
                                            key={type}
                                            className={`btn ${filter === type ? 'btn-primary' : 'btn-secondary'}`}
                                            style={{ fontSize: '0.85rem', padding: '6px 16px' }}
                                            onClick={() => setFilter(type)}
                                        >
                                            {TYPE_LABELS[type] || type}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <MockupGallery filter={filter} designAspectCategory={designAspectCategory} />
                        </div>
                    )}
                </div>

                {/* Packs section */}
                <div style={{ marginBottom: 'var(--space-2xl)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                        <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Mockup Bundles</h2>
                        <div style={{
                            height: '1px', flex: 1,
                            background: 'linear-gradient(to right, var(--color-border), transparent)'
                        }} />
                    </div>
                    <div className="fade-in">
                        {packsLoading ? (
                            <div style={{ textAlign: 'center', padding: '2rem' }}>
                                <div className="loading-spinner" />
                            </div>
                        ) : packs.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">📦</div>
                                <h3 className="empty-state-title">No Bundles Yet</h3>
                                <p className="empty-state-description">Check back later or ask an admin to create a bundle.</p>
                            </div>
                        ) : (
                            <div className="gallery-grid">
                                {packs.map(pack => (
                                    <PackCard key={pack.id} pack={pack} mockups={mockups} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default GalleryPage

