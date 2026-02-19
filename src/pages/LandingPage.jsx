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
                            Mockups you'll <span className="text-gradient-purple">actually use.</span>
                        </h1>
                        <p className="hero-subtitle">
                            Upload your design, pick a template, and get <strong>listing-ready product images in under a minute</strong>—no Photoshop, no photo shoots, no hassle.
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
                    <h2 className="section-title">Why Use Showroom?</h2>
                    <div className="features-grid">
                        <div className="feature-card">
                            <h3>It Just Looks Real</h3>
                            <p>Upload your design and see it placed directly on the product, with realistic shading and texture, not just a flat sticker effect.</p>
                        </div>
                        <div className="feature-card">
                            <h3>Better Than The Others</h3>
                            <p>Most mockup tools look fake or cost a fortune. Showroom gives you <strong>premium, high-end visuals</strong> that actually look like a real photoshoot.</p>
                        </div>
                        <div className="feature-card">
                            <h3>See It Before You Print</h3>
                            <p>Don't waste money on samples. Visualize exactly how your artwork fits on the product instantly and ensure your design is perfect.</p>
                        </div>
                        <div className="feature-card">
                            <h3>Smart Texture Mapping</h3>
                            <p>Your design inherits the product's natural texture—whether it's cotton, canvas, or matte paper. It doesn't look like a sticker.</p>
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
