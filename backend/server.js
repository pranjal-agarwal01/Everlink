require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const { redirectLink } = require('./src/controllers/linkController');

const port = process.env.PORT || 5000;

connectDB();

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/links', require('./src/routes/linkRoutes'));

// The Core Engine Redirect Route (Catch-all for short paths)
app.get('/:slug', redirectLink);

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
