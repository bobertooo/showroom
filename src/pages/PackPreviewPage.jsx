import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import JSZip from 'jszip'
import { getAllPacks } from '../utils/storage'
import { useMockups } from '../hooks/useMockups'
import { getCurrentDesign } from '../utils/storage'
import { compositeImages } from '../utils/imageUtils'
import DesignEditModal from '../components/DesignEditModal'

// Export aspect ratios: null = original mockup dimensions
const ASPECT_RATIOS = [
    { label: 'Original', value: null },
    { label: '1:1', value: 1 },
    { label: '4:5', value: 4 / 5 },
    { label: '3:4', value: 3 / 4 },
    { label: '16:9', value: 16 / 9 },
]

function cropCanvasToRatio(srcCanvas, ratio) {
    if (!ratio) return srcCanvas
    const srcW = srcCanvas.width
    const srcH = srcCanvas.height
    const srcRatio = srcW / srcH

    let cropW, cropH, offsetX, offsetY
    if (srcRatio > ratio) {
        // wider than target — crop left/right
        cropH = srcH
        cropW = Math.round(srcH * ratio)
        offsetX = Math.round((srcW - cropW) / 2)
        offsetY = 0
    } else {
        // taller than target — crop top/bottom
        cropW = srcW
        cropH = Math.round(srcW / ratio)
        offsetX = 0
        offsetY = Math.round((srcH - cropH) / 2)
    }

    const out = document.createElement('canvas')
    out.width = cropW
    out.height = cropH
    out.getContext('2d').drawImage(srcCanvas, -offsetX, -offsetY)
    return out
}

function PackMockupItem({ mockup, designImage, aspectRatio, transform, selected, onToggle, onEdit, index }) {
    const canvasRef = useRef(null)
    const [status, setStatus] = useState('rendering') // 'rendering' | 'done' | 'error'

    useEffect(() => {
        if (!mockup || !designImage) return
        setStatus('rendering')
        const shouldClip = mockup.type === 'wall-art' || mockup.type === 'poster'
        const canvas = canvasRef.current
        if (!canvas) return
        compositeImages(canvas, mockup.image, designImage, mockup.placement, transform, shouldClip, mockup.type)
            .then(() => setStatus('done'))
            .catch(() => setStatus('error'))
    }, [mockup, designImage, transform])

    const handleDownload = () => {
        if (!canvasRef.current || status !== 'done') return
        const cropped = cropCanvasToRatio(canvasRef.current, aspectRatio)
        const link = document.createElement('a')
        link.download = `${mockup.name || `mockup-${index + 1}`}.jpg`
        link.href = cropped.toDataURL('image/jpeg', 0.92)
        link.click()
    }

    return (
        <div
            className="pack-preview-item card"
            style={{
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                border: selected ? '2px solid var(--color-accent-primary)' : '2px solid var(--color-border)',
                transition: 'border-color 0.2s ease',
            }}
        >
            {/* Selection checkbox */}
            <div
                onClick={onToggle}
                style={{
                    position: 'absolute', top: '10px', left: '10px', zIndex: 10,
                    width: '24px', height: '24px', borderRadius: '6px',
                    background: selected ? 'var(--color-accent-primary)' : 'rgba(0,0,0,0.5)',
                    border: '2px solid white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'background 0.2s',
                }}
            >
                {selected && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                )}
            </div>

            {/* Render status */}
            {status === 'rendering' && (
                <div style={{
                    position: 'absolute', inset: 0, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    background: 'var(--color-bg-secondary)', zIndex: 5
                }}>
                    <div className="loading-spinner" />
                </div>
            )}
            {status === 'error' && (
                <div style={{
                    position: 'absolute', inset: 0, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    background: 'var(--color-bg-secondary)', zIndex: 5,
                    color: 'var(--color-error)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem'
                }}>
                    Failed to render
                </div>
            )}

            <canvas ref={canvasRef} style={{ width: '100%', display: 'block' }} />

            {/* Mockup name + download */}
            <div style={{
                padding: '10px 12px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: '8px', background: 'var(--color-bg-card)'
            }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {mockup.name || `Mockup ${index + 1}`}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        className="btn btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '4px 10px', whiteSpace: 'nowrap', flexShrink: 0 }}
                        onClick={(e) => { e.stopPropagation(); onEdit() }}
                    >
                        ✏️ Edit
                    </button>
                    <button
                        className="btn btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '4px 10px', whiteSpace: 'nowrap', flexShrink: 0 }}
                        onClick={(e) => { e.stopPropagation(); handleDownload() }}
                        disabled={status !== 'done'}
                    >
                        ↓ Save
                    </button>
                </div>
            </div>
        </div>
    )
}

function PackPreviewPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { mockups, loading: mockupsLoading } = useMockups()
    const [pack, setPack] = useState(null)
    const [packLoading, setPackLoading] = useState(true)
    const [design, setDesign] = useState(null)
    const [aspectRatio, setAspectRatio] = useState(null) // null = original
    const [selected, setSelected] = useState(new Set())
    const [downloading, setDownloading] = useState(false)
    const [transforms, setTransforms] = useState({})
    const [editingMockupId, setEditingMockupId] = useState(null)

    const defaultTransform = { scale: 1, offsetX: 0, offsetY: 0, fillMode: 'fill' }

    // Load current design
    useEffect(() => {
        setDesign(getCurrentDesign())
    }, [])

    // Load pack by id
    useEffect(() => {
        getAllPacks().then(packs => {
            const found = packs.find(p => p.id === id)
            setPack(found || null)
            setPackLoading(false)
        }).catch(() => setPackLoading(false))
    }, [id])

    // Derive the mockups that belong to this pack
    const packMockups = pack && !mockupsLoading
        ? pack.mockupIds.map(mid => mockups.find(m => m.id === mid)).filter(Boolean)
        : []

    // Auto-select all on load
    useEffect(() => {
        if (packMockups.length > 0) {
            setSelected(new Set(packMockups.map(m => m.id)))
        }
    }, [packMockups.length])

    const toggleSelected = useCallback((id) => {
        setSelected(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }, [])

    const toggleAll = () => {
        if (selected.size === packMockups.length) {
            setSelected(new Set())
        } else {
            setSelected(new Set(packMockups.map(m => m.id)))
        }
    }

    // Collect canvases from child components via a registry ref
    const canvasRegistry = useRef({}) // id -> canvasRef

    const handleDownloadSelected = async () => {
        if (selected.size === 0) return
        setDownloading(true)
        try {
            const zip = new JSZip()
            const selectedMockups = packMockups.filter(m => selected.has(m.id))

            // We re-render each selected mockup to a fresh canvas for download
            for (let i = 0; i < selectedMockups.length; i++) {
                const mockup = selectedMockups[i]
                const canvas = document.createElement('canvas')
                const shouldClip = mockup.type === 'wall-art' || mockup.type === 'poster'
                const transform = transforms[mockup.id] || defaultTransform
                await compositeImages(canvas, mockup.image, design, mockup.placement, transform, shouldClip, mockup.type)
                const cropped = cropCanvasToRatio(canvas, aspectRatio)
                const blob = await new Promise(resolve => cropped.toBlob(resolve, 'image/jpeg', 0.92))
                zip.file(`${mockup.name || `mockup-${i + 1}`}.jpg`, blob)
            }

            const content = await zip.generateAsync({ type: 'blob' })
            const url = URL.createObjectURL(content)
            const a = document.createElement('a')
            a.href = url
            a.download = `${pack.name || 'pack'}-mockups.zip`
            a.click()
            URL.revokeObjectURL(url)
        } catch (err) {
            console.error('Download failed:', err)
        } finally {
            setDownloading(false)
        }
    }

    const isLoading = packLoading || mockupsLoading

    if (isLoading) {
        return (
            <div className="page fade-in">
                <div className="container" style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
                    <div className="loading-spinner" />
                </div>
            </div>
        )
    }

    if (!pack) {
        return (
            <div className="page fade-in">
                <div className="container">
                    <div className="empty-state">
                        <div className="empty-state-icon">📦</div>
                        <h3 className="empty-state-title">Pack Not Found</h3>
                        <p className="empty-state-description">This pack doesn't exist or has been deleted.</p>
                        <button className="btn btn-primary" onClick={() => navigate('/gallery')}>Back to Gallery</button>
                    </div>
                </div>
            </div>
        )
    }

    if (!design) {
        return (
            <div className="page fade-in">
                <div className="container">
                    <div className="empty-state">
                        <div className="empty-state-icon">🎨</div>
                        <h3 className="empty-state-title">No Design Uploaded</h3>
                        <p className="empty-state-description">Upload your design first, then apply this pack.</p>
                        <button className="btn btn-primary" onClick={() => navigate('/create')}>Upload Design</button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="page fade-in">
            <div className="container">
                {/* Header */}
                <div style={{ marginBottom: 'var(--space-2xl)' }}>
                    <button
                        className="btn btn-secondary"
                        style={{ marginBottom: 'var(--space-lg)', fontSize: '0.85rem' }}
                        onClick={() => navigate('/gallery')}
                    >
                        ← Back to Gallery
                    </button>
                    <h1 style={{ marginBottom: 'var(--space-xs)' }}>{pack.name}</h1>
                    {pack.description && (
                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)' }}>
                            {pack.description}
                        </p>
                    )}

                    {/* Controls bar */}
                    <div className="card" style={{
                        padding: 'var(--space-md) var(--space-lg)',
                        display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
                        flexWrap: 'wrap'
                    }}>
                        {/* Aspect ratio selector */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                                Export Ratio:
                            </span>
                            {ASPECT_RATIOS.map(r => (
                                <button
                                    key={r.label}
                                    className={`btn ${aspectRatio === r.value ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ fontSize: '0.8rem', padding: '5px 12px' }}
                                    onClick={() => setAspectRatio(r.value)}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>

                        <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--space-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                {selected.size}/{packMockups.length} selected
                            </span>
                            <button
                                className="btn btn-secondary"
                                style={{ fontSize: '0.8rem', padding: '5px 12px' }}
                                onClick={toggleAll}
                            >
                                {selected.size === packMockups.length ? 'Deselect All' : 'Select All'}
                            </button>
                            <button
                                className="btn btn-primary"
                                style={{ fontSize: '0.85rem' }}
                                onClick={handleDownloadSelected}
                                disabled={selected.size === 0 || downloading}
                            >
                                {downloading
                                    ? 'Preparing ZIP…'
                                    : `↓ Download${selected.size > 0 ? ` (${selected.size})` : ''}`
                                }
                            </button>
                        </div>
                    </div>
                </div>

                {/* Pack mockup grid */}
                {packMockups.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🖼️</div>
                        <h3 className="empty-state-title">No templates in this pack</h3>
                        <p className="empty-state-description">An admin needs to add mockups to this pack.</p>
                    </div>
                ) : (
                    <div className="pack-preview-grid">
                        {packMockups.map((mockup, i) => (
                            <PackMockupItem
                                key={mockup.id}
                                mockup={mockup}
                                designImage={design}
                                aspectRatio={aspectRatio}
                                transform={transforms[mockup.id] || defaultTransform}
                                selected={selected.has(mockup.id)}
                                onToggle={() => toggleSelected(mockup.id)}
                                onEdit={() => setEditingMockupId(mockup.id)}
                                index={i}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingMockupId && (
                <DesignEditModal
                    mockup={packMockups.find(m => m.id === editingMockupId)}
                    designImage={design}
                    initialTransform={transforms[editingMockupId] || defaultTransform}
                    onSave={(newTransform) => {
                        setTransforms(prev => ({ ...prev, [editingMockupId]: newTransform }))
                        setEditingMockupId(null)
                    }}
                    onClose={() => setEditingMockupId(null)}
                />
            )}
        </div>
    )
}

export default PackPreviewPage
