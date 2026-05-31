const User = require('../models/User');
const jwt = require('jsonwebtoken');

// --- Helpers ---

const generateToken = (id, username) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not set on the server');
    }
    return jwt.sign({ id, username }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
};

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const validatePassword = (password) => {
    if (!password || password.length < 8) {
        return 'Password must be at least 8 characters';
    }
    if (!PASSWORD_REGEX.test(password)) {
        return 'Password must contain at least one letter and one number';
    }
    return null;
};

// Username: 3–20 chars, lowercase letters, numbers, and underscores only.
const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

const validateUsername = (username) => {
    if (!username || username.length < 3) {
        return 'Username must be at least 3 characters';
    }
    if (username.length > 20) {
        return 'Username cannot be more than 20 characters';
    }
    if (!USERNAME_REGEX.test(username)) {
        return 'Username may only contain lowercase letters, numbers, and underscores';
    }
    return null;
};

// --- Controllers ---

// @desc    Register a new user (name + username + password — logs in immediately)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    let { name, username, password } = req.body;

    if (name) name = String(name).trim().replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if (username) username = String(username).trim().toLowerCase();
    if (password) password = String(password).trim();

    if (!name || !username || !password) {
        return res.status(400).json({ success: false, message: 'Please fill in all required fields' });
    }

    // Server-side validation BEFORE touching the database
    const unameError = validateUsername(username);
    if (unameError) {
        return res.status(400).json({ success: false, message: unameError });
    }

    const pwError = validatePassword(password);
    if (pwError) {
        return res.status(400).json({ success: false, message: pwError });
    }

    try {
        const existing = await User.findOne({ username });
        if (existing) {
            return res.status(409).json({ success: false, message: 'This username is already taken' });
        }

        const user = await User.create({ name, username, password });

        return res.status(201).json({
            success: true,
            token: generateToken(user._id, user.username),
            user: { id: user._id, name: user.name, username: user.username },
        });
    } catch (error) {
        console.error('Register error:', error.message);
        if (error.name === 'ValidationError') {
            const msg = Object.values(error.errors)[0]?.message || 'Invalid input';
            return res.status(400).json({ success: false, message: msg });
        }
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'This username is already taken' });
        }
        return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    let { username, password } = req.body;
    if (username) username = String(username).trim().toLowerCase();
    if (password) password = String(password).trim();

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Please enter your username and password' });
    }

    try {
        const user = await User.findOne({ username }).select('+password');

        if (user && (await user.matchPassword(password))) {
            return res.status(200).json({
                success: true,
                token: generateToken(user._id, user.username),
                user: { id: user._id, name: user.name, username: user.username },
            });
        }

        // Generic error for both wrong username and wrong password (prevents user enumeration)
        return res.status(401).json({ success: false, message: 'Invalid username or password' });
    } catch (error) {
        console.error('Login error:', error.message);
        return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
};

module.exports = { registerUser, loginUser };
