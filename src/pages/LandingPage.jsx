import { Link } from 'react-router-dom'
import MockupCarousel from '../components/MockupCarousel'
import BeforeAfterSlider from '../components/BeforeAfterSlider'

function LandingPage() {
    return (
        <main className="landing-page fade-in">
            {/* Hero Section */}
            <section className="hero">
                <div className="container hero-content">
                    <div className="hero-text">
                        <h1 className="hero-title">
                            Etsy-ready mockups in <span className="text-gradient-purple">minutes.</span>
                        </h1>
                        <p className="hero-subtitle">
                            Built for <strong>print-on-demand</strong> and <strong>Etsy sellers</strong>: upload your design, pick a template, and export <strong>listing images fast</strong> with realistic texture and lighting.
                        </p>
                        <div className="hero-cta">
                            <Link to="/create" className="btn btn-primary btn-lg">Start Creating for Free</Link>
                            <Link to="/gallery" className="btn btn-secondary btn-lg">View Gallery</Link>
                        </div>
                    </div>
                    <div className="hero-slider">
                        <BeforeAfterSlider
                            beforeImage="/slider/before.jpg"
                            afterImage="/slider/after.jpg"
                            beforeLabel="Empty Mockup"
                            afterLabel="With Design"
                        />
                    </div>
                </div>
            </section>

            {/* Moving Carousel */}
            <MockupCarousel />

            {/* Features Section */}
            <section className="features">
                <div className="container">
                    <h2 className="section-title">Why Etsy Sellers Use Showroom</h2>
                    <div className="features-grid">
                        <div className="feature-card">
                            <h3>Looks Like a Real Photo</h3>
                            <p>Your design wraps into the product with realistic shading and texture, so your listing images feel authentic, not pasted on.</p>
                        </div>
                        <div className="feature-card">
                            <h3>Made for POD Listings</h3>
                            <p>Create consistent product images across variants without juggling templates, layers, or Photoshop workflows.</p>
                        </div>
                        <div className="feature-card">
                            <h3>Check Placement Fast</h3>
                            <p>Preview how your artwork fits before you order samples, so you catch sizing and alignment issues early.</p>
                        </div>
                        <div className="feature-card">
                            <h3>Texture That Sells</h3>
                            <p>Mockups inherit material texture (cotton, canvas, paper) so your prints look like they belong there.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-card">
                        <h2>Ready to publish your next Etsy listing?</h2>
                        <p>Generate mockups for your POD shop fast, then reuse the same look across your whole catalog.</p>
                        <Link to="/create" className="btn btn-primary btn-lg">Launch Editor</Link>
                    </div>
                </div>
            </section>
        </main>
    )
}

export default LandingPage
