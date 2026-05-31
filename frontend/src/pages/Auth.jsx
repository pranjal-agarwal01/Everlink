import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Client-side rules (mirror the backend)
const validatePassword = (password) => {
    if (!password || password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Za-z]/.test(password)) return 'Password must contain at least one letter';
    if (!/\d/.test(password)) return 'Password must contain at least one number';
    return null;
};

const validateUsername = (username) => {
    if (!username || username.length < 3) return 'Username must be at least 3 characters';
    if (username.length > 20) return 'Username cannot be more than 20 characters';
    if (!/^[a-z0-9_]+$/.test(username)) return 'Username may only contain lowercase letters, numbers, and underscores';
    return null;
};

const Auth = ({ isLogin, loginUser }) => {
    const [formData, setFormData] = useState({ name: '', username: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { id, value } = e.target;
        // Keep the username field URL-safe as the user types
        const next = id === 'username' ? value.toLowerCase().replace(/[^a-z0-9_]/g, '') : value;
        setFormData((prev) => ({ ...prev, [id]: next }));
    };

    const handleAuthSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Client-side validation for signup — before any API call
        if (!isLogin) {
            const unameErr = validateUsername(formData.username);
            if (unameErr) {
                setError(unameErr);
                return;
            }
            const pwErr = validatePassword(formData.password);
            if (pwErr) {
                setError(pwErr);
                return;
            }
        }

        setIsLoading(true);
        try {
            const endpoint = isLogin ? `${API}/api/auth/login` : `${API}/api/auth/register`;
            const body = isLogin
                ? { username: formData.username, password: formData.password }
                : { name: formData.name, username: formData.username, password: formData.password };

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Something went wrong');
            }

            // Both login and register now return a token directly — log in immediately
            loginUser({ token: data.token, ...data.user });
            navigate('/dashboard', { replace: true });
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '480px', margin: '2rem auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'var(--brand-gradient)',
                        margin: '0 auto 1.5rem auto',
                        boxShadow: '0 8px 20px rgba(255, 107, 107, 0.4)'
                    }}></div>
                    <h2 style={{ fontSize: '2.25rem', marginBottom: '0.75rem' }}>
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
                        {isLogin
                            ? 'Enter your credentials to continue'
                            : 'Start managing your permanent links for free'}
                    </p>
                </div>

                {/* Error message */}
                {error && (
                    <div style={{
                        padding: '1rem',
                        backgroundColor: 'rgba(239, 71, 111, 0.1)',
                        color: 'var(--danger-color)',
                        border: '1px solid rgba(239, 71, 111, 0.2)',
                        borderRadius: '12px',
                        marginBottom: '1.5rem',
                        textAlign: 'center',
                        fontSize: '0.95rem',
                        fontWeight: 500
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleAuthSubmit} noValidate>
                    {!isLogin && (
                        <Input
                            label="Full Name"
                            id="name"
                            type="text"
                            placeholder="Jane Doe"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            maxLength={100}
                        />
                    )}
                    <Input
                        label="Username"
                        id="username"
                        type="text"
                        placeholder="jane_doe"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        minLength={3}
                        maxLength={20}
                        autoComplete="username"
                    />
                    <Input
                        label="Password"
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={8}
                        maxLength={100}
                        autoComplete={isLogin ? 'current-password' : 'new-password'}
                    />
                    {!isLogin && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '-0.5rem', marginBottom: '1rem' }}>
                            Min. 8 characters, must include a letter and a number.
                        </p>
                    )}

                    <Button
                        type="submit"
                        variant="primary"
                        style={{ width: '100%', marginTop: '1rem' }}
                        isLoading={isLoading}
                        disabled={isLoading}
                    >
                        {isLogin ? 'Log In' : 'Create Account'}
                    </Button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                    {isLogin ? "Don't have an account? " : 'Already have an account? '}
                    <Link
                        to={isLogin ? '/register' : '/login'}
                        style={{ fontWeight: 600, color: 'var(--primary-color)' }}
                    >
                        {isLogin ? 'Sign Up' : 'Log In'}
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Auth;
