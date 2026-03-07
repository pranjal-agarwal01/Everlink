const User = require('../models/User');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

// Generate JWT
const generateToken = (id, email) => {
    return jwt.sign({ id, email }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    let { name, email, password } = req.body;

    if (name) name = String(name).trim().replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if (email) email = String(email).trim().toLowerCase();
    if (password) password = String(password).trim();

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Please add all required fields' });
    }

    try {
        // Check if user exists
        let user = await User.findOne({ email });

        if (user && user.isVerified) {
            return res.status(409).json({ success: false, message: 'User already exists' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

        if (user && !user.isVerified) {
            user.name = name;
            user.password = password;
            user.otp = otp;
            user.otpExpires = otpExpires;
            await user.save();
        } else {
            // Create user
            user = await User.create({
                name,
                email,
                password,
                otp,
                otpExpires
            });
        }

        if (user) {
            // Send OTP email
            try {
                await sendEmail({
                    email: user.email,
                    subject: 'Verify your Everlink account',
                    message: `Welcome to Everlink! Your verification OTP is: ${otp}\nIt expires in 10 minutes.`
                });
                console.log(`[DEV] OTP for ${user.email} is ${otp}`); // For easy local dev
            } catch (err) {
                console.error('Email could not be sent', err);
            }

            // Do not log them in yet, just confirm creation
            res.status(201).json({
                success: true,
                message: 'Account created. Please verify your email with the OTP sent.',
                email: user.email
            });
        } else {
            res.status(400).json({ success: false, message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Verify Email OTP
// @route   POST /api/auth/verify
// @access  Public
const verifyEmail = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            // Security: generic response
            return res.status(400).json({ success: false, message: 'Invalid verification request' });
        }

        if (user.isVerified) {
            return res.status(400).json({ success: false, message: 'User is already verified' });
        }

        if (user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            token: generateToken(user._id, user.email),
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    let { email, password } = req.body;
    if (email) email = String(email).trim().toLowerCase();
    if (password) password = String(password).trim();

    try {
        // Find user by email, but don't reveal if they exist or not
        const user = await User.findOne({ email }).select('+password');

        if (user && (await user.matchPassword(password))) {
            if (!user.isVerified) {
                // Generate new OTP and send if not verified
                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                user.otp = otp;
                user.otpExpires = Date.now() + 10 * 60 * 1000;
                await user.save();

                try {
                    await sendEmail({
                        email: user.email,
                        subject: 'Verify your Everlink account',
                        message: `Your new verification OTP is: ${otp}`
                    });
                    console.log(`[DEV] New OTP for ${user.email} is ${otp}`);
                } catch { }

                return res.status(403).json({
                    success: false,
                    message: 'Please verify your email. A new OTP has been sent.',
                    unverified: true,
                    email: user.email
                });
            }

            res.status(200).json({
                success: true,
                token: generateToken(user._id, user.email),
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email
                }
            });
        } else {
            // Security: generic error for both wrong email and wrong password
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    registerUser,
    verifyEmail,
    loginUser
};
