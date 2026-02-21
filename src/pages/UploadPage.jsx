import { useNavigate, useLocation } from 'react-router-dom'
import DesignUploader from '../components/DesignUploader'
import { saveCurrentDesign, getCurrentDesign } from '../utils/storage'
import { useState, useEffect } from 'react'

function UploadPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const queryParams = new URLSearchParams(location.search)
    const redirectTo = queryParams.get('redirect')
    const [hasDesign, setHasDesign] = useState(false)

    useEffect(() => {
        // Check if there's already a design in session
        const existing = getCurrentDesign()
        setHasDesign(!!existing)
    }, [])

    const handleUpload = (designData) => {
        saveCurrentDesign(designData)
        setHasDesign(!!designData)
        if (redirectTo) {
            navigate(redirectTo)
        }
    }

    return (
        <main className="page">
            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
                    <h1 style={{ marginBottom: 'var(--space-md)' }}>
                        Upload Your Design
                    </h1>
                    <p style={{ maxWidth: '600px', margin: '0 auto' }}>
                        Start by uploading your graphic design. Then choose from our mockup templates
                        to see how it looks on real products.
                    </p>
                </div>

                <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                    <DesignUploader onUpload={handleUpload} />

                    {hasDesign && (
                        <div style={{ textAlign: 'center', marginTop: 'var(--space-xl)' }}>
                            <button
                                className="btn btn-primary"
                                onClick={() => navigate('/gallery')}
                            >
                                Choose a Mockup →
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </main>
    )
}

export default UploadPage
