import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../ui/Button';

const Navbar = ({ user, logout }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header style={{
            background: 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(0,0,0,0.05)',
            padding: '1.25rem 0',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            transition: 'all 0.3s ease'
        }}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to="/" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    fontWeight: 800,
                    fontSize: '1.35rem',
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                    fontFamily: "'Plus Jakarta Sans', sans-serif"
                }}>
                    <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        background: 'var(--brand-gradient)',
                        boxShadow: '0 4px 10px rgba(255, 107, 107, 0.3)'
                    }}></div>
                    Everlink
                </Link>
                <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {user ? (
                        <>
                            <Link to="/dashboard" style={{ fontWeight: 500 }}>Dashboard</Link>
                            <Button variant="secondary" onClick={handleLogout} style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}>Logout</Button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" style={{ fontWeight: 500 }}>Login</Link>
                            <Link to="/register">
                                <Button variant="primary" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}>Sign Up</Button>
                            </Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
};

export default Navbar;
