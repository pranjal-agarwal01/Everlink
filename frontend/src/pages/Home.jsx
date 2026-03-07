import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

const Home = () => {
    return (
        <div className="container" style={{ position: 'relative', overflow: 'hidden' }}>
            {/* Background decorative blob */}
            <div style={{
                position: 'absolute',
                top: '-10%',
                right: '-5%',
                width: '500px',
                height: '500px',
                background: 'radial-gradient(circle, var(--primary-soft), transparent 70%)',
                borderRadius: '50%',
                zIndex: -1,
                filter: 'blur(60px)'
            }}></div>

            <div style={{
                padding: '6rem 0',
                textAlign: 'center',
                maxWidth: '800px',
                margin: '0 auto'
            }} className="animate-fade-in">
                <h1 style={{
                    fontSize: '4.5rem',
                    marginBottom: '1.5rem',
                    background: 'var(--brand-gradient)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    lineHeight: '1.1',
                    letterSpacing: '-0.04em'
                }}>
                    Own Your Links,<br />Forever.
                </h1>
                <p style={{
                    fontSize: '1.35rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '3rem',
                    maxWidth: '650px',
                    margin: '0 auto 3rem auto',
                    fontWeight: 500
                }}>
                    The premium, lightning-fast URL manager. Update the destination behind your permanent links anytime—without breaking where they're shared.
                </p>

                <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
                    <Link to="/register">
                        <Button variant="primary" style={{ padding: '1.1rem 2.5rem', fontSize: '1.15rem' }}>
                            Start for Free ✨
                        </Button>
                    </Link>
                    <Link to="/login">
                        <Button variant="secondary" style={{ padding: '1.1rem 2.5rem', fontSize: '1.15rem' }}>
                            Login
                        </Button>
                    </Link>
                </div>
            </div>

            <div style={{ padding: '4rem 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                <div className="glass-panel text-center" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚡️</div>
                    <h3 style={{ marginBottom: '1rem' }}>Instant Updates</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Change the destination URL in your dashboard, and it updates instantly for everyone.</p>
                </div>
                <div className="glass-panel text-center" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🛡️</div>
                    <h3 style={{ marginBottom: '1rem' }}>Custom Slugs</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Claim a readable, custom URL slug (e.g., everlink.app/resume) so it’s easy to share.</p>
                </div>
                <div className="glass-panel text-center" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💸</div>
                    <h3 style={{ marginBottom: '1rem' }}>Completely Free</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>No paywalls for the essential features. Redirect logic is open for everyone to use.</p>
                </div>
            </div>
        </div>
    );
};

export default Home;
