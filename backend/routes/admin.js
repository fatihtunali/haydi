const express = require('express');
const router = express.Router();
const {
    getDashboard,
    getAllSubmissions,
    approveSubmission,
    rejectSubmission,
    deleteSubmission,
    getAllUsers,
    updateUser,
    deleteUser,
    getAllChallengesAdmin,
    getChallengeDetail,
    getCategories,
    updateChallenge,
    deleteChallenge,
    getPendingChallenges,
    approveChallenge,
    rejectChallenge
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
router.delete('/submissions/:id', deleteSubmission);

// Kullanıcı yönetimi
router.get('/users', getAllUsers);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Challenge yönetimi
router.get('/challenges', getAllChallengesAdmin);
router.get('/challenges/pending', getPendingChallenges);
router.get('/challenges/:id', getChallengeDetail);
router.get('/categories', getCategories);
router.patch('/challenges/:id', updateChallenge);
router.delete('/challenges/:id', deleteChallenge);
router.post('/challenges/:id/approve', approveChallenge);
router.post('/challenges/:id/reject', rejectChallenge);

module.exports = router;
