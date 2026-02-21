import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { compositeImages, downloadCanvas, preloadImages, quickComposite } from '../utils/imageUtils'
import DesignTransformOverlay from './DesignTransformOverlay'
import { useAuth } from '../context/AuthContext'


function MockupPreview({ mockup, designImage, initialTransform, onSave, onCancel }) {
    const canvasRef = useRef(null)
    const navigate = useNavigate()
    const { user } = useAuth()
    const isAdmin = user?.role === 'admin'
    const [initialLoading, setInitialLoading] = useState(true)
    const [error, setError] = useState(null)
    const [transform, setTransform] = useState(initialTransform || { scale: 1, offsetX: 0, offsetY: 0, fillMode: 'fit' })
    const [designSelected, setDesignSelected] = useState(false)
    const [hoveredFillBtn, setHoveredFillBtn] = useState(null)
    const hasLoadedOnce = useRef(false)
    const isDraggingRef = useRef(false)
    const cachedImagesRef = useRef(null)
    const renderTimerRef = useRef(null)
    const rafRef = useRef(null)

    // Preload and cache images when mockup/design changes
    useEffect(() => {
        if (!mockup || !currentDesignImage) return
        preloadImages(mockup.image, currentDesignImage)
            .then(imgs => { cachedImagesRef.current = imgs })
            .catch(() => { })
    }, [mockup, currentDesignImage])

    // Full-quality render — debounced via setTimeout to stay non-blocking
    useEffect(() => {
        if (!mockup || !currentDesignImage) return
        if (isDraggingRef.current) return

        // Cancel any pending render
        if (renderTimerRef.current) {
            clearTimeout(renderTimerRef.current)
        }

        if (!hasLoadedOnce.current) {
            setInitialLoading(true)
        }
        setError(null)

        // Defer the expensive warp so the browser can process pending events
        renderTimerRef.current = setTimeout(async () => {
            try {
                const canvas = canvasRef.current
                if (canvas) {
                    const shouldClip = mockup.type === 'wall-art' || mockup.type === 'poster';
                    await compositeImages(canvas, mockup.image, currentDesignImage, mockup.placement, transform, shouldClip, mockup.type)
                }
                hasLoadedOnce.current = true
                setInitialLoading(false)
            } catch (err) {
                console.error('Failed to render preview:', err)
                setError('Failed to render preview. Please try again.')
                setInitialLoading(false)
            }
        }, 0)

        return () => {
            if (renderTimerRef.current) {
                clearTimeout(renderTimerRef.current)
            }
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current)
            }
        }
    }, [mockup, currentDesignImage, transform])

    // Handle live transform updates during drag & keyboard
    const handleTransformChange = useCallback((newTransform) => {
        setTransform(newTransform)

        // Throttle canvas redraws to one per animation frame
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null
            if (cachedImagesRef.current && canvasRef.current) {
                const { mockupImg, designImg } = cachedImagesRef.current
                const shouldClip = mockup.type === 'wall-art' || mockup.type === 'poster';
                quickComposite(canvasRef.current, mockupImg, designImg, mockup.placement, newTransform, shouldClip, mockup.type)
            }
        })
    }, [mockup])

    const handleDraggingChange = useCallback((dragging) => {
        isDraggingRef.current = dragging
        if (!dragging) {
            // Drag ended — trigger full quality re-render
            setTransform(t => ({ ...t }))
        }
    }, [])

    const handleDownload = () => {
        if (canvasRef.current) {
            downloadCanvas(canvasRef.current, `mockup-${mockup.name.toLowerCase().replace(/\s+/g, '-')}.jpg`)
        }
    }

    const handleReset = useCallback(() => {
        setTransform({ scale: 1, offsetX: 0, offsetY: 0, fillMode: 'fit' })
    }, [])

    if (!mockup) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <h3 className="empty-state-title">Mockup Not Found</h3>
                <p className="empty-state-description">
                    This mockup template doesn't exist or has been deleted.
                </p>
                <button
                    className="btn btn-primary"
                    onClick={() => navigate('/gallery')}
                >
                    Back to Gallery
                </button>
            </div>
        )
    }

    const currentDesignImage = designImage || "data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23666' fill-opacity='0.2' fill-rule='evenodd'%3E%3Cpath d='M0 0h10v10H0zM10 10h10v10H10z'/%3E%3C/g%3E%3C/svg%3E";

    const isDefaultTransform = transform.scale === 1 && transform.offsetX === 0 && transform.offsetY === 0 && transform.fillMode === 'fit'

    const toggleFillMode = () => {
        setTransform(t => ({ ...t, fillMode: t.fillMode === 'fit' ? 'fill' : 'fit' }))
    }



    const isModal = !!onSave

    const content = (
        <div className={`preview-layout ${isModal ? '' : 'fade-in'}`} style={isModal ? {
            background: 'var(--color-bg-primary)',
            borderRadius: '12px',
            overflow: 'hidden',
            width: '90vw',
            maxWidth: '1200px',
            maxHeight: '90vh',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'row'
        } : {}}>
            {/* Left: Canvas preview */}
            <div className="preview-canvas-side">
                <div className="preview-canvas-wrapper">
                    {initialLoading && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: '300px'
                        }}>
                            <div className="loading-spinner"></div>
                        </div>
                    )}

                    {error && (
                        <div style={{
                            padding: 'var(--space-xl)',
                            textAlign: 'center',
                            color: 'var(--color-error)'
                        }}>
                            {error}
                        </div>
                    )}

                    <div className="preview-canvas-container">
                        <canvas
                            ref={canvasRef}
                            className="preview-canvas"
                            style={{
                                display: initialLoading || error ? 'none' : 'block',
                                ...(canvasRef.current?.width > 0 ? { aspectRatio: `${canvasRef.current.width} / ${canvasRef.current.height}` } : {})
                            }}
                        />
                        {!initialLoading && !error && (
                            <DesignTransformOverlay
                                mockup={mockup}
                                designImage={currentDesignImage}
                                transform={transform}
                                onTransformChange={handleTransformChange}
                                canvasRef={canvasRef}
                                selected={designSelected}
                                onSelect={() => setDesignSelected(true)}
                                onDeselect={() => setDesignSelected(false)}
                                onDraggingChange={handleDraggingChange}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Right: Controls panel */}
            <div className="preview-controls-panel">
                <h3 style={{ marginBottom: 'var(--space-md)', fontSize: '1.1rem' }}>Controls</h3>

                {(mockup.type === 'wall-art' || mockup.type === 'poster') && (
                    <div className="preview-control-group">
                        <label className="preview-control-label">Aspect Ratio</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <div style={{ flex: 1, position: 'relative' }}
                                onMouseEnter={() => setHoveredFillBtn('fit')}
                                onMouseLeave={() => setHoveredFillBtn(null)}
                            >
                                {hoveredFillBtn === 'fit' && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '100%',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        marginBottom: '8px',
                                        padding: '6px 10px',
                                        background: 'rgba(0,0,0,0.85)',
                                        color: 'white',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        pointerEvents: 'none',
                                        whiteSpace: 'nowrap',
                                        zIndex: 10,
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                    }}>
                                        Keeps original aspect ratio
                                        <div style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: '50%',
                                            marginLeft: '-5px',
                                            borderWidth: '5px',
                                            borderStyle: 'solid',
                                            borderColor: 'rgba(0,0,0,0.85) transparent transparent transparent'
                                        }} />
                                    </div>
                                )}
                                <button
                                    className={`btn ${transform.fillMode === 'fit' ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setTransform(t => ({ ...t, fillMode: 'fit' }))}
                                    style={{ width: '100%' }}
                                >
                                    Fit
                                </button>
                            </div>

                            <div style={{ flex: 1, position: 'relative' }}
                                onMouseEnter={() => setHoveredFillBtn('fill')}
                                onMouseLeave={() => setHoveredFillBtn(null)}
                            >
                                {hoveredFillBtn === 'fill' && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '100%',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        marginBottom: '8px',
                                        padding: '6px 10px',
                                        background: 'rgba(0,0,0,0.85)',
                                        color: 'white',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        pointerEvents: 'none',
                                        whiteSpace: 'nowrap',
                                        zIndex: 10,
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                    }}>
                                        Stretches to fill area
                                        <div style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: '50%',
                                            marginLeft: '-5px',
                                            borderWidth: '5px',
                                            borderStyle: 'solid',
                                            borderColor: 'rgba(0,0,0,0.85) transparent transparent transparent'
                                        }} />
                                    </div>
                                )}
                                <button
                                    className={`btn ${transform.fillMode === 'fill' ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setTransform(t => ({ ...t, fillMode: 'fill' }))}
                                    style={{ width: '100%' }}
                                >
                                    Fill
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="preview-control-group">
                    <button
                        className="btn btn-secondary"
                        onClick={handleReset}
                        style={{ width: '100%' }}
                        disabled={transform.scale === 1 && transform.offsetX === 0 && transform.offsetY === 0 && transform.fillMode === 'fit'}
                    >
                        Reset Position
                    </button>
                </div>


                <div style={{ flex: 1 }}></div>

                <div className="preview-control-group" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-lg)' }}>
                    {isModal ? (
                        <>
                            <button
                                className="btn btn-primary"
                                onClick={() => onSave(transform)}
                                style={{ width: '100%', marginBottom: 'var(--space-sm)' }}
                            >
                                Save Changes
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={onCancel}
                                style={{ width: '100%' }}
                            >
                                Cancel
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                className="btn btn-primary"
                                onClick={handleDownload}
                                disabled={initialLoading || error || !designImage}
                                style={{ width: '100%', opacity: !designImage ? 0.5 : 1 }}
                                title={!designImage ? "Upload a design first to download" : ""}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                Download
                            </button>
                            {!designImage ? (
                                <button
                                    className="btn btn-primary"
                                    onClick={() => navigate(`/create?redirect=/preview/${mockup.id}`)}
                                    style={{ width: '100%', marginTop: 'var(--space-sm)' }}
                                >
                                    🎨 Upload Design
                                </button>
                            ) : null}
                            <button
                                className="btn btn-secondary"
                                onClick={() => navigate('/gallery')}
                                style={{ width: '100%', marginTop: 'var(--space-sm)' }}
                            >
                                ← Different Mockup
                            </button>
                            {isAdmin && (
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => navigate(`/admin?edit=${mockup.id}`)}
                                    style={{ width: '100%', marginTop: 'var(--space-sm)' }}
                                >
                                    ✏️ Edit Template
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div >
    )

    if (isModal) {
        return (
            <div style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.85)',
                zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '2rem'
            }}>
                {content}
            </div>
        )
    }

    return content
}

export default MockupPreview
