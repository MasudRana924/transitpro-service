const User = require('../models/User');
const cloudinary = require('cloudinary').v2;

// Update Profile
exports.updateProfile = async (req, res) => {
    const { name, email } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (name) user.name = name;
        if (email) user.email = email;
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path);
            user.profileImage = result.secure_url;
        }
        await user.save();
        res.status(200).json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};