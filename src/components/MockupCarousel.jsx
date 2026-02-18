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
        let sourceItems = mockups.length > 0 ? mockups : placeholders

        // Shuffle the items to show random templates/uploads
        // Create a copy to avoid mutating state directly (though shuffle usually creates new array)
        if (mockups.length > 0) {
            sourceItems = [...mockups]
                .sort(() => Math.random() - 0.5)
                .slice(0, 12) // Pick 12 random items to keep the carousel fresh but manageable
        }

        // Duplicate items to ensure smooth infinite scroll
        // We ensure we have enough items for the track
        let finalItems = [...sourceItems]
        // If we have few items, duplicate more times to fill width
        if (finalItems.length < 10) {
            finalItems = [...sourceItems, ...sourceItems, ...sourceItems, ...sourceItems]
        } else {
            finalItems = [...sourceItems, ...sourceItems]
        }

        setDisplayItems(finalItems)
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
