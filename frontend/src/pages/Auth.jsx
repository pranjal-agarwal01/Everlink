import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Auth = ({ isLogin, loginUser }) => {
    const [step, setStep] = useState('FORM'); // 'FORM' or 'VERIFY'
    const [pendingEmail, setPendingEmail] = useState('');
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const handleAuthSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const endpoint = isLogin ? `${API}/api/auth/login` : `${API}/api/auth/register`;
            const body = isLogin
                ? { email: formData.email, password: formData.password }
                : { name: formData.name, email: formData.email, password: formData.password };

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) {
                // Handle unverified user during login → show OTP step
                if (res.status === 403 && data.unverified) {
                    setPendingEmail(data.email || formData.email);
                    setStep('VERIFY');
                    setError(data.message);
                    return;
                }
                throw new Error(data.message || 'Something went wrong');
            }

            if (isLogin) {
                // Login success
                const userData = { token: data.token, ...data.user };
                loginUser(userData);
                navigate('/dashboard');
            } else {
                // Register success → show OTP step
                setPendingEmail(formData.email);
                setStep('VERIFY');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifySubmit = async (e) => {
        e.preventDefault();
        if (!otp.trim()) {
            setError('Please enter the OTP');
            return;
        }
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch(`${API}/api/auth/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: pendingEmail, otp: otp.trim() }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Verification failed');
            }

            const userData = { token: data.token, ...data.user };
            loginUser(userData);
            navigate('/dashboard');
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
                        {step === 'VERIFY' ? 'Check Your Email' : isLogin ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
                        {step === 'VERIFY'
                            ? `We sent a 6-digit OTP to `
                            : isLogin
                                ? 'Enter your credentials to continue'
                                : 'Start managing your permanent links for free'}

                        {step === 'VERIFY' && <strong style={{ color: 'var(--text-primary)' }}>{pendingEmail}</strong>}
                    </p>
                </div>

                {error && (
                    <div
                        style={{
                            padding: '1rem',
                            backgroundColor: 'rgba(239, 71, 111, 0.1)',
                            color: 'var(--danger-color)',
                            border: '1px solid rgba(239, 71, 111, 0.2)',
                            borderRadius: '12px',
                            marginBottom: '2rem',
                            textAlign: 'center',
                            fontSize: '0.95rem',
                            fontWeight: 500
                        }}
                    >
                        {error}
                    </div>
                )}

                {step === 'FORM' ? (
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
                            label="Email Address"
                            id="email"
                            type="email"
                            placeholder="jane@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            maxLength={200}
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
                        />

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
                ) : (
                    <form onSubmit={handleVerifySubmit} noValidate>
                        <Input
                            label="6-Digit OTP Code"
                            id="otp"
                            type="text"
                            inputMode="numeric"
                            placeholder="123456"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            required
                            maxLength={6}
                            style={{ textAlign: 'center', letterSpacing: '0.4rem', fontSize: '1.3rem', fontWeight: 600 }}
                        />
                        <Button
                            type="submit"
                            variant="primary"
                            style={{ width: '100%', marginTop: '1rem' }}
                            isLoading={isLoading}
                            disabled={isLoading}
                        >
                            Verify & Log In
                        </Button>
                        <button
                            type="button"
                            onClick={() => { setStep('FORM'); setError(''); setOtp(''); }}
                            style={{
                                display: 'block',
                                width: '100%',
                                textAlign: 'center',
                                marginTop: '1rem',
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                            }}
                        >
                            ← Go Back
                        </button>
                    </form>
                )}

                {step === 'FORM' && (
                    <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                        {isLogin ? "Don't have an account? " : 'Already have an account? '}
                        <Link
                            to={isLogin ? '/register' : '/login'}
                            style={{ fontWeight: 600, color: 'var(--primary-color)' }}
                        >
                            {isLogin ? 'Sign Up' : 'Log In'}
                        </Link>
                    </p>
                )}
            </div>
        </div>
    );
};

export default Auth;
