import { useEffect, useState } from 'react'
import { useMockups } from '../hooks/useMockups'
import { Link } from 'react-router-dom'

function MockupCarousel() {
    const { mockups } = useMockups()
    const [displayItems, setDisplayItems] = useState([])

    // Fallback placeholders if no mockups exist
    const placeholders = Array(8).fill(null).map((_, i) => ({
        id: `placeholder-${i}`,
        name: `Mockup Template ${i + 1}`,
        image: null // Will render gradient
    }))

    useEffect(() => {
        // Use real mockups if available, otherwise placeholders
        const sourceItems = mockups.length > 0 ? mockups : placeholders

        // Duplicate items to ensure smooth infinite scroll
        // Ideally we want enough items to fill 2x the screen width
        // For simplicity, we just double the list
        setDisplayItems([...sourceItems, ...sourceItems, ...sourceItems])
    }, [mockups])

    return (
        <section className="carousel-section">
            <div className="carousel-container">
                <div className="carousel-track">
                    {displayItems.map((item, index) => (
                        <div key={`${item.id}-${index}`} className="carousel-item">
                            {item.image ? (
                                <img src={item.image} alt={item.name} loading="lazy" />
                            ) : (
                                <div className="carousel-placeholder">
                                    <div className="placeholder-icon">📷</div>
                                    <span>{item.name}</span>
                                </div>
                            )}
                            {/* Overlay or link? */}
                            <Link to={item.image ? `/preview/${item.id}` : '/create'} className="carousel-overlay">
                                <span>Preview</span>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
            <div className="carousel-fade-left"></div>
            <div className="carousel-fade-right"></div>
        </section>
    )
}

export default MockupCarousel
