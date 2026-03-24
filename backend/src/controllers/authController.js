const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/sendEmail');

// --- Helpers ---

const generateToken = (id, email) => {
    return jwt.sign({ id, email }, process.env.JWT_SECRET, {
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

// Hash a 6-digit OTP
const hashOtp = async (otp) => {
    const salt = await bcrypt.genSalt(8); // lower cost — OTPs expire in 10 min
    return bcrypt.hash(otp, salt);
};

// Fire-and-forget: sends in background so the HTTP response is instant
const sendOtpEmailAsync = (email, otp) => {
    sendEmail({
        email,
        subject: 'Your Everlink Verification Code',
        text: `Your Everlink verification code is: ${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.`,
    }).catch((err) => console.error('OTP email failed (background):', err.message));
};

// --- Controllers ---

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    let { name, email, password } = req.body;

    if (name) name = String(name).trim().replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if (email) email = String(email).trim().toLowerCase();
    if (password) password = String(password).trim();

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Please fill in all required fields' });
    }

    // Server-side password validation BEFORE touching the database
    const pwError = validatePassword(password);
    if (pwError) {
        return res.status(400).json({ success: false, message: pwError });
    }

    try {
        let user = await User.findOne({ email });

        if (user && user.isVerified) {
            return res.status(409).json({ success: false, message: 'An account with this email already exists' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await hashOtp(otp);
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

        if (user && !user.isVerified) {
            user.name = name;
            user.password = password;
            user.otp = otpHash;
            user.otpExpires = otpExpires;
            user.otpAttempts = 0;
            user.otpLockedUntil = undefined;
            await user.save();
        } else {
            user = await User.create({ name, email, password, otp: otpHash, otpExpires });
        }

        // Fire-and-forget — respond instantly, email arrives in background
        sendOtpEmailAsync(user.email, otp);
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[DEV] OTP for ${user.email}: ${otp}`);
        }

        return res.status(201).json({
            success: true,
            message: 'Account created. Please check your email for the verification code.',
            email: user.email
        });

    } catch (error) {
        console.error('Register error:', error.message);
        return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
};

// @desc    Verify Email OTP
// @route   POST /api/auth/verify
// @access  Public
const verifyEmail = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    try {
        const user = await User.findOne({ email: String(email).trim().toLowerCase() });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid verification request' });
        }

        if (user.isVerified) {
            return res.status(400).json({ success: false, message: 'This account is already verified. Please log in.' });
        }

        // Check OTP lock
        if (user.otpLockedUntil && user.otpLockedUntil > new Date()) {
            const waitMin = Math.ceil((user.otpLockedUntil - Date.now()) / 60000);
            return res.status(429).json({
                success: false,
                message: `Too many incorrect attempts. Please try again in ${waitMin} minute(s) or request a new code.`
            });
        }

        // Check expiry
        if (!user.otpExpires || user.otpExpires < new Date()) {
            return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
        }

        // Verify OTP hash
        const isMatch = await user.matchOtp(String(otp).trim());
        if (!isMatch) {
            user.otpAttempts = (user.otpAttempts || 0) + 1;
            if (user.otpAttempts >= 5) {
                user.otpLockedUntil = new Date(Date.now() + 15 * 60 * 1000); // lock 15 min
                user.otpAttempts = 0;
            }
            await user.save();
            return res.status(400).json({ success: false, message: 'Incorrect OTP. Please check and try again.' });
        }

        // OTP valid — verify user
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        user.otpAttempts = 0;
        user.otpLockedUntil = undefined;
        await user.save();

        return res.status(200).json({
            success: true,
            token: generateToken(user._id, user.email),
            user: { id: user._id, name: user.name, email: user.email }
        });

    } catch (error) {
        console.error('Verify error:', error.message);
        return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
};

// @desc    Resend OTP to user
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOtp = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
    }

    try {
        const user = await User.findOne({ email: String(email).trim().toLowerCase() });

        if (!user) {
            // Generic response for security
            return res.status(200).json({ success: true, message: 'If this email is registered, a new OTP has been sent.' });
        }

        if (user.isVerified) {
            return res.status(400).json({ success: false, message: 'This account is already verified.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await hashOtp(otp);
        user.otp = otpHash;
        user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        user.otpAttempts = 0;
        user.otpLockedUntil = undefined;
        await user.save();

        sendOtpEmailAsync(user.email, otp);
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[DEV] Resent OTP for ${user.email}: ${otp}`);
        }

        return res.status(200).json({ success: true, message: 'A new verification code has been sent to your email.' });

    } catch (error) {
        console.error('Resend OTP error:', error.message);
        return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    let { email, password } = req.body;
    if (email) email = String(email).trim().toLowerCase();
    if (password) password = String(password).trim();

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Please enter your email and password' });
    }

    try {
        const user = await User.findOne({ email }).select('+password');

        if (user && (await user.matchPassword(password))) {
            if (!user.isVerified) {
                // Resend a fresh OTP
                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                const otpHash = await hashOtp(otp);
                user.otp = otpHash;
                user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
                user.otpAttempts = 0;
                user.otpLockedUntil = undefined;
                await user.save();

                sendOtpEmailAsync(user.email, otp);
                if (process.env.NODE_ENV !== 'production') {
                    console.log(`[DEV] OTP (login unverified) for ${user.email}: ${otp}`);
                }

                return res.status(403).json({
                    success: false,
                    message: 'Please verify your email. A new code has been sent.',
                    unverified: true,
                    email: user.email
                });
            }

            return res.status(200).json({
                success: true,
                token: generateToken(user._id, user.email),
                user: { id: user._id, name: user.name, email: user.email }
            });
        }

        // Generic error for both wrong email and wrong password (security)
        return res.status(401).json({ success: false, message: 'Invalid email or password' });

    } catch (error) {
        console.error('Login error:', error.message);
        return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
};

module.exports = { registerUser, verifyEmail, resendOtp, loginUser };
