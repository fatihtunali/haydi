const express = require('express');
const router = express.Router();
const { register, login, getProfile, getUserChallenges, getUserSubmissions, updateProfile, updateAvatar, getUserById } = require('../controllers/authController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { avatarUpload } = require('../middleware/upload');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.put('/avatar', authenticateToken, avatarUpload.single('avatar'), updateAvatar);
router.get('/my-challenges', authenticateToken, getUserChallenges);
router.get('/my-submissions', authenticateToken, getUserSubmissions);

// Public user profile (with optional auth for follow status)
router.get('/users/:id', optionalAuth, getUserById);

module.exports = router;
