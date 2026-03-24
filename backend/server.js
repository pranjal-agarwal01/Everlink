require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./src/config/db');
const { redirectLink } = require('./src/controllers/linkController');

const port = process.env.PORT || 5000;

connectDB();

const app = express();

// Trust Render's reverse proxy (required for express-rate-limit and accurate IP detection)
app.set('trust proxy', 1);

// CORS — allow both the deployed Vercel frontend and localhost dev
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:3000',
].filter(Boolean); // remove undefined entries

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (Postman, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Rate limit for auth routes: 20 requests per 15 minutes per IP
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests. Please wait 15 minutes before trying again.'
    }
});

// Routes
app.use('/api/auth', authLimiter, require('./src/routes/authRoutes'));
app.use('/api/links', require('./src/routes/linkRoutes'));

// Core redirect (catch-all for short slugs)
app.get('/:slug', redirectLink);

app.listen(port, () => {
    console.log(`Server running on port ${port} [${process.env.NODE_ENV || 'development'}]`);
});
