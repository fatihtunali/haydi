const express = require('express');
const router = express.Router();
const {
    getAllChallenges,
    getChallengeById,
    createChallenge,
    joinChallenge,
    getCategories
} = require('../controllers/challengeController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Public/optional auth routes
router.get('/', optionalAuth, getAllChallenges);
router.get('/categories', getCategories);
router.get('/:id', optionalAuth, getChallengeById);

// Protected routes
router.post('/', authenticateToken, createChallenge);
router.post('/:id/join', authenticateToken, joinChallenge);

module.exports = router;
