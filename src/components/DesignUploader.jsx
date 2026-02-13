import { useState, useRef } from 'react'

function DesignUploader({ onUpload }) {
    const [isDragOver, setIsDragOver] = useState(false)
    const [preview, setPreview] = useState(null)
    const fileInputRef = useRef(null)

    const handleDragOver = (e) => {
        e.preventDefault()
        setIsDragOver(true)
    }

    const handleDragLeave = (e) => {
        e.preventDefault()
        setIsDragOver(false)
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setIsDragOver(false)
        const file = e.dataTransfer.files[0]
        if (file && file.type.startsWith('image/')) {
            processFile(file)
        }
    }

    const handleFileSelect = (e) => {
        const file = e.target.files[0]
        if (file) {
            processFile(file)
        }
    }

    const processFile = (file) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            setPreview(e.target.result)
            onUpload(e.target.result)
        }
        reader.readAsDataURL(file)
    }

    const handleClick = () => {
        fileInputRef.current?.click()
    }

    const handleClear = () => {
        setPreview(null)
        onUpload(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    return (
        <div className="fade-in">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
            />

            {!preview ? (
                <div
                    className={`upload-zone ${isDragOver ? 'drag-over' : ''}`}
                    onClick={handleClick}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <div className="upload-zone-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                    </div>
                    <h3 className="upload-zone-title">Upload Your Design</h3>
                    <p className="upload-zone-subtitle">
                        Drag & drop an image or click to browse
                    </p>
                    <p className="upload-zone-subtitle" style={{ marginTop: '0.5rem' }}>
                        Supports PNG, JPG, WEBP
                    </p>
                </div>
            ) : (
                <div className="card" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
                    <img
                        src={preview}
                        alt="Your design"
                        style={{
                            maxWidth: '100%',
                            maxHeight: '400px',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: 'var(--space-lg)'
                        }}
                    />
                    <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
                        <button className="btn btn-secondary" onClick={handleClear}>
                            Change Design
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default DesignUploader
