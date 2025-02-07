const User = require('../models/User');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const { sendEmail } = require('../utils/emailSender');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
// Register User
// exports.register = async (req, res) => {
//     const { name, email, password } = req.body;
//     try {
//         const user = await User.create({ name, email, password });
//         const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
//         res.status(201).json({ token, user });
//     } catch (error) {
//         res.status(400).json({ message: error.message });
//     }
// };
const transporter = nodemailer.createTransport({
    service: 'Gmail',  // or use other services like SendGrid
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

exports.register = async (req, res) => {
    const {email, password } = req.body;

    try {
        // Check if the user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create a new user with hashed password
        const user = await User.create({email, password });

        // Generate a 6-digit OTP
        const otp = crypto.randomInt(100000, 999999).toString();

        // Set OTP expiration time to 10 minutes
        user.otp = otp;
        user.otpExpires = Date.now() + 10 * 60 * 1000;  // OTP expires in 10 minutes
        await user.save();

        // Send OTP via email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Your OTP for Email Verification',
            text: `Your OTP is: ${otp}. It will expire in 10 minutes.`,
        };

        await transporter.sendMail(mailOptions);

        // Respond with a message that OTP has been sent
        res.status(201).json({ message: 'OTP sent to email, please verify' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    try {
        // Find the user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if OTP matches and is not expired
        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        if (Date.now() > user.otpExpires) {
            return res.status(400).json({ message: 'OTP has expired' });
        }

        // OTP is valid, mark the account as verified
        user.isVerified = true;
        user.otp = undefined;  // Clear OTP after verification
        user.otpExpires = undefined;  // Clear OTP expiration
        await user.save();

        res.status(200).json({ message: 'Account verified successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Login User
// exports.login = async (req, res) => {
//     const { email, password } = req.body;
//     try {
//         const user = await User.findOne({ email });
//         if (!user || !(await user.matchPassword(password))) {
//             return res.status(401).json({ message: 'Invalid credentials' });
//         }
//         const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
//         res.status(200).json({ token, user });
//     } catch (error) {
//         res.status(400).json({ message: error.message });
//     }
// };
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if the account is verified
        if (!user.isVerified) {
            return res.status(400).json({ message: 'Please verify your account first' });
        }

        // Check if password matches
        if (!(await user.matchPassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Create a JWT token and send it to the user
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
        res.status(200).json({ token, user });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '10m' });
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();
        const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
        await sendEmail(user.email, 'Password Reset', `Click the link to reset your password: ${resetUrl}`);
        res.status(200).json({ message: 'Email sent' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Reset Password
exports.resetPassword = async (req, res) => {
    const { token, password } = req.body;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ _id: decoded.id, resetPasswordToken: token, resetPasswordExpire: { $gt: Date.now() } });
        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};