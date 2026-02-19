import { useState, useRef, useCallback } from 'react'

function BeforeAfterSlider({ beforeImage, afterImage, beforeLabel = 'Before', afterLabel = 'After' }) {
    const [sliderPos, setSliderPos] = useState(50)
    const containerRef = useRef(null)
    const isDragging = useRef(false)

    const updatePosition = useCallback((clientX) => {
        const rect = containerRef.current.getBoundingClientRect()
        const x = clientX - rect.left
        const percent = Math.max(0, Math.min(100, (x / rect.width) * 100))
        setSliderPos(percent)
    }, [])

    const handlePointerDown = useCallback((e) => {
        isDragging.current = true
        e.currentTarget.setPointerCapture(e.pointerId)
        updatePosition(e.clientX)
    }, [updatePosition])

    const handlePointerMove = useCallback((e) => {
        if (!isDragging.current) return
        updatePosition(e.clientX)
    }, [updatePosition])

    const handlePointerUp = useCallback(() => {
        isDragging.current = false
    }, [])

    return (
        <div
            className="ba-slider"
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        >
            {/* After image (full, sits behind) */}
            <img src={afterImage} alt={afterLabel} className="ba-slider-img" draggable={false} />

            {/* Before image (clipped) */}
            <div
                className="ba-slider-before"
                style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
            >
                <img src={beforeImage} alt={beforeLabel} className="ba-slider-img" draggable={false} />
            </div>

            {/* Labels */}
            <span className="ba-label ba-label-before" style={{ opacity: sliderPos > 15 ? 1 : 0 }}>
                {beforeLabel}
            </span>
            <span className="ba-label ba-label-after" style={{ opacity: sliderPos < 85 ? 1 : 0 }}>
                {afterLabel}
            </span>

            {/* Divider line + handle */}
            <div className="ba-divider" style={{ left: `${sliderPos}%` }}>
                <div className="ba-divider-line" />
                <div className="ba-arrows">
                    <svg className="ba-arrow ba-arrow-left" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                    <svg className="ba-arrow ba-arrow-right" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </div>
            </div>
        </div>
    )
}

export default BeforeAfterSlider
