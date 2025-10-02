const express = require('express');
const router = express.Router();
const {
    getAllChallenges,
    getChallengeById,
    createChallenge,
    joinChallenge,
    getCategories,
    getStats,
    getUserChallenges,
    updateChallenge,
    deleteChallenge,
    submitChallengeForApproval
} = require('../controllers/challengeController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Public/optional auth routes
router.get('/', optionalAuth, getAllChallenges);
router.get('/categories', getCategories);
router.get('/stats', getStats);
router.get('/:id', optionalAuth, getChallengeById);

// Protected routes
router.post('/', authenticateToken, createChallenge);
router.post('/:id/join', authenticateToken, joinChallenge);

// User's own challenges
router.get('/my/challenges', authenticateToken, getUserChallenges);

// Challenge management (owner only)
router.put('/:id', authenticateToken, updateChallenge);
router.delete('/:id', authenticateToken, deleteChallenge);
router.post('/:id/submit', authenticateToken, submitChallengeForApproval);

module.exports = router;
