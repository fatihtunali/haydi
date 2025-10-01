const express = require('express');
const router = express.Router();
const {
    getSubmissions,
    createSubmission,
    toggleLike,
    addComment,
    getComments
} = require('../controllers/submissionController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Challenge submissions
router.get('/challenge/:challengeId', optionalAuth, getSubmissions);
router.post('/challenge/:challengeId', authenticateToken, upload.single('media'), createSubmission);

// Like/unlike
router.post('/:id/like', authenticateToken, toggleLike);

// Comments
router.get('/:id/comments', getComments);
router.post('/:id/comments', authenticateToken, addComment);

module.exports = router;
