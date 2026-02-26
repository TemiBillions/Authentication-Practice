const express = require('express');
const { signup, login, forgotPassword, resetPassword, verifyOtp, resendOtp, getAllUsers } = require('../controller/user.controller');
const { isAuthenticated } = require('../config/auth');
const router = express.Router();


router.post('/signup', signup)
router.get('/login', login)
router.post('/forgot-password', forgotPassword)
router.put('/reset-password', resetPassword)
router.post('/verify-otp', verifyOtp)
router.post('/resend-otp', resendOtp)
router.get('/get-all-users', isAuthenticated, getAllUsers)




module.exports = router;