const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { sendTestEmail, sendChallengeStartReminder, sendWeeklySummary } = require('../services/emailService');
const { pool } = require('../config/database');

// Email log listesi (admin)
router.get('/logs', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { limit = 100, offset = 0, status, type } = req.query;

        let query = `
            SELECT
                el.*,
                u.username,
                u.full_name
            FROM email_logs el
            LEFT JOIN users u ON el.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            query += ` AND el.status = ?`;
            params.push(status);
        }

        if (type) {
            query += ` AND el.type = ?`;
            params.push(type);
        }

        query += ` ORDER BY el.created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));

        const [logs] = await pool.query(query, params);

        // Total count
        let countQuery = 'SELECT COUNT(*) as total FROM email_logs WHERE 1=1';
        const countParams = [];

        if (status) {
            countQuery += ` AND status = ?`;
            countParams.push(status);
        }

        if (type) {
            countQuery += ` AND type = ?`;
            countParams.push(type);
        }

        const [[{ total }]] = await pool.query(countQuery, countParams);

        // Stats
        const [[stats]] = await pool.query(`
            SELECT
                COUNT(*) as total_emails,
                SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
                SUM(CASE WHEN type = 'challenge_reminder' THEN 1 ELSE 0 END) as challenge_reminders,
                SUM(CASE WHEN type = 'weekly_summary' THEN 1 ELSE 0 END) as weekly_summaries,
                SUM(CASE WHEN type = 'test' THEN 1 ELSE 0 END) as test_emails
            FROM email_logs
        `);

        res.json({ logs, total, stats });

    } catch (error) {
        console.error('Email log hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Test email gönder (sadece admin) - Herhangi bir adrese gönderilebilir
router.post('/test', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { email } = req.body;
        const targetEmail = email || req.user.email;

        // Email sahibi kullanıcıyı bul (opsiyonel - log için)
        let userId = null;
        const [[user]] = await pool.query('SELECT id FROM users WHERE email = ?', [targetEmail]);
        if (user) {
            userId = user.id;
        }

        const result = await sendTestEmail(targetEmail, userId);

        if (result.success) {
            res.json({
                message: `Test email başarıyla gönderildi: ${targetEmail}`,
                messageId: result.messageId,
                recipient: targetEmail
            });
        } else {
            res.status(500).json({ error: 'Email gönderilemedi', details: result.error });
        }
    } catch (error) {
        console.error('Test email hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Challenge hatırlatması gönder (manuel test için)
router.post('/test-challenge-reminder/:challengeId', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { challengeId } = req.params;

        // Challenge bilgilerini al
        const [[challenge]] = await pool.query(`
            SELECT c.*, cat.name as category_name
            FROM challenges c
            LEFT JOIN categories cat ON c.category_id = cat.id
            WHERE c.id = ?
        `, [challengeId]);

        if (!challenge) {
            return res.status(404).json({ error: 'Meydan okuma bulunamadı' });
        }

        // Challenge'a katılmış kullanıcıları al
        const [participants] = await pool.query(`
            SELECT u.id, u.email, u.username, u.full_name
            FROM participants p
            JOIN users u ON p.user_id = u.id
            WHERE p.challenge_id = ? AND u.email IS NOT NULL
        `, [challengeId]);

        const results = [];
        for (const user of participants) {
            const result = await sendChallengeStartReminder(user, challenge);
            results.push({ user: user.email, success: result.success });
        }

        res.json({
            message: `${participants.length} kullanıcıya email gönderildi`,
            results
        });

    } catch (error) {
        console.error('Challenge hatırlatma hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// Haftalık özet gönder (manuel test için)
router.post('/test-weekly-summary', authenticateToken, isAdmin, async (req, res) => {
    try {
        const userId = req.user.id;

        // Kullanıcı bilgilerini al
        const [[user]] = await pool.query(
            'SELECT id, email, username, full_name FROM users WHERE id = ?',
            [userId]
        );

        // Haftalık istatistikleri hesapla
        const [[pointsData]] = await pool.query(`
            SELECT COALESCE(SUM(points_awarded), 0) as points
            FROM submissions
            WHERE user_id = ?
                AND status = 'onaylandi'
                AND reviewed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `, [userId]);

        const [[submissionsData]] = await pool.query(`
            SELECT COUNT(*) as count
            FROM submissions
            WHERE user_id = ?
                AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `, [userId]);

        const [[activeChallengesData]] = await pool.query(`
            SELECT COUNT(*) as count
            FROM participants
            WHERE user_id = ?
                AND status = 'aktif'
        `, [userId]);

        const [[rankData]] = await pool.query(`
            SELECT COUNT(*) + 1 as \`rank\`
            FROM (
                SELECT u.id, COALESCE(SUM(s.points_awarded), 0) as points
                FROM users u
                LEFT JOIN submissions s ON u.id = s.user_id
                    AND s.status = 'onaylandi'
                    AND s.reviewed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                GROUP BY u.id
            ) as rankings
            WHERE points > (
                SELECT COALESCE(SUM(points_awarded), 0)
                FROM submissions
                WHERE user_id = ?
                    AND status = 'onaylandi'
                    AND reviewed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            )
        `, [userId]);

        const [[followersData]] = await pool.query(`
            SELECT COUNT(*) as count
            FROM follows
            WHERE following_id = ?
                AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `, [userId]);

        const stats = {
            points: pointsData.points,
            submissions: submissionsData.count,
            activeChallenges: activeChallengesData.count,
            rank: rankData.rank,
            newFollowers: followersData.count
        };

        const result = await sendWeeklySummary(user, stats);

        if (result.success) {
            res.json({
                message: 'Haftalık özet gönderildi',
                messageId: result.messageId,
                stats
            });
        } else {
            res.status(500).json({ error: 'Email gönderilemedi', details: result.error });
        }

    } catch (error) {
        console.error('Haftalık özet hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

module.exports = router;
