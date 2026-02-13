import { Link } from 'react-router-dom'
import MockupCarousel from '../components/MockupCarousel'

function LandingPage() {
    return (
        <main className="landing-page fade-in">
            {/* Hero Section */}
            <section className="hero">
                <div className="container hero-content">
                    <h1 className="hero-title">
                        Showcase Your Art <span className="text-gradient">Professionally</span>
                    </h1>
                    <p className="hero-subtitle">
                        The ultimate mockup tool for artists, designers, and print-on-demand sellers.
                        Create stunning, high-converting product images in seconds.
                    </p>
                    <div className="hero-cta">
                        <Link to="/create" className="btn btn-primary btn-lg">Start Creating for Free</Link>
                        <Link to="/gallery" className="btn btn-secondary btn-lg">View Gallery</Link>
                    </div>
                    {/* Visual / Abstract Graphic - Minimal/Clean */}
                    {/* Visual Removed for Minimal Text-First Look */}
                </div>
            </section>

            {/* Moving Carousel */}
            <MockupCarousel />

            {/* Features Section */}
            <section className="features">
                <div className="container">
                    <h2 className="section-title">Why Use Showroom?</h2>
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">🎨</div>
                            <h3>Artist First</h3>
                            <p>Designed specifically for creators. Visualize your artwork on real products with accurate lighting and perspective.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">⚡</div>
                            <h3>Instant Preview</h3>
                            <p>Real-time rendering. Drag, drop, and adjust your design to see exactly how it looks before downloading.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">👕</div>
                            <h3>POD Ready</h3>
                            <p>Perfect for Print-on-Demand. Generate professional assets for your shop without needing expensive photo shoots.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">🔄</div>
                            <h3>Smart Blending</h3>
                            <p>Advanced blending modes ensure your design looks natural, respecting shadows and fabric textures.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-card">
                        <h2>Ready to elevate your portfolio?</h2>
                        <p>Join thousands of designers creating better product visuals today.</p>
                        <Link to="/create" className="btn btn-primary btn-lg">Launch Editor</Link>
                    </div>
                </div>
            </section>
        </main>
    )
}

export default LandingPage
