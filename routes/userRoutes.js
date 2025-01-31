const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const router = express.Router();

router.put('/update-profile', authMiddleware, upload.single('profileImage'), userController.updateProfile);

module.exports = router;