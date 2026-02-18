import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMockups } from '../hooks/useMockups'
import { exportAllMockups, importMockups } from '../utils/storage'
import { detectPlacement } from '../utils/imageUtils'
import MockupEditorModal from './MockupEditorModal'

function AdminPanel() {
    const { mockups, addMockup, deleteMockup, loading, reload } = useMockups()
    const [productType, setProductType] = useState('wall-art') // 'wall-art' | 'clothing' | 'accessories'
    const [image, setImage] = useState(null)
    const [selectedMockup, setSelectedMockup] = useState(null)

    const [imagePreview, setImagePreview] = useState(null)

    // Placement state depends on product type
    // Wall Art: { tl, tr, br, bl } (Perspective)
    // Clothing/Accessories: { x, y, width, height } (Simple Rect)
    const [placement, setPlacement] = useState({
        tl: { x: 20, y: 20 }, tr: { x: 80, y: 20 },
        br: { x: 80, y: 80 }, bl: { x: 20, y: 80 }
    })

    const [saving, setSaving] = useState(false)
    const [dragState, setDragState] = useState(null)
    const [autoDetecting, setAutoDetecting] = useState(false)
    const [showEditor, setShowEditor] = useState(false)
    const [isDragging, setIsDragging] = useState(false) // State for drag-and-drop upload zone

    // Bulk upload state
    const [bulkType, setBulkType] = useState('wall-art')
    const [bulkUploading, setBulkUploading] = useState(false)
    const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 })
    const [bulkDragging, setBulkDragging] = useState(false)
    const bulkFileInputRef = useRef(null)

    // Export / Import state
    const [transferStatus, setTransferStatus] = useState(null) // { type: 'success'|'error', message }
    const importFileRef = useRef(null)

    const fileInputRef = useRef(null)
    const imageRef = useRef(null)

    // Switch placement mode when type changes
    useEffect(() => {
        if (productType === 'wall-art') {
            setPlacement({
                tl: { x: 20, y: 20 }, tr: { x: 80, y: 20 },
                br: { x: 80, y: 80 }, bl: { x: 20, y: 80 }
            })
        } else {
            setPlacement({ x: 30, y: 30, width: 40, height: 40 })
        }
    }, [productType])

    // Auto-load mockup for editing from URL query param (?edit=<id>)
    useEffect(() => {
        const [params] = [new URLSearchParams(window.location.search)]
        const editId = params.get('edit')
        if (editId && mockups.length > 0 && !selectedMockup) {
            const target = mockups.find(m => m.id === editId)
            if (target) {
                setSelectedMockup(target)
                setProductType(target.type)
                setImage(target.image)
                setImagePreview(target.image)
                setPlacement(target.placement)
                // Clean up the URL
                window.history.replaceState({}, '', '/admin')
            }
        }
    }, [mockups])

    const processFile = (file) => {
        if (file && (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/webp')) {
            const reader = new FileReader()
            reader.onload = (e) => {
                setImage(e.target.result)
                setImagePreview(e.target.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleFileSelect = (e) => {
        const file = e.target.files[0]
        processFile(file)
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files[0]
        processFile(file)
    }

    const handleEdit = (mockup) => {
        setSelectedMockup(mockup)
        setProductType(mockup.type)
        setImage(mockup.image)
        setImagePreview(mockup.image)
        setPlacement(mockup.placement)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const cancelEdit = () => {
        setSelectedMockup(null)
        setImage(null)
        setImagePreview(null)
        setProductType('wall-art')
        setPlacement({ tl: { x: 20, y: 20 }, tr: { x: 80, y: 20 }, br: { x: 80, y: 80 }, bl: { x: 20, y: 80 } })
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleSave = async () => {
        if (!image) return
        setSaving(true)
        try {
            await addMockup({
                id: selectedMockup ? selectedMockup.id : undefined, // Preserve ID if editing
                name: 'Untitled Mockup', // Fallback name for internal use
                type: productType,
                image,
                placement,
                edited: true,
                createdAt: selectedMockup ? selectedMockup.createdAt : undefined
            })
            cancelEdit() // Reset form
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this mockup?')) {
            await deleteMockup(id)
        }
    }

    // Bulk upload handler
    const handleBulkUpload = async (files) => {
        const validFiles = Array.from(files).filter(f =>
            f.type === 'image/png' || f.type === 'image/jpeg' || f.type === 'image/webp'
        )
        if (validFiles.length === 0) return

        setBulkUploading(true)
        setBulkProgress({ current: 0, total: validFiles.length })

        const defaultPlacement = bulkType === 'wall-art'
            ? { tl: { x: 20, y: 20 }, tr: { x: 80, y: 20 }, br: { x: 80, y: 80 }, bl: { x: 20, y: 80 } }
            : { x: 30, y: 30, width: 40, height: 40 }

        for (let i = 0; i < validFiles.length; i++) {
            const file = validFiles[i]
            const dataUrl = await new Promise((resolve) => {
                const reader = new FileReader()
                reader.onload = (e) => resolve(e.target.result)
                reader.readAsDataURL(file)
            })

            // Derive name from filename (without extension)
            const templateName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')

            await addMockup({
                name: templateName,
                type: bulkType,
                image: dataUrl,
                placement: defaultPlacement,
                edited: false,
            })
            setBulkProgress({ current: i + 1, total: validFiles.length })
        }

        setBulkUploading(false)
        if (bulkFileInputRef.current) bulkFileInputRef.current.value = ''
    }

    // Export / Import handlers
    const handleExport = async () => {
        try {
            const count = await exportAllMockups()
            setTransferStatus({ type: 'success', message: `Exported ${count} template${count !== 1 ? 's' : ''} successfully!` })
        } catch (err) {
            setTransferStatus({ type: 'error', message: 'Export failed: ' + err.message })
        }
        setTimeout(() => setTransferStatus(null), 4000)
    }

    const handleImport = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        try {
            const count = await importMockups(file)
            setTransferStatus({ type: 'success', message: `Imported ${count} template${count !== 1 ? 's' : ''} successfully!` })
            reload() // refresh the list
        } catch (err) {
            setTransferStatus({ type: 'error', message: 'Import failed: ' + err.message })
        }
        if (importFileRef.current) importFileRef.current.value = ''
        setTimeout(() => setTransferStatus(null), 4000)
    }

    // Mouse Handlers
    const handleMouseDown = (e, target) => {
        e.preventDefault()
        e.stopPropagation()
        setDragState({
            target, // 'tl', 'tr'... or 'rect', 'handle-se', etc.
            startX: e.clientX,
            startY: e.clientY,
            startPlacement: JSON.parse(JSON.stringify(placement))
        })
    }

    useEffect(() => {
        if (!dragState) return
        const handleMouseMove = (e) => {
            if (!imageRef.current) return

            const imgRect = imageRef.current.getBoundingClientRect()
            const deltaX = e.clientX - dragState.startX
            const deltaY = e.clientY - dragState.startY
            const deltaXPercent = (deltaX / imgRect.width) * 100
            const deltaYPercent = (deltaY / imgRect.height) * 100

            if (productType === 'wall-art') {
                // Perspective Dragging
                const newX = Math.max(0, Math.min(100, dragState.startPlacement[dragState.target].x + deltaXPercent))
                const newY = Math.max(0, Math.min(100, dragState.startPlacement[dragState.target].y + deltaYPercent))
                setPlacement(prev => ({ ...prev, [dragState.target]: { x: newX, y: newY } }))
            } else {
                // Simple Rect Dragging
                if (dragState.target === 'rect') {
                    // Move whole rect
                    let newX = dragState.startPlacement.x + deltaXPercent
                    let newY = dragState.startPlacement.y + deltaYPercent

                    // Clamp
                    newX = Math.max(0, Math.min(100 - dragState.startPlacement.width, newX))
                    newY = Math.max(0, Math.min(100 - dragState.startPlacement.height, newY))

                    setPlacement(prev => ({ ...prev, x: newX, y: newY }))
                } else if (dragState.target === 'handle-se') {
                    // Resize (bottom-right handle)
                    let newW = dragState.startPlacement.width + deltaXPercent
                    let newH = dragState.startPlacement.height + deltaYPercent

                    newW = Math.max(5, Math.min(100 - dragState.startPlacement.x, newW))
                    newH = Math.max(5, Math.min(100 - dragState.startPlacement.y, newH))

                    setPlacement(prev => ({ ...prev, width: newW, height: newH }))
                }
            }
        }
        const handleMouseUp = () => setDragState(null)
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [dragState, productType])

    const startAutoDetect = () => setAutoDetecting(true)

    const handleImageClick = async (e) => {
        if (!autoDetecting || !imageRef.current) return;
        const rect = imageRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Auto-detect returns 4 points.
        // If T-Shirt mode, we convert to bounding box.
        const detected = await detectPlacement(imagePreview, x, y, rect);

        if (detected) {
            if (productType === 'wall-art') {
                setPlacement(detected);
            } else {
                // Convert 4 points to bounding box rect
                // Detect returns { tl, tr, br, bl }
                const xs = [detected.tl.x, detected.tr.x, detected.br.x, detected.bl.x]
                const ys = [detected.tl.y, detected.tr.y, detected.br.y, detected.bl.y]
                const minX = Math.min(...xs)
                const maxX = Math.max(...xs)
                const minY = Math.min(...ys)
                const maxY = Math.max(...ys)

                setPlacement({
                    x: minX,
                    y: minY,
                    width: maxX - minX,
                    height: maxY - minY
                })
            }
        }
        setAutoDetecting(false);
    }

    return (
        <div className="admin-grid fade-in">
            {showEditor && (
                <MockupEditorModal
                    image={imagePreview}
                    initialPlacement={placement}
                    productType={productType}
                    onSave={(newPlacement) => {
                        setPlacement(newPlacement)
                        setShowEditor(false)
                    }}
                    onClose={() => setShowEditor(false)}
                />
            )}

            <div className="card admin-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '50%', background: selectedMockup ? 'var(--color-accent-secondary)' : 'var(--color-accent-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem'
                        }}>
                            {selectedMockup ? '✏️' : '➕'}
                        </div>
                        <h3 className="admin-section-title" style={{ margin: 0, border: 'none', padding: 0 }}>
                            {selectedMockup ? 'Editing Template' : 'Create New Template'}
                        </h3>
                    </div>
                    {selectedMockup && (
                        <button className="btn btn-secondary" onClick={cancelEdit} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                            Cancel Edit
                        </button>
                    )}
                </div>

                <div className="form-group">
                    <label className="form-label">Product Type</label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {[
                            { value: 'wall-art', label: '🖼️ Wall Art', desc: 'Perspective' },
                            { value: 'clothing', label: '👕 Clothing', desc: 'Simple Area' },
                            { value: 'accessories', label: '🎒 Accessories', desc: 'Simple Area' }
                        ].map(opt => (
                            <button
                                key={opt.value}
                                className={`btn ${productType === opt.value ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setProductType(opt.value)}
                                style={{ flex: '1 1 0', fontSize: '0.85rem', padding: '8px 12px', textAlign: 'center' }}
                            >
                                <div>{opt.label}</div>
                                <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '2px' }}>{opt.desc}</div>
                            </button>
                        ))}
                    </div>
                </div>



                <div className="form-group">
                    <label className="form-label">Mockup Image</label>
                    <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileSelect} style={{ display: 'none' }} />
                    {!imagePreview ? (
                        <div
                            className={`upload-zone ${isDragging ? 'drag-over' : ''}`}
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            style={{ padding: 'var(--space-xl)' }}
                        >
                            <p>{isDragging ? 'Drop to upload!' : 'Click or drag mockup image here'}</p>
                        </div>
                    ) : (
                        <div className="placement-editor" style={{ cursor: autoDetecting ? 'crosshair' : 'default', position: 'relative' }}>
                            <img ref={imageRef} src={imagePreview} alt="Mockup preview" style={{ width: '100%', display: 'block', userSelect: 'none' }} onClick={handleImageClick} />

                            {/* Overlay Render */}
                            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                                {productType === 'wall-art' ? (
                                    <polygon points={`${placement.tl.x}% ${placement.tl.y}% ${placement.tr.x}% ${placement.tr.y}% ${placement.br.x}% ${placement.br.y}% ${placement.bl.x}% ${placement.bl.y}%`} fill="rgba(99, 102, 241, 0.2)" stroke="var(--color-accent-primary)" strokeWidth="2" strokeDasharray="4" vectorEffect="non-scaling-stroke" />
                                ) : (
                                    <rect
                                        x={`${placement.x}%`} y={`${placement.y}%`}
                                        width={`${placement.width}%`} height={`${placement.height}%`}
                                        fill="rgba(99, 102, 241, 0.2)" stroke="var(--color-accent-primary)" strokeWidth="2" strokeDasharray="4" vectorEffect="non-scaling-stroke"
                                    />
                                )}
                            </svg>

                            {/* Handles */}
                            {!autoDetecting && productType === 'wall-art' && Object.keys(placement).map(key => (
                                <div key={key} style={{
                                    position: 'absolute', left: `${placement[key].x}%`, top: `${placement[key].y}%`,
                                    width: '30px', height: '30px', cursor: 'crosshair',
                                    transform: 'translate(-50%, -50%)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }} onMouseDown={(e) => handleMouseDown(e, key)}>
                                    <div style={{ width: '1px', height: '20px', background: 'var(--color-accent-primary)', position: 'absolute' }}></div>
                                    <div style={{ width: '20px', height: '1px', background: 'var(--color-accent-primary)', position: 'absolute' }}></div>

                                </div>
                            ))}

                            {!autoDetecting && productType !== 'wall-art' && (
                                <>
                                    {/* Interactive Rect Area */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            left: `${placement.x}%`, top: `${placement.y}%`,
                                            width: `${placement.width}%`, height: `${placement.height}%`,
                                            cursor: 'move', zIndex: 5
                                        }}
                                        onMouseDown={(e) => handleMouseDown(e, 'rect')}
                                    ></div>

                                    {/* Resize Handle (Bottom Right) */}
                                    <div style={{
                                        position: 'absolute',
                                        left: `${placement.x + placement.width}%`, top: `${placement.y + placement.height}%`,
                                        width: '20px', height: '20px', background: 'white', border: '2px solid var(--color-accent-primary)', borderRadius: '4px',
                                        cursor: 'nwse-resize', transform: 'translate(-50%, -50%)', zIndex: 10
                                    }} onMouseDown={(e) => handleMouseDown(e, 'handle-se')}></div>
                                </>
                            )}

                            {autoDetecting && (
                                <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.8)', color: 'white', padding: '8px 16px', borderRadius: '20px', pointerEvents: 'none', zIndex: 20 }}>Click area to auto-detect</div>
                            )}
                        </div>
                    )}
                </div>

                {imagePreview && (
                    <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                            <label className="form-label">
                                {productType === 'wall-art' ? 'Corner Placement' : 'Area Placement'}
                            </label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={() => setShowEditor(true)}>
                                    🔍 Precise Editor
                                </button>
                                <button className={`btn ${autoDetecting ? 'btn-danger' : 'btn-secondary'}`} style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={autoDetecting ? () => setAutoDetecting(false) : startAutoDetect}>
                                    {autoDetecting ? 'Cancel' : '🪄 Auto-Detect'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                <button className="btn btn-primary" onClick={handleSave} disabled={!image || saving} style={{ width: '100%' }}>
                    {saving ? 'Saving...' : (selectedMockup ? 'Update Template' : 'Save Template')}
                </button>
            </div>

            {/* Bulk Upload Section */}
            <div className="card admin-section">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-accent-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem'
                    }}>📦</div>
                    <h3 className="admin-section-title" style={{ margin: 0, border: 'none', padding: 0 }}>Bulk Upload</h3>
                </div>

                <div className="form-group">
                    <label className="form-label">Product Type (for all uploads)</label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {[
                            { value: 'wall-art', label: '🖼️ Wall Art' },
                            { value: 'clothing', label: '👕 Clothing' },
                            { value: 'accessories', label: '🎒 Accessories' }
                        ].map(opt => (
                            <button
                                key={opt.value}
                                className={`btn ${bulkType === opt.value ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setBulkType(opt.value)}
                                style={{ flex: '1 1 0', fontSize: '0.85rem', padding: '8px 10px' }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                <input ref={bulkFileInputRef} type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(e) => handleBulkUpload(e.target.files)} style={{ display: 'none' }} />

                {!bulkUploading ? (
                    <div
                        className={`upload-zone ${bulkDragging ? 'drag-over' : ''}`}
                        onClick={() => bulkFileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setBulkDragging(true) }}
                        onDragLeave={(e) => { e.preventDefault(); setBulkDragging(false) }}
                        onDrop={(e) => {
                            e.preventDefault()
                            setBulkDragging(false)
                            handleBulkUpload(e.dataTransfer.files)
                        }}
                        style={{ padding: 'var(--space-xl)', textAlign: 'center' }}
                    >
                        <div style={{ fontSize: '2rem', marginBottom: 'var(--space-sm)' }}>📁</div>
                        <p style={{ marginBottom: 'var(--space-xs)' }}>{bulkDragging ? 'Drop files to upload!' : 'Click or drag multiple mockup images here'}</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>PNG, JPG, WEBP</p>
                    </div>
                ) : (
                    <div style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
                        <div style={{ marginBottom: 'var(--space-md)', color: 'var(--color-text-secondary)' }}>
                            Saving {bulkProgress.current} of {bulkProgress.total}...
                        </div>
                        <div style={{
                            width: '100%', height: '8px', borderRadius: '4px',
                            background: 'var(--color-surface-alt)', overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${(bulkProgress.current / bulkProgress.total) * 100}%`,
                                height: '100%', borderRadius: '4px',
                                background: 'var(--color-accent-primary)',
                                transition: 'width 0.3s ease'
                            }} />
                        </div>
                    </div>
                )}
            </div>

            {/* Export / Import Section */}
            <div className="card admin-section">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-accent-secondary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem'
                    }}>💾</div>
                    <h3 className="admin-section-title" style={{ margin: 0, border: 'none', padding: 0 }}>Export / Import</h3>
                </div>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-md)', fontSize: '0.9rem' }}>
                    Transfer your templates between computers. Export saves all templates to a file; Import loads them back in.
                </p>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" onClick={handleExport} disabled={mockups.length === 0} style={{ flex: '1 1 auto' }}>
                        📤 Export All ({mockups.length})
                    </button>
                    <input ref={importFileRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
                    <button className="btn btn-secondary" onClick={() => importFileRef.current?.click()} style={{ flex: '1 1 auto' }}>
                        📥 Import from File
                    </button>
                </div>
                {transferStatus && (
                    <div style={{
                        marginTop: 'var(--space-md)', padding: 'var(--space-sm) var(--space-md)',
                        borderRadius: 'var(--radius-md)',
                        background: transferStatus.type === 'success' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                        color: transferStatus.type === 'success' ? '#22c55e' : '#ef4444',
                        fontSize: '0.9rem'
                    }}>
                        {transferStatus.message}
                    </div>
                )}
            </div>

            <div className="card admin-section">
                <h3 className="admin-section-title">Existing Templates ({mockups.length})</h3>
                {loading ? <div className="loading-spinner" style={{ margin: '0 auto' }}></div> : (
                    <div className="template-list">
                        {mockups.map((mockup) => (
                            <div key={mockup.id} className="template-item">
                                <div style={{ position: 'relative' }}>
                                    <img src={mockup.image} alt={mockup.name} className="template-item-thumb" />
                                    <div style={{
                                        position: 'absolute', top: '6px', right: '6px',
                                        width: '10px', height: '10px', borderRadius: '50%',
                                        background: mockup.edited ? '#22c55e' : '#f59e0b',
                                        border: '2px solid rgba(255,255,255,0.9)',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                                    }} title={mockup.edited ? 'Edited' : 'Not yet edited'} />
                                </div>
                                <div className="template-item-info">
                                    <div className="template-item-name">
                                        {mockup.type === 'clothing' ? '👕 Clothing' : mockup.type === 'accessories' ? '🎒 Accessories' : mockup.type === 'wall-art' ? '🖼️ Wall Art' : mockup.type === 'tshirt' ? '👕 T-Shirt' : '🖼️ Poster'}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: mockup.edited ? '#22c55e' : '#f59e0b', marginTop: '2px' }}>
                                        {mockup.edited ? '● Edited' : '○ Not edited'}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="btn btn-secondary" style={{ padding: 'var(--space-sm) var(--space-md)' }} onClick={() => handleEdit(mockup)}>Edit</button>
                                    <button className="btn btn-danger" style={{ padding: 'var(--space-sm) var(--space-md)' }} onClick={() => handleDelete(mockup.id)}>Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default AdminPanel
