const express = require('express');
const router = express.Router();
const { registerUser, loginUser, verifyEmail, resendOtp } = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify', verifyEmail);
router.post('/resend-otp', resendOtp);

module.exports = router;
