import { useEffect, useRef, useState, useCallback } from 'react'
import { compositeImages, quickComposite, preloadImages } from '../utils/imageUtils'
import DesignTransformOverlay from './DesignTransformOverlay'

function DesignEditModal({ mockup, designImage, initialTransform, onSave, onClose }) {
    const canvasRef = useRef(null)
    const [transform, setTransform] = useState(initialTransform)
    const [designSelected, setDesignSelected] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const cachedImagesRef = useRef(null)
    const rafRef = useRef(null)
    const renderTimerRef = useRef(null)

    // Preload and cache images
    useEffect(() => {
        preloadImages(mockup.image, designImage)
            .then(imgs => { cachedImagesRef.current = imgs })
            .catch(() => { })
    }, [mockup, designImage])

    // Full quality render Debounced
    useEffect(() => {
        if (isDragging) return
        if (renderTimerRef.current) clearTimeout(renderTimerRef.current)

        renderTimerRef.current = setTimeout(async () => {
            const canvas = canvasRef.current
            if (canvas) {
                const shouldClip = mockup.type === 'wall-art' || mockup.type === 'poster'
                await compositeImages(canvas, mockup.image, designImage, mockup.placement, transform, shouldClip, mockup.type)
            }
        }, 50)
        return () => clearTimeout(renderTimerRef.current)
    }, [mockup, designImage, transform, isDragging])

    const handleTransformChange = useCallback((newTransform) => {
        setTransform(newTransform)
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null
            if (cachedImagesRef.current && canvasRef.current) {
                const { mockupImg, designImg } = cachedImagesRef.current
                const shouldClip = mockup.type === 'wall-art' || mockup.type === 'poster'
                quickComposite(canvasRef.current, mockupImg, designImg, mockup.placement, newTransform, shouldClip, mockup.type)
            }
        })
    }, [mockup])

    const handleDraggingChange = useCallback((dragging) => {
        setIsDragging(dragging)
        if (!dragging) {
            setTransform(t => ({ ...t })) // Trigger full render
        }
    }, [])

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '1rem', background: '#1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontWeight: 600, color: 'white' }}>Adjust Design Position</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={() => onSave(transform)}>Save Changes</button>
                </div>
            </div>

            {/* Canvas Area */}
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%', display: 'flex', justifyContent: 'center' }} onClick={() => setDesignSelected(false)}>
                    <canvas
                        ref={canvasRef}
                        style={{
                            maxHeight: 'calc(100vh - 120px)',
                            maxWidth: '100%',
                            objectFit: 'contain',
                            display: 'block',
                            ...(canvasRef.current?.width > 0 ? { aspectRatio: `${canvasRef.current.width} / ${canvasRef.current.height}` } : {})
                        }}
                    />
                    <DesignTransformOverlay
                        mockup={mockup}
                        designImage={designImage}
                        transform={transform}
                        onTransformChange={handleTransformChange}
                        canvasRef={canvasRef}
                        selected={designSelected}
                        onSelect={() => setDesignSelected(true)}
                        onDeselect={() => setDesignSelected(false)}
                        onDraggingChange={handleDraggingChange}
                    />
                </div>
            </div>

            {/* Toolbar for Fill/Fit */}
            <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: 'var(--color-bg-card)', padding: '10px 16px', borderRadius: '8px', display: 'flex', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                <button className={`btn ${transform.fillMode === 'fit' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTransform(t => ({ ...t, fillMode: 'fit' }))}>Fit</button>
                <button className={`btn ${transform.fillMode === 'fill' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTransform(t => ({ ...t, fillMode: 'fill' }))}>Fill</button>
                <div style={{ width: '1px', background: 'var(--color-border)', margin: '0 8px' }}></div>
                <button className="btn btn-secondary" onClick={() => setTransform({ scale: 1, offsetX: 0, offsetY: 0, fillMode: 'fill' })}>Reset</button>
            </div>
        </div>
    )
}

export default DesignEditModal
