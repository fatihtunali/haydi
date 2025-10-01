const express = require('express');
const router = express.Router();
const { register, login, getProfile, getUserChallenges, getUserSubmissions } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.get('/my-challenges', authenticateToken, getUserChallenges);
router.get('/my-submissions', authenticateToken, getUserSubmissions);

module.exports = router;
