import React from 'react';
import Navbar from './Navbar';
const Layout = ({ children, user, logout }) => {
    return (
        <div className="dashboard-layout">
            <Navbar user={user} logout={logout} />
            <main style={{ flex: 1, padding: '2rem 0' }}>
                {children}
            </main>
            <footer style={{
                padding: '3rem 0',
                textAlign: 'center',
                borderTop: '1px solid var(--border-light)',
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
                fontFamily: "'Plus Jakarta Sans', sans-serif"
            }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Everlink</span>
                        <span>&copy; {new Date().getFullYear()}</span>
                        <span style={{ margin: '0 0.5rem', opacity: 0.3 }}>|</span>
                        <span>All rights reserved.</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <span>⚡ Engineered by</span>
                        <a
                            href="YOUR_PROFILE_LINK_HERE"
                            target="_blank"
                            rel="noreferrer"
                            style={{
                                fontWeight: 800,
                                background: 'var(--brand-gradient)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                textDecoration: 'none',
                            }}
                        >
                            Pranjal Agarwal
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
