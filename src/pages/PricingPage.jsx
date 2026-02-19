import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const PricingPage = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [loading, setLoading] = useState(false)
    const [billingLoading, setBillingLoading] = useState(false)

    const params = new URLSearchParams(location.search)
    const checkoutStatus = params.get('checkout')

    const handleCheckout = async (plan) => {
        if (!user) {
            navigate('/login', { state: { from: location } })
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/checkout/create-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ plan })
            })
            const data = await res.json()
            if (data.url) {
                window.location.href = data.url
            } else {
                alert(data.error || 'Checkout not available yet. Please add your Stripe keys to .env')
            }
        } catch {
            alert('Checkout not available yet. Please add your Stripe keys to .env')
        } finally {
            setLoading(false)
        }
    }

    const handleManageBilling = async () => {
        if (!user) {
            navigate('/login', { state: { from: location } })
            return
        }

        setBillingLoading(true)
        try {
            const res = await fetch('/api/checkout/create-portal-session', {
                method: 'POST',
                credentials: 'include'
            })
            const data = await res.json()
            if (data.url) {
                window.location.href = data.url
            } else {
                alert(data.error || 'Billing portal is unavailable right now.')
            }
        } catch {
            alert('Billing portal is unavailable right now.')
        } finally {
            setBillingLoading(false)
        }
    }

    const plans = [
        {
            name: 'Starter',
            price: '$0',
            period: '/month',
            description: 'Perfect for trying out Showroom.',
            features: [
                '5 Mockup Downloads',
                'Basic Templates',
                'Standard Quality',
                'Community Support'
            ],
            cta: 'Get Started',
            ctaLink: '/signup',
            highlighted: false
        },
        {
            name: 'Pro',
            price: '$29',
            period: '/month',
            description: 'For professional designers and sellers.',
            features: [
                'Unlimited Downloads',
                'All Premium Templates',
                '4K Ultra HD Exports',
                'Commercial License',
                'Priority Support'
            ],
            cta: 'Start Free Trial',
            ctaAction: () => handleCheckout('pro'),
            highlighted: true
        },
        {
            name: 'Enterprise',
            price: 'Custom',
            period: '',
            description: 'For large teams and organizations.',
            features: [
                'Everything in Pro',
                'Custom Template Creation',
                'API Access',
                'SSO Authentication',
                'Dedicated Account Manager'
            ],
            cta: 'Contact Sales',
            ctaLink: '/contact',
            highlighted: false
        }
    ]

    const isCurrentPlan = (planName) => {
        if (!user) return false
        if (planName === 'Starter' && (!user.plan || user.plan === 'free')) return true
        if (planName === 'Pro' && user.plan === 'pro') return true
        return false
    }

    return (
        <div className="page" style={{ paddingTop: 'var(--space-xl)' }}>
            <div className="container">
                <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto var(--space-3xl)' }}>
                    <h1 style={{ marginBottom: 'var(--space-md)' }}>Simple, Transparent Pricing</h1>
                    <p style={{ fontSize: '1.2rem' }}>Choose the perfect plan for your creative needs. Upgrade, downgrade, or cancel at any time.</p>
                </div>

                {checkoutStatus === 'success' && (
                    <div style={{
                        background: '#dcfce7',
                        color: '#15803d',
                        padding: 'var(--space-md)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: 'var(--space-xl)',
                        textAlign: 'center',
                        fontWeight: '600'
                    }}>
                        🎉 Welcome to Pro! Your subscription is now active.
                    </div>
                )}

                {checkoutStatus === 'cancelled' && (
                    <div style={{
                        background: '#fef3c7',
                        color: '#92400e',
                        padding: 'var(--space-md)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: 'var(--space-xl)',
                        textAlign: 'center'
                    }}>
                        Checkout was cancelled. You can try again when you're ready.
                    </div>
                )}

                {user?.plan === 'pro' && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginBottom: 'var(--space-xl)'
                    }}>
                        <button
                            className="btn btn-secondary"
                            onClick={handleManageBilling}
                            disabled={billingLoading}
                        >
                            {billingLoading ? 'Opening Billing...' : 'Manage Billing'}
                        </button>
                    </div>
                )}

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: 'var(--space-xl)',
                    alignItems: 'start'
                }}>
                    {plans.map((plan, index) => (
                        <div
                            key={index}
                            className="card"
                            style={{
                                padding: 'var(--space-2xl)',
                                position: 'relative',
                                border: plan.highlighted ? '2px solid var(--color-accent-primary)' : '1px solid var(--color-border)',
                                transform: plan.highlighted ? 'scale(1.05)' : 'none',
                                zIndex: plan.highlighted ? 1 : 0,
                                backgroundColor: plan.highlighted ? 'var(--color-bg-primary)' : 'var(--color-bg-card)'
                            }}
                        >
                            {plan.highlighted && (
                                <div style={{
                                    position: 'absolute',
                                    top: '-12px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    background: 'var(--color-accent-primary)',
                                    color: 'white',
                                    padding: '4px 12px',
                                    borderRadius: 'var(--radius-full)',
                                    fontSize: '0.8rem',
                                    fontWeight: '600',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    Most Popular
                                </div>
                            )}

                            <div style={{ marginBottom: 'var(--space-lg)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                    <h3 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-xs)' }}>{plan.name}</h3>
                                    {isCurrentPlan(plan.name) && (
                                        <span style={{
                                            background: 'var(--color-accent-primary)',
                                            color: 'white',
                                            padding: '2px 8px',
                                            borderRadius: 'var(--radius-full)',
                                            fontSize: '0.7rem',
                                            fontWeight: '600',
                                            textTransform: 'uppercase'
                                        }}>Current</span>
                                    )}
                                </div>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{plan.description}</p>
                            </div>

                            <div style={{ marginBottom: 'var(--space-xl)' }}>
                                <span style={{ fontSize: '3rem', fontWeight: '800', lineHeight: 1 }}>{plan.price}</span>
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}>{plan.period}</span>
                            </div>

                            <ul style={{
                                listStyle: 'none',
                                padding: 0,
                                margin: '0 0 var(--space-2xl)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 'var(--space-md)'
                            }}>
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-success)' }}>
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            {plan.ctaAction ? (
                                <button
                                    onClick={plan.ctaAction}
                                    className={`btn ${plan.highlighted ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ width: '100%' }}
                                    disabled={loading || isCurrentPlan(plan.name)}
                                >
                                    {loading ? 'Redirecting...' : isCurrentPlan(plan.name) ? 'Current Plan' : plan.cta}
                                </button>
                            ) : (
                                <Link
                                    to={plan.ctaLink || '#'}
                                    className={`btn ${plan.highlighted ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ width: '100%', pointerEvents: isCurrentPlan(plan.name) ? 'none' : 'auto', opacity: isCurrentPlan(plan.name) ? 0.6 : 1 }}
                                >
                                    {isCurrentPlan(plan.name) ? 'Current Plan' : plan.cta}
                                </Link>
                            )}
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: 'var(--space-3xl)', textAlign: 'center', padding: 'var(--space-2xl)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
                    <h3>Frequently Asked Questions</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-xl)', marginTop: 'var(--space-xl)', textAlign: 'left' }}>
                        <div>
                            <h4 style={{ marginBottom: 'var(--space-sm)' }}>Can I cancel anytime?</h4>
                            <p>Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.</p>
                        </div>
                        <div>
                            <h4 style={{ marginBottom: 'var(--space-sm)' }}>Do you offer refunds?</h4>
                            <p>We offer a 14-day money-back guarantee for all new Pro subscriptions. No questions asked.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PricingPage
