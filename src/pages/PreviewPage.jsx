import { useParams } from 'react-router-dom'
import MockupPreview from '../components/MockupPreview'
import { useMockup } from '../hooks/useMockups'
import { getCurrentDesign } from '../utils/storage'

function PreviewPage() {
    const { id } = useParams()
    const { mockup, loading } = useMockup(id)
    const designImage = getCurrentDesign()

    if (loading) {
        return (
            <main className="page">
                <div className="container" style={{ textAlign: 'center' }}>
                    <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                    <p style={{ marginTop: 'var(--space-lg)' }}>Loading preview...</p>
                </div>
            </main>
        )
    }

    return (
        <main className="page">
            <div className="container">


                <MockupPreview mockup={mockup} designImage={designImage} />
            </div>
        </main>
    )
}

export default PreviewPage
