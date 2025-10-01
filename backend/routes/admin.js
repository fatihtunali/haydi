const express = require('express');
const router = express.Router();
const {
    getDashboard,
    getAllSubmissions,
    approveSubmission,
    rejectSubmission,
    getAllUsers,
    updateUser,
    getAllChallengesAdmin,
    updateChallenge,
    deleteChallenge
} = require('../controllers/adminController');
const { isAdmin } = require('../middleware/auth');

// Tüm route'lar admin yetkisi gerektiriyor
router.use(isAdmin);

// Dashboard
router.get('/dashboard', getDashboard);

// Submission yönetimi
router.get('/submissions', getAllSubmissions);
router.post('/submissions/:id/approve', approveSubmission);
router.post('/submissions/:id/reject', rejectSubmission);

// Kullanıcı yönetimi
router.get('/users', getAllUsers);
router.patch('/users/:id', updateUser);

// Challenge yönetimi
router.get('/challenges', getAllChallengesAdmin);
router.patch('/challenges/:id', updateChallenge);
router.delete('/challenges/:id', deleteChallenge);

module.exports = router;
