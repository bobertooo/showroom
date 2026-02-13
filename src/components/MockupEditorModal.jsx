import { useState, useRef, useEffect } from 'react'

function MockupEditorModal({ image, initialPlacement, productType, onSave, onClose }) {
    const [placement, setPlacement] = useState(initialPlacement)
    const [scale, setScale] = useState(1)
    const [pan, setPan] = useState({ x: 0, y: 0 })
    const [isPanning, setIsPanning] = useState(false)
    const [dragStart, setDragStart] = useState(null) // For panning
    const [selectedHandle, setSelectedHandle] = useState(null)
    const [editDrag, setEditDrag] = useState(null)

    const containerRef = useRef(null)
    const contentRef = useRef(null)

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!selectedHandle || !contentRef.current) return

            const step = (e.shiftKey ? 10 : 1) / scale;
            let dx = 0;
            let dy = 0;

            if (e.key === 'ArrowLeft') dx = -step;
            else if (e.key === 'ArrowRight') dx = step;
            else if (e.key === 'ArrowUp') dy = -step;
            else if (e.key === 'ArrowDown') dy = step;
            else return;

            e.preventDefault();

            const rect = contentRef.current.getBoundingClientRect();
            const imgWidth = rect.width / scale;
            const imgHeight = rect.height / scale;

            const deltaXPercent = (dx / imgWidth) * 100;
            const deltaYPercent = (dy / imgHeight) * 100;

            if (productType === 'poster') {
                setPlacement(prev => {
                    const p = prev[selectedHandle];
                    const newX = Math.max(0, Math.min(100, p.x + deltaXPercent));
                    const newY = Math.max(0, Math.min(100, p.y + deltaYPercent));
                    return { ...prev, [selectedHandle]: { x: newX, y: newY } };
                });
            } else {
                if (selectedHandle === 'rect') {
                    setPlacement(prev => {
                        let newX = prev.x + deltaXPercent;
                        let newY = prev.y + deltaYPercent;
                        newX = Math.max(0, Math.min(100 - prev.width, newX));
                        newY = Math.max(0, Math.min(100 - prev.height, newY));
                        return { ...prev, x: newX, y: newY };
                    });
                } else if (selectedHandle === 'handle-se') {
                    setPlacement(prev => {
                        let newW = prev.width + deltaXPercent;
                        let newH = prev.height + deltaYPercent;
                        newW = Math.max(5, Math.min(100 - prev.x, newW));
                        newH = Math.max(5, Math.min(100 - prev.y, newH));
                        return { ...prev, width: newW, height: newH };
                    });
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedHandle, productType, scale])

    // Zoom
    useEffect(() => {
        const handleWheel = (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault()
                const delta = -e.deltaY * 0.005
                setScale(s => Math.min(Math.max(0.5, s + delta), 5))
            }
        }
        const el = containerRef.current
        if (el) el.addEventListener('wheel', handleWheel, { passive: false })
        return () => el?.removeEventListener('wheel', handleWheel)
    }, [])

    // Pan Logic
    const handleMouseDown = (e) => {
        // Middle click (1), Left click (0), or Shift+Click triggers pan (if not stopped by handle)
        if (e.button === 1 || e.button === 0 || e.shiftKey) {
            e.preventDefault()
            setIsPanning(true)
            setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
            setSelectedHandle(null) // Deselect on background click
        }
    }

    const handleMouseMove = (e) => {
        if (isPanning) {
            setPan({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            })
        } else if (editDrag && contentRef.current) {
            const rect = contentRef.current.getBoundingClientRect()
            const imgWidth = rect.width / scale
            const imgHeight = rect.height / scale

            const deltaX = (e.clientX - editDrag.startX) / scale
            const deltaY = (e.clientY - editDrag.startY) / scale

            const deltaXPercent = (deltaX / imgWidth) * 100
            const deltaYPercent = (deltaY / imgHeight) * 100

            if (productType === 'poster') {
                // Perspective Mode (4 points)
                const newX = Math.max(0, Math.min(100, editDrag.startPoint.x + deltaXPercent))
                const newY = Math.max(0, Math.min(100, editDrag.startPoint.y + deltaYPercent))

                setPlacement(prev => ({
                    ...prev,
                    [editDrag.key]: { x: newX, y: newY }
                }))
            } else {
                // Simple Mode (Rect)
                if (editDrag.key === 'rect') {
                    let newX = editDrag.startPlacement.x + deltaXPercent
                    let newY = editDrag.startPlacement.y + deltaYPercent

                    newX = Math.max(0, Math.min(100 - editDrag.startPlacement.width, newX))
                    newY = Math.max(0, Math.min(100 - editDrag.startPlacement.height, newY))

                    setPlacement(prev => ({ ...prev, x: newX, y: newY }))
                } else if (editDrag.key === 'handle-se') {
                    let newW = editDrag.startPlacement.width + deltaXPercent
                    let newH = editDrag.startPlacement.height + deltaYPercent

                    newW = Math.max(5, Math.min(100 - editDrag.startPlacement.x, newW))
                    newH = Math.max(5, Math.min(100 - editDrag.startPlacement.y, newH))

                    setPlacement(prev => ({ ...prev, width: newW, height: newH }))
                }
            }
        }
    }

    const handleMouseUp = () => {
        setIsPanning(false)
        setEditDrag(null)
    }

    const startEditDrag = (e, key) => {
        e.stopPropagation()
        e.preventDefault()
        setSelectedHandle(key) // Select on click/drag
        setEditDrag({
            key,
            startX: e.clientX,
            startY: e.clientY,
            startPoint: productType === 'poster' ? { ...placement[key] } : null,
            startPlacement: productType === 'tshirt' ? { ...placement } : null
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-900 text-white"
            style={{ position: 'fixed', inset: 0, background: '#111', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>

            {/* Header */}
            <div style={{ padding: '1rem', background: '#1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ margin: 0, fontWeight: 600 }}>Mockup Editor ({productType === 'poster' ? 'Perspective' : 'Simple'})</h3>
                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Scroll/Ctrl+Wheel to Zoom • Drag/Shift+Drag to Pan</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={() => onSave(placement)}>Save Changes</button>
                </div>
            </div>

            {/* Canvas Area */}
            <div
                ref={containerRef}
                style={{ flex: 1, overflow: 'hidden', position: 'relative', cursor: isPanning ? 'grabbing' : 'grab', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <div
                    ref={contentRef}
                    style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                        transformOrigin: 'center',
                        transition: isPanning || editDrag ? 'none' : 'transform 0.1s',
                        position: 'relative'
                    }}
                >
                    <img
                        src={image}
                        draggable={false}
                        alt="Mockup"
                        style={{ maxHeight: '80vh', maxWidth: '80vw', display: 'block', pointerEvents: 'none' }}
                    />

                    {/* Overlay SVG */}
                    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                        {productType === 'poster' ? (
                            <polygon
                                points={`${placement.tl.x}% ${placement.tl.y}% ${placement.tr.x}% ${placement.tr.y}% ${placement.br.x}% ${placement.br.y}% ${placement.bl.x}% ${placement.bl.y}%`}
                                fill="rgba(99, 102, 241, 0.2)" stroke="var(--color-accent-primary)" strokeWidth="1.5" vectorEffect="non-scaling-stroke"
                            />
                        ) : (
                            <rect
                                x={`${placement.x}%`} y={`${placement.y}%`}
                                width={`${placement.width}%`} height={`${placement.height}%`}
                                fill="rgba(99, 102, 241, 0.2)" stroke={selectedHandle === 'rect' ? '#fbbf24' : 'var(--color-accent-primary)'} strokeWidth="1.5" vectorEffect="non-scaling-stroke"
                            />
                        )}
                    </svg>

                    {/* Handles */}
                    {productType === 'poster' && Object.keys(placement).map(key => (
                        <div
                            key={key}
                            onMouseDown={(e) => startEditDrag(e, key)}
                            style={{
                                position: 'absolute',
                                left: `${placement[key].x}%`, top: `${placement[key].y}%`,
                                width: '24px', height: '24px',
                                transform: `translate(-50%, -50%) scale(${1 / scale})`,
                                cursor: 'crosshair',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                zIndex: 10
                            }}
                        >
                            <div style={{ position: 'absolute', width: '14px', height: '1px', background: selectedHandle === key ? '#fbbf24' : '#6366f1', boxShadow: selectedHandle === key ? '0 0 4px #fbbf24' : 'none' }}></div>
                            <div style={{ position: 'absolute', width: '1px', height: '14px', background: selectedHandle === key ? '#fbbf24' : '#6366f1', boxShadow: selectedHandle === key ? '0 0 4px #fbbf24' : 'none' }}></div>

                            <div style={{ position: 'absolute', top: `${-20 / scale}px`, fontSize: `${12 / scale}px`, color: 'white', textShadow: '0 1px 2px black', pointerEvents: 'none' }}>{key.toUpperCase()}</div>
                        </div>
                    ))}

                    {productType === 'tshirt' && (
                        <>
                            {/* Drag Area */}
                            <div
                                onMouseDown={(e) => startEditDrag(e, 'rect')}
                                style={{
                                    position: 'absolute',
                                    left: `${placement.x}%`, top: `${placement.y}%`,
                                    width: `${placement.width}%`, height: `${placement.height}%`,
                                    cursor: 'move', zIndex: 5
                                }}
                            ></div>

                            {/* Resize Handle */}
                            <div
                                onMouseDown={(e) => startEditDrag(e, 'handle-se')}
                                style={{
                                    position: 'absolute',
                                    left: `${placement.x + placement.width}%`, top: `${placement.y + placement.height}%`,
                                    width: '16px', height: '16px',
                                    background: 'white', border: `1.5px solid ${selectedHandle === 'handle-se' ? '#fbbf24' : 'var(--color-accent-primary)'}`, borderRadius: '2px',
                                    transform: `translate(-50%, -50%) scale(${1 / scale})`, cursor: 'nwse-resize', zIndex: 10,
                                    boxShadow: selectedHandle === 'handle-se' ? '0 0 4px #fbbf24' : 'none'
                                }}
                            ></div>
                        </>
                    )}

                </div>
            </div>

            <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.8)', padding: '8px 16px', borderRadius: '30px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <button onClick={() => setScale(s => Math.max(0.1, s - 0.2))} style={{ color: 'white', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>-</button>
                <span style={{ minWidth: '50px', textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
                <button onClick={() => setScale(s => s + 0.2)} style={{ color: 'white', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>+</button>
                <button onClick={() => { setScale(1); setPan({ x: 0, y: 0 }); }} style={{ marginLeft: '10px', fontSize: '0.8rem', color: '#aaa', background: 'transparent', border: 'none', cursor: 'pointer' }}>Fit</button>
            </div>

        </div>
    )
}

export default MockupEditorModal
