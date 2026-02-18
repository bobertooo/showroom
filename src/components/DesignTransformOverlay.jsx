import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { getDesignBounds, getDesignBoundsSync, preloadImages } from '../utils/imageUtils'

function DesignTransformOverlay({ mockup, designImage, transform, onTransformChange, canvasRef, selected, onSelect, onDeselect, onDraggingChange, onBackgroundClick }) {
    const overlayRef = useRef(null)
    const [imageDims, setImageDims] = useState(null) // { mockupW, mockupH, designW, designH }
    const [dragging, setDragging] = useState(null) // null | 'move' | 'resize'
    const dragStart = useRef(null)

    // Preload images once and cache their dimensions (runs only when mockup/design change)
    useEffect(() => {
        if (!mockup || !designImage) return
        let cancelled = false

        preloadImages(mockup.image, designImage)
            .then(({ mockupImg, designImg }) => {
                if (!cancelled) {
                    setImageDims({
                        mockupW: mockupImg.naturalWidth || mockupImg.width,
                        mockupH: mockupImg.naturalHeight || mockupImg.height,
                        designW: designImg.naturalWidth || designImg.width,
                        designH: designImg.naturalHeight || designImg.height
                    })
                }
            })
            .catch(() => { })

        return () => { cancelled = true }
    }, [mockup, designImage])

    // Compute bounds synchronously from cached dimensions — no async, no image reloads
    const bounds = useMemo(() => {
        if (!imageDims || !mockup) return null
        return getDesignBoundsSync(
            imageDims.mockupW, imageDims.mockupH,
            imageDims.designW, imageDims.designH,
            mockup.placement, transform
        )
    }, [imageDims, mockup, transform])

    // Convert a display pixel delta to mockup percentage
    const displayDeltaToPercent = useCallback((dx, dy) => {
        const canvas = canvasRef.current
        if (!canvas || !bounds) return { px: 0, py: 0 }
        const rect = canvas.getBoundingClientRect()
        return {
            px: (dx / rect.width) * 100,
            py: (dy / rect.height) * 100
        }
    }, [canvasRef, bounds])

    const startDrag = useCallback((pageX, pageY, mode) => {
        if (!selected) {
            onSelect()
            return
        }

        // For resize: compute initial distance from cursor to design center
        let initDist = 1
        if (mode === 'resize' && bounds && canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect()
            const displayScaleX = rect.width / bounds.mockupWidth
            const displayScaleY = rect.height / bounds.mockupHeight
            const centerX = rect.left + (bounds.x + bounds.width / 2) * displayScaleX
            const centerY = rect.top + (bounds.y + bounds.height / 2) * displayScaleY
            initDist = Math.max(1, Math.sqrt((pageX - centerX) ** 2 + (pageY - centerY) ** 2))
        }

        dragStart.current = {
            pageX,
            pageY,
            transform: { ...transform },
            mode,
            initDist
        }
        setDragging(mode)
        if (onDraggingChange) onDraggingChange(true)
    }, [transform, selected, onSelect, onDraggingChange, bounds, canvasRef])

    const handleMouseDown = useCallback((e, mode) => {
        e.preventDefault()
        e.stopPropagation()
        startDrag(e.pageX, e.pageY, mode)
    }, [startDrag])

    const handleTouchStart = useCallback((e, mode) => {
        e.preventDefault()
        e.stopPropagation()
        const touch = e.touches[0]
        startDrag(touch.pageX, touch.pageY, mode)
    }, [startDrag])

    useEffect(() => {
        if (!dragging) return

        const handleMove = (pageX, pageY) => {
            const start = dragStart.current
            if (!start) return

            const dx = pageX - start.pageX
            const dy = pageY - start.pageY

            if (start.mode === 'move') {
                const { px, py } = displayDeltaToPercent(dx, dy)
                onTransformChange({
                    ...start.transform,
                    offsetX: start.transform.offsetX + px,
                    offsetY: start.transform.offsetY + py
                })
            } else if (start.mode === 'resize' && bounds && canvasRef.current) {
                // Scale = ratio of current cursor distance to initial cursor distance from center
                const rect = canvasRef.current.getBoundingClientRect()
                const displayScaleX = rect.width / bounds.mockupWidth
                const displayScaleY = rect.height / bounds.mockupHeight
                const centerX = rect.left + (bounds.x + bounds.width / 2) * displayScaleX
                const centerY = rect.top + (bounds.y + bounds.height / 2) * displayScaleY
                const currentDist = Math.max(1, Math.sqrt((pageX - centerX) ** 2 + (pageY - centerY) ** 2))
                const ratio = currentDist / start.initDist

                // Allow larger scaling for shirts (unbounded) vs posters (clipped)
                const maxScale = mockup.type === 'poster' ? 2.5 : 5.0
                const newScale = Math.max(0.1, Math.min(maxScale, start.transform.scale * ratio))

                onTransformChange({
                    ...start.transform,
                    scale: newScale
                })
            }
        }

        const onMouseMove = (e) => handleMove(e.pageX, e.pageY)
        const onTouchMove = (e) => {
            if (e.touches.length > 0) handleMove(e.touches[0].pageX, e.touches[0].pageY)
        }
        const onEnd = () => {
            setDragging(null)
            if (onDraggingChange) onDraggingChange(false)
        }

        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onEnd)
        window.addEventListener('touchmove', onTouchMove, { passive: false })
        window.addEventListener('touchend', onEnd)

        return () => {
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onEnd)
            window.removeEventListener('touchmove', onTouchMove)
            window.removeEventListener('touchend', onEnd)
        }
    }, [dragging, displayDeltaToPercent, onTransformChange, onDraggingChange])

    // Keyboard controls for fine-tuning position
    useEffect(() => {
        if (!selected) return

        const handleKeyDown = (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault()
                // Shift: 10x speed (5%), Normal: 0.5%
                const step = e.shiftKey ? 5 : 0.5
                let dx = 0
                let dy = 0

                if (e.key === 'ArrowLeft') dx = -step
                if (e.key === 'ArrowRight') dx = step
                if (e.key === 'ArrowUp') dy = -step
                if (e.key === 'ArrowDown') dy = step

                onTransformChange({
                    ...transform,
                    offsetX: transform.offsetX + dx,
                    offsetY: transform.offsetY + dy
                })
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [selected, transform, onTransformChange])

    // Click on overlay background (outside bounds)
    const handleOverlayClick = useCallback((e) => {
        if (e.target === overlayRef.current) {
            if (selected) {
                onDeselect()
            } else if (onBackgroundClick) {
                onBackgroundClick()
            }
        }
    }, [selected, onDeselect, onBackgroundClick])

    if (!bounds || !canvasRef.current) return null

    // Convert mockup pixel bounds to overlay CSS positions
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const displayScaleX = rect.width / bounds.mockupWidth
    const displayScaleY = rect.height / bounds.mockupHeight

    const boxStyle = {
        left: bounds.x * displayScaleX,
        top: bounds.y * displayScaleY,
        width: bounds.width * displayScaleX,
        height: bounds.height * displayScaleY
    }

    const handleSize = 14
    const handles = [
        { key: 'tl', style: { left: -handleSize / 2, top: -handleSize / 2, cursor: 'nwse-resize' } },
        { key: 'tr', style: { right: -handleSize / 2, top: -handleSize / 2, cursor: 'nesw-resize' } },
        { key: 'br', style: { right: -handleSize / 2, bottom: -handleSize / 2, cursor: 'nwse-resize' } },
        { key: 'bl', style: { left: -handleSize / 2, bottom: -handleSize / 2, cursor: 'nesw-resize' } },
    ]

    return (
        <div
            className={`design-overlay ${selected ? 'active' : ''}`}
            ref={overlayRef}
            onMouseDown={handleOverlayClick}
        >
            <div
                className={`design-bounds ${selected ? 'selected' : ''} ${dragging === 'move' ? 'dragging' : ''}`}
                style={boxStyle}
                onMouseDown={(e) => handleMouseDown(e, 'move')}
                onTouchStart={(e) => handleTouchStart(e, 'move')}
            >
                {selected && handles.map(h => (
                    <div
                        key={h.key}
                        className={`design-handle ${dragging === 'resize' ? 'dragging' : ''}`}
                        style={{ ...h.style, width: handleSize, height: handleSize }}
                        onMouseDown={(e) => handleMouseDown(e, 'resize')}
                        onTouchStart={(e) => handleTouchStart(e, 'resize')}
                    />
                ))}
            </div>
            {selected && !dragging && (
                <div className="design-overlay-hint">
                    Drag to move · Corners to resize
                </div>
            )}
        </div>
    )
}

export default DesignTransformOverlay
