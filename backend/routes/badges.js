const express = require('express');
const router = express.Router();
const { getMyBadges, getAllBadges, getBadgeStatistics } = require('../controllers/badgeController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// Kullanıcının badge'leri (protected)
router.get('/my', authenticateToken, getMyBadges);

// Tüm badge'ler (optional auth - giriş yapmadan da görülebilir)
router.get('/all', optionalAuth, getAllBadges);

// Badge istatistikleri
router.get('/:id/stats', getBadgeStatistics);

module.exports = router;
