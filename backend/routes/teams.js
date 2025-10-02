const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
    getTeams,
    getTeamDetail,
    createTeam,
    joinTeam,
    leaveTeam,
    deleteTeam
} = require('../controllers/teamController');

// Challenge için takımları listele (public)
router.get('/challenge/:challengeId', getTeams);

// Takım detayı (public)
router.get('/:teamId', getTeamDetail);

// Yeni takım oluştur (protected)
router.post('/challenge/:challengeId', authenticateToken, createTeam);

// Takıma katıl (protected)
router.post('/:teamId/join', authenticateToken, joinTeam);

// Takımdan ayrıl (protected)
router.post('/:teamId/leave', authenticateToken, leaveTeam);

// Takımı sil (protected - sadece kaptan)
router.delete('/:teamId', authenticateToken, deleteTeam);

module.exports = router;
