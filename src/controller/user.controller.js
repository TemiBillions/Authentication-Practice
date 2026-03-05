const User = require("../models/user.models");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendEmail } = require("../config/emails");



const signup = async (req, res) => {
    const {name, email, password} = req.body;
    try {
        if (!name || !email || !password) {
            return res.status(400).json({message: 'All fields are required!'});
        }

        const existingUser = await User.findOne({email});
        if (existingUser) {
            return res.status(400).json({message: 'User already exists!'});
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            otp,
            otpExpiry,
        });

        await newUser.save();

        // Send signup verification email with template
        // await sendEmail(
        //     email,
        //     'Verify Your Account - Welcome!',
        //     'signup',
        //     {
        //         name,
        //         otp,
        //         verificationLink: `${process.env.APP_URL || 'http://localhost:3000'}/verify-email`
        //     }
        // );
    
        return res.status(201).json({message: 'User registered successfully! Please check your email to verify your account.'});
    } catch (error) {
        console.error('Error during signup:', error);
    return res.status(500).json({message: 'Server error during signup!'});
    }};


const login = async (req, res) => {
    const {email, password} = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({message: 'Email and password are required!'});
        }

        const user = await User.findOne({email});
        if (!user) {
            return res.status(400).json({message: 'User not found!'});
        }

    if (!user.isVerified) {
        return res.status(400).json({message: 'User is not verified! Please verify your account before logging in.'});
    }

        const comparePassword = await bcrypt.compare(password, user.password); // Compare provided password with hashed password in DB
        if (!comparePassword) {
            return res.status(400).json({message: 'Invalid Credentials!'});
        }

        const token = await jwt.sign({userId: user._id, role: user.role}, process.env.JWT_SECRET, {expiresIn: '1h'}); // Generate JWT token

        // Send login notification email with template
        const loginDate = new Date().toLocaleString();
        // await sendEmail(
        //     email,
        //     'Login Alert - Secure Your Account',
        //     'login',
        //     {
        //         name: user.name,
        //         email,
        //         loginTime: loginDate,
        //         device: 'Web Browser',
        //         ipAddress: req.ip || 'Unknown'
        //     }
        // ).catch(err => console.log('Login email notification failed:', err)); // Don't fail login if email fails

        return res.status(200).json({message: 'Login successful!', token});
    } catch (error) {
        console.error('Error during login:', error);
    return res.status(500).json({message: 'Server error during login!'});
    }};
    
const forgotPassword = async (req, res) => {
    const {email} = req.body;
    try {
        if (!email) {
            return res.status(400).json({message: 'Email is required!'});
        }

        const user = await User.findOne({email});
        if (!user) {
            return res.status(400).json({message: 'User not found!'});
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
        user.otp = otp;
        await user.save();

        // Send forgot password email with template
        // await sendEmail(
        //     email,
        //     'Password Reset Request - Action Required',
        //     'forgotPassword',
        //     {
        //         name: user.name,
        //         otp,
        //         resetLink: `${process.env.APP_URL || 'http://localhost:3000'}/reset-password`
        //     }
        // );

        return res.status(200).json({message: 'OTP sent to your email. Please check your inbox.'});
    } catch (error) {
        console.error('Error during forgot password:', error);
    return res.status(500).json({message: 'Server error during forgot password!'});
    }};

const resetPassword = async (req, res) => {
    const {email, otp, newPassword} = req.body;
    try {
        if (!email || !otp || !newPassword) {
            return res.status(400).json({message: 'All fields are required!'});
        }

        const user = await User.findOne({otp});
        if (!user) {
            return res.status(400).json({message: 'Invalid OTP!'});
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.otp = undefined; // Clear the OTP after successful password reset
        await user.save();

        // Send password reset confirmation email with template
        // await sendEmail(
        //     email,
        //     'Password Reset Successfully',
        //     'resetPassword',
        //     {
        //         name: user.name,
        //         loginLink: `${process.env.APP_URL || 'http://localhost:3000'}/login`
        //     }
        // ).catch(err => console.log('Password reset confirmation email failed:', err));

        return res.status(200).json({message: 'Password reset successfully! You can now log in with your new password.'});
    } catch (error) {
        console.error('Error during reset password:', error);
        return res.status(500).json({message: 'Server error during reset password!'});
    }
};

const verifyOtp = async (req, res) => {
    const {otp} = req.body;
    try {
        if (!otp) {
            return res.status(400).json({message: 'OTP is required!'});
        }

        const user = await User.findOne({otp});
        if (!user) {
            return res.status(400).json({message: 'Invalid OTP!'});
        }

        if (user.otpExpiry < new Date()) {
            return res.status(400).json({message: 'OTP has expired! Please request a new one.'});
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        return res.status(200).json({message: 'OTP verified successfully!'});
    } catch (error) {
        console.error('Error during OTP verification:', error);
        return res.status(500).json({message: 'Server error during OTP verification!'});
    }
};

const resendOtp = async (req, res) => {
    const {email} = req.body;
    try {
        if (!email) {
            return res.status(400).json({message: 'Email is required!'});
        }

        const user = await User.findOne({email});
        if (!user) {
            return res.status(400).json({message: 'User not found!'});
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes
        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        // Send resend OTP email with template
        // await sendEmail(
        //     email,
        //     'Verify Your Account - New OTP',
        //     'signup',
        //     {
        //         name: user.name,
        //         otp,
        //         verificationLink: `${process.env.APP_URL || 'http://localhost:3000'}/verify-email`
        //     }
        // );

        return res.status(200).json({message: 'OTP resent successfully! Please check your email.'});
    } catch (error) {
        console.error('Error during resend OTP:', error);
        return res.status(500).json({message: 'Server error during resend OTP!'});
    }};

const getAllUsers = async (req, res) => {
    const { userId } = req.user; // Get user ID from authenticated request
    try {
        const adminUser = await User.findById(userId); // Fetch the user from the database
        if (adminUser.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required.' });
        }
        const users = await User.find().select('-password -otp -otpExpiry'); // Exclude password, otp, and otpExpiry fields
        return res.status(200).json({ users });
    } catch (error) {
        console.error('Error fetching all users:', error);
        return res.status(500).json({ message: 'Server error while fetching all users!' });
    }
};

module.exports = { signup, login, forgotPassword, resetPassword, verifyOtp, resendOtp, getAllUsers };