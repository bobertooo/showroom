import MockupGallery from '../components/MockupGallery'
import { getCurrentDesign } from '../utils/storage'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

function GalleryPage() {
    const navigate = useNavigate()
    const [design, setDesign] = useState(null)

    useEffect(() => {
        const currentDesign = getCurrentDesign()
        setDesign(currentDesign)
    }, [])

    return (
        <div className="page fade-in">
            <div className="container">
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    marginBottom: 'var(--space-2xl)'
                }}>
                    <h1 style={{ marginBottom: 'var(--space-md)' }}>
                        Choose a Mockup
                    </h1>

                    {design ? (
                        <div className="card" style={{
                            padding: 'var(--space-md)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-md)',
                            maxWidth: '500px',
                            margin: '0 auto',
                            marginBottom: 'var(--space-lg)'
                        }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                background: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23333\' fill-opacity=\'0.2\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M0 0h10v10H0zM10 10h10v10H10z\'/%3E%3C/g%3E%3C/svg%3E")',
                                borderRadius: 'var(--radius-md)',
                                overflow: 'hidden',
                                flexShrink: 0,
                                border: '1px solid var(--color-border)'
                            }}>
                                <img
                                    src={design}
                                    alt="Current Design"
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                />
                            </div>
                            <div style={{ flex: 1, textAlign: 'left' }}>
                                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                                    Current Design
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        className="btn btn-secondary"
                                        style={{ fontSize: '0.8rem', padding: '4px 12px' }}
                                        onClick={() => navigate('/')}
                                    >
                                        Change Design
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="card" style={{
                            padding: 'var(--space-lg)',
                            marginBottom: 'var(--space-xl)',
                            textAlign: 'center',
                            background: 'rgba(245, 158, 11, 0.1)',
                            borderColor: 'var(--color-warning)'
                        }}>
                            <p style={{ color: 'var(--color-warning)', marginBottom: 'var(--space-md)' }}>
                                ⚠️ You haven't uploaded a design yet
                            </p>
                            <button
                                className="btn btn-primary"
                                onClick={() => navigate('/')}
                            >
                                Upload Design First
                            </button>
                        </div>
                    )}

                    <p style={{ maxWidth: '600px', margin: '0 auto', color: 'var(--color-text-secondary)' }}>
                        Select a mockup template below to preview your design.
                    </p>
                </div>

                <MockupGallery />
            </div>
        </div>
    )
}

export default GalleryPage
