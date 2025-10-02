const express = require('express');
const router = express.Router();
const {
    getSubmissions,
    createSubmission,
    toggleLike,
    addComment,
    getComments,
    deleteSubmission,
    getFeed,
    getFollowingFeed
} = require('../controllers/submissionController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Feed - Popüler gönderiler
console.log('📍 Registering /feed route');
router.get('/feed', optionalAuth, getFeed);

// Following Feed - Takip edilenlerin gönderileri
router.get('/following-feed', authenticateToken, getFollowingFeed);

// Challenge submissions
router.get('/challenge/:challengeId', optionalAuth, getSubmissions);
router.post('/challenge/:challengeId', authenticateToken, upload.single('file'), createSubmission);

// Submission management
router.delete('/:id', authenticateToken, deleteSubmission);

// Like/unlike
router.post('/:id/like', authenticateToken, toggleLike);

// Comments
router.get('/:id/comments', getComments);
router.post('/:id/comments', authenticateToken, addComment);

module.exports = router;
