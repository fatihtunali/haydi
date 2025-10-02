const express = require('express');
const router = express.Router();
const {
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    getFollowStats
} = require('../controllers/followController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Takip et/bırak (protected)
router.post('/users/:id/follow', authenticateToken, followUser);
router.delete('/users/:id/unfollow', authenticateToken, unfollowUser);

// Takipçi/takip edilen listesi (optional auth)
router.get('/users/:id/followers', optionalAuth, getFollowers);
router.get('/users/:id/following', optionalAuth, getFollowing);

// Takip istatistikleri (optional auth)
router.get('/users/:id/stats', optionalAuth, getFollowStats);

module.exports = router;
