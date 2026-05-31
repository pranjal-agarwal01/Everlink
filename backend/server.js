// Force IPv4 DNS resolution — Render free tier cannot reach IPv6 endpoints
require('dns').setDefaultResultOrder('ipv4first');

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./src/config/db');
const { redirectLink } = require('./src/controllers/linkController');

const port = process.env.PORT || 5000;

const app = express();

// Trust Render's reverse proxy (required for express-rate-limit and accurate IP detection)
app.set('trust proxy', 1);

// CORS — supports a comma-separated list in FRONTEND_URL so Vercel preview deploys work
const allowedOrigins = [
    ...(process.env.FRONTEND_URL || '').split(',').map((s) => s.trim()).filter(Boolean),
    'http://localhost:5173',
    'http://localhost:3000',
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no Origin header (curl, Postman, server-to-server, health checks)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        console.warn(`[CORS] Blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false }));

// Health endpoint — for uptime monitors / Render keep-alive pings
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Rate limit for auth routes: 20 requests per 15 minutes per IP.
// Skip preflight OPTIONS so CORS doesn't burn the budget.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === 'OPTIONS',
    message: {
        success: false,
        message: 'Too many requests. Please wait 15 minutes before trying again.',
    },
});

// Routes
app.use('/api/auth', authLimiter, require('./src/routes/authRoutes'));
app.use('/api/links', require('./src/routes/linkRoutes'));

// Core redirect (catch-all for short slugs) — must come LAST so it doesn't shadow /api/* or /health
app.get('/:slug', redirectLink);

// JSON 404 + error handler so the client always gets a parseable response
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Not found' });
});

app.use((err, req, res, _next) => {
    console.error('[ERROR]', err.message);
    res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' });
});

// Start: connect to MongoDB first, then accept HTTP requests.
// Without await, the server answers 500s during the cold-start window before Mongo is ready.
(async () => {
    try {
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not set. Auth cannot work — set it in your environment.');
        }
        await connectDB();
        app.listen(port, () => {
            console.log(`Server running on port ${port} [${process.env.NODE_ENV || 'development'}]`);
        });
    } catch (err) {
        console.error('Fatal startup error:', err.message);
        process.exit(1);
    }
})();
