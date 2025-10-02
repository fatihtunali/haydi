const { pool } = require('../config/database');

// Global leaderboard (tüm kullanıcılar)
async function getGlobalLeaderboard(req, res) {
    const { period = 'all', limit = 50 } = req.query;

    try {
        let query;
        let params = [];

        if (period === 'weekly') {
            // Son 7 gün içinde kazanılan puanlar
            query = `
                SELECT
                    u.id,
                    u.username,
                    u.avatar_url,
                    COALESCE(SUM(s.points_awarded), 0) as points,
                    COUNT(DISTINCT s.challenge_id) as challenges_completed,
                    COUNT(DISTINCT s.id) as total_submissions
                FROM users u
                LEFT JOIN submissions s ON u.id = s.user_id
                    AND s.status = 'onaylandi'
                    AND s.reviewed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                GROUP BY u.id
                HAVING points > 0
                ORDER BY points DESC
                LIMIT ?
            `;
            params = [parseInt(limit)];
        } else if (period === 'monthly') {
            // Son 30 gün içinde kazanılan puanlar
            query = `
                SELECT
                    u.id,
                    u.username,
                    u.avatar_url,
                    COALESCE(SUM(s.points_awarded), 0) as points,
                    COUNT(DISTINCT s.challenge_id) as challenges_completed,
                    COUNT(DISTINCT s.id) as total_submissions
                FROM users u
                LEFT JOIN submissions s ON u.id = s.user_id
                    AND s.status = 'onaylandi'
                    AND s.reviewed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY u.id
                HAVING points > 0
                ORDER BY points DESC
                LIMIT ?
            `;
            params = [parseInt(limit)];
        } else {
            // Tüm zamanlar (toplam puan)
            query = `
                SELECT
                    u.id,
                    u.username,
                    u.avatar_url,
                    u.points,
                    COUNT(DISTINCT p.challenge_id) as challenges_completed,
                    (SELECT COUNT(*) FROM submissions WHERE user_id = u.id AND status = 'onaylandi') as total_submissions
                FROM users u
                LEFT JOIN participants p ON u.id = p.user_id AND p.status = 'aktif'
                GROUP BY u.id
                HAVING u.points > 0
                ORDER BY u.points DESC
                LIMIT ?
            `;
            params = [parseInt(limit)];
        }

        const [leaderboard] = await pool.query(query, params);

        // Sıralama numarası ekle
        const rankedLeaderboard = leaderboard.map((user, index) => ({
            ...user,
            rank: index + 1
        }));

        res.json({
            leaderboard: rankedLeaderboard,
            period,
            total: rankedLeaderboard.length
        });

    } catch (error) {
        console.error('Global leaderboard hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

// Challenge bazında leaderboard
async function getChallengeLeaderboard(req, res) {
    const { challengeId } = req.params;
    const { limit = 50 } = req.query;

    try {
        // Challenge var mı kontrol et
        const [[challenge]] = await pool.query(
            'SELECT id, title, is_team_based FROM challenges WHERE id = ?',
            [challengeId]
        );

        if (!challenge) {
            return res.status(404).json({ error: 'Challenge bulunamadı' });
        }

        const [leaderboard] = await pool.query(`
            SELECT
                u.id,
                u.username,
                u.avatar_url,
                p.points_earned as points,
                p.team_id,
                COUNT(s.id) as total_submissions,
                p.joined_at
            FROM participants p
            JOIN users u ON p.user_id = u.id
            LEFT JOIN submissions s ON s.challenge_id = p.challenge_id
                AND s.user_id = p.user_id
                AND s.status = 'onaylandi'
            WHERE p.challenge_id = ? AND p.status = 'aktif'
            GROUP BY p.id
            ORDER BY p.points_earned DESC
            LIMIT ?
        `, [challengeId, parseInt(limit)]);

        // Sıralama numarası ekle
        const rankedLeaderboard = leaderboard.map((user, index) => ({
            ...user,
            rank: index + 1
        }));

        res.json({
            leaderboard: rankedLeaderboard,
            challenge: {
                id: challenge.id,
                title: challenge.title,
                is_team_based: challenge.is_team_based
            },
            total: rankedLeaderboard.length
        });

    } catch (error) {
        console.error('Challenge leaderboard hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

// Takım leaderboard
async function getTeamLeaderboard(req, res) {
    const { challengeId } = req.params;
    const { limit = 50 } = req.query;

    try {
        // Challenge'ın takım challenge'ı olduğunu kontrol et
        const [[challenge]] = await pool.query(
            'SELECT id, title, is_team_based FROM challenges WHERE id = ? AND is_team_based = 1',
            [challengeId]
        );

        if (!challenge) {
            return res.status(404).json({ error: 'Takım challenge\'ı bulunamadı' });
        }

        const [leaderboard] = await pool.query(`
            SELECT
                t.id,
                t.name as team_name,
                t.total_points as points,
                u.username as captain_username,
                u.avatar_url as captain_avatar,
                COUNT(DISTINCT p.user_id) as member_count,
                COUNT(DISTINCT s.id) as total_submissions
            FROM teams t
            JOIN users u ON t.captain_id = u.id
            LEFT JOIN participants p ON t.id = p.team_id AND p.status = 'aktif'
            LEFT JOIN submissions s ON s.challenge_id = t.challenge_id
                AND s.user_id = p.user_id
                AND s.status = 'onaylandi'
            WHERE t.challenge_id = ?
            GROUP BY t.id
            ORDER BY t.total_points DESC
            LIMIT ?
        `, [challengeId, parseInt(limit)]);

        // Sıralama numarası ekle
        const rankedLeaderboard = leaderboard.map((team, index) => ({
            ...team,
            rank: index + 1
        }));

        res.json({
            leaderboard: rankedLeaderboard,
            challenge: {
                id: challenge.id,
                title: challenge.title
            },
            total: rankedLeaderboard.length
        });

    } catch (error) {
        console.error('Team leaderboard hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

// Kullanıcının kendi sırasını bul
async function getUserRank(req, res) {
    const { period = 'all' } = req.query;
    const userId = req.user.id;

    try {
        let query;
        let params = [userId];

        if (period === 'weekly') {
            query = `
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
            `;
        } else if (period === 'monthly') {
            query = `
                SELECT COUNT(*) + 1 as \`rank\`
                FROM (
                    SELECT u.id, COALESCE(SUM(s.points_awarded), 0) as points
                    FROM users u
                    LEFT JOIN submissions s ON u.id = s.user_id
                        AND s.status = 'onaylandi'
                        AND s.reviewed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                    GROUP BY u.id
                ) as rankings
                WHERE points > (
                    SELECT COALESCE(SUM(points_awarded), 0)
                    FROM submissions
                    WHERE user_id = ?
                        AND status = 'onaylandi'
                        AND reviewed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                )
            `;
        } else {
            query = `
                SELECT COUNT(*) + 1 as \`rank\`
                FROM users
                WHERE points > (SELECT points FROM users WHERE id = ?)
            `;
        }

        const [[result]] = await pool.query(query, params);
        const [[user]] = await pool.query(
            'SELECT username, avatar_url, points FROM users WHERE id = ?',
            [userId]
        );

        res.json({
            rank: result.rank,
            user: user
        });

    } catch (error) {
        console.error('User rank hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

module.exports = {
    getGlobalLeaderboard,
    getChallengeLeaderboard,
    getTeamLeaderboard,
    getUserRank
};
