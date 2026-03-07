const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    verifyEmail
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify', verifyEmail);


module.exports = router;
