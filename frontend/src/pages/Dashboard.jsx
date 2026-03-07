import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Dashboard = ({ user, logoutUser }) => {
    const [links, setLinks] = useState([]);
    const [formData, setFormData] = useState({ title: '', originalUrl: '', slug: '' });
    const [editingId, setEditingId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchLinks();
    }, []);

    const authHeaders = () => ({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`,
    });

    const fetchLinks = async () => {
        setIsFetching(true);
        try {
            const res = await fetch(`${API}/api/links`, {
                headers: { Authorization: `Bearer ${user.token}` },
            });

            // If unauthorized (e.g. expired token), log them out
            if (res.status === 401) {
                logoutUser();
                navigate('/login');
                return;
            }

            const data = await res.json();
            if (res.ok && data.success) {
                setLinks(data.links);
            }
        } catch (err) {
            console.error('Failed to fetch links:', err);
        } finally {
            setIsFetching(false);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({ title: '', originalUrl: '', slug: '' });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            if (editingId) {
                const res = await fetch(`${API}/api/links/${editingId}`, {
                    method: 'PUT',
                    headers: authHeaders(),
                    body: JSON.stringify(formData),
                });
                const data = await res.json();
                if (!res.ok || !data.success) throw new Error(data.message || 'Update failed');

                setLinks((prev) => prev.map((l) => (l._id === editingId ? data.link : l)));
                resetForm();
            } else {
                const res = await fetch(`${API}/api/links`, {
                    method: 'POST',
                    headers: authHeaders(),
                    body: JSON.stringify({ originalUrl: formData.originalUrl }),
                });
                const data = await res.json();
                if (!res.ok || !data.success) throw new Error(data.message || 'Create failed');

                setLinks((prev) => [data.link, ...prev]);
                resetForm();
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (link) => {
        setEditingId(link._id);
        setFormData({ title: link.title || '', originalUrl: link.originalUrl, slug: link.slug });
        setError('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this link permanently?')) return;
        try {
            const res = await fetch(`${API}/api/links/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${user.token}` },
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setLinks((prev) => prev.filter((l) => l._id !== id));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(id);
            setTimeout(() => setCopied(null), 2000);
        });
    };

    const shortUrl = (slug) => {
        const baseUrl = API.replace(/^https?:\/\//, ''); // Remove http/https for display
        return `${baseUrl}/${slug}`;
    };

    return (
        <div className="container animate-fade-in">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Your Links</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Welcome back, <strong>{user.name}</strong>
                    </p>
                </div>
                {editingId && (
                    <Button variant="secondary" onClick={resetForm}>
                        ← Cancel Edit
                    </Button>
                )}
            </div>

            {/* Create / Edit Form */}
            <div className="glass-panel" style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 600 }}>
                    {editingId ? '✏️ Edit Link' : '+ Create New Link'}
                </h3>

                {error && (
                    <div
                        style={{
                            padding: '0.75rem 1rem',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            color: 'var(--danger-color, #ef4444)',
                            border: '1px solid rgba(239,68,68,0.3)',
                            borderRadius: '8px',
                            marginBottom: '1rem',
                            fontSize: '0.9rem',
                        }}
                    >
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <Input
                        label="Title (optional)"
                        id="title"
                        type="text"
                        placeholder="e.g. My Portfolio, GitHub, Resume"
                        value={formData.title}
                        onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                        maxLength={100}
                    />
                    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: editingId ? '1fr 1fr' : '1fr', marginTop: '0.5rem' }}>
                        <Input
                            label="Destination URL"
                            id="originalUrl"
                            type="url"
                            placeholder="https://your-project.vercel.app"
                            value={formData.originalUrl}
                            onChange={(e) => setFormData((p) => ({ ...p, originalUrl: e.target.value }))}
                            required
                        />
                        {editingId && (
                            <Input
                                label="Custom Slug (optional)"
                                id="slug"
                                type="text"
                                placeholder="my-portfolio"
                                value={formData.slug}
                                onChange={(e) => setFormData((p) => ({ ...p, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                            />
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                        <Button type="submit" variant="primary" isLoading={isLoading} disabled={isLoading}>
                            {editingId ? 'Save Changes' : 'Create Link'}
                        </Button>
                        {editingId && (
                            <Button type="button" variant="secondary" onClick={resetForm}>
                                Cancel
                            </Button>
                        )}
                    </div>
                </form>
            </div>

            {/* Links List */}
            <div style={{ display: 'grid', gap: '1rem' }}>
                {isFetching ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        <span className="spinner" style={{ display: 'inline-block' }}></span>
                        <p style={{ marginTop: '1rem' }}>Loading your links...</p>
                    </div>
                ) : links.length === 0 ? (
                    <div
                        className="glass-panel"
                        style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}
                    >
                        <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>🔗</div>
                        <p>No links yet. Create your first permanent link above!</p>
                    </div>
                ) : (
                    links.map((link) => (
                        <div
                            key={link._id}
                            className="glass-panel glass-card-hover"
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '1.75rem',
                                gap: '1.5rem',
                            }}
                        >
                            <div style={{ overflow: 'hidden', flex: 1 }}>
                                {link.title && (
                                    <div style={{
                                        fontWeight: 800,
                                        fontSize: '1.15rem',
                                        marginBottom: '0.4rem',
                                        color: 'var(--text-primary)',
                                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                                        letterSpacing: '-0.02em'
                                    }}>
                                        {link.title}
                                    </div>
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
                                    <a
                                        href={`${API}/${link.slug}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{
                                            fontWeight: 600,
                                            fontSize: '1.05rem',
                                            color: 'var(--primary-color)'
                                        }}
                                    >
                                        {shortUrl(link.slug)}
                                    </a>
                                    <button
                                        onClick={() => copyToClipboard(`${API}/${link.slug}`, link._id)}
                                        title="Copy link"
                                        style={{
                                            background: copied === link._id ? 'var(--success-color)' : 'var(--surface-color)',
                                            border: `1px solid ${copied === link._id ? 'var(--success-color)' : 'var(--border-color)'}`,
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            padding: '0.3rem 0.6rem',
                                            borderRadius: '6px',
                                            color: copied === link._id ? 'white' : 'var(--text-secondary)',
                                            transition: 'all 0.2s ease',
                                            boxShadow: 'var(--shadow-sm)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        {copied === link._id ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                                <div
                                    style={{
                                        color: 'var(--text-secondary)',
                                        fontSize: '0.9rem',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        maxWidth: '550px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <span style={{ opacity: 0.5 }}>→</span>
                                    <a href={link.originalUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>
                                        {link.originalUrl}
                                    </a>
                                </div>
                                <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span className="badge">
                                        ⚡ {link.clicks} CLICKS
                                    </span>
                                    <span>
                                        Created {new Date(link.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0, flexDirection: 'column' }}>
                                <Button variant="secondary" onClick={() => handleEdit(link)} style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}>
                                    Edit Link
                                </Button>
                                <Button variant="danger" onClick={() => handleDelete(link._id)} style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}>
                                    Delete
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Dashboard;
