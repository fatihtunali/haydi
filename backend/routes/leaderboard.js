const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
    getGlobalLeaderboard,
    getChallengeLeaderboard,
    getTeamLeaderboard,
    getUserRank
} = require('../controllers/leaderboardController');

// Global leaderboard
router.get('/global', getGlobalLeaderboard);

// Challenge leaderboard
router.get('/challenge/:challengeId', getChallengeLeaderboard);

// Team leaderboard
router.get('/teams/:challengeId', getTeamLeaderboard);

// Kullanıcının kendi sırası (login gerekli)
router.get('/my-rank', authenticateToken, getUserRank);

module.exports = router;
