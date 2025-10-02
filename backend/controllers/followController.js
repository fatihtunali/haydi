const { pool } = require('../config/database');
const { createNotification } = require('./notificationController');

// Kullanıcıyı takip et
async function followUser(req, res) {
    const { id } = req.params; // Takip edilecek kullanıcı ID'si
    const followerId = req.user.id; // Takip eden kullanıcı

    try {
        // Kendini takip edemez
        if (parseInt(id) === followerId) {
            return res.status(400).json({ error: 'Kendinizi takip edemezsiniz' });
        }

        // Takip edilecek kullanıcı var mı?
        const [[targetUser]] = await pool.query(
            'SELECT id, username FROM users WHERE id = ?',
            [id]
        );

        if (!targetUser) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        }

        // Zaten takip ediyor mu?
        const [[existing]] = await pool.query(
            'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
            [followerId, id]
        );

        if (existing) {
            return res.status(400).json({ error: 'Zaten takip ediyorsunuz' });
        }

        // Takip et
        await pool.query(
            'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)',
            [followerId, id]
        );

        // Bildirim gönder
        await createNotification(
            id,
            'follow',
            '👤 Yeni Takipçi',
            `${req.user.username} sizi takip etmeye başladı`,
            `/profile?user=${req.user.username}`
        );

        res.json({ message: 'Kullanıcı takip edildi' });

    } catch (error) {
        console.error('Takip etme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

// Takibi bırak
async function unfollowUser(req, res) {
    const { id } = req.params;
    const followerId = req.user.id;

    try {
        const [result] = await pool.query(
            'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
            [followerId, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Bu kullanıcıyı takip etmiyorsunuz' });
        }

        res.json({ message: 'Takip bırakıldı' });

    } catch (error) {
        console.error('Takip bırakma hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

// Takipçi listesi
async function getFollowers(req, res) {
    const { id } = req.params;
    const { limit = 50, offset = 0, search = '' } = req.query;

    try {
        let query = `
            SELECT
                u.id,
                u.username,
                u.full_name,
                u.avatar_url,
                u.points,
                f.created_at as followed_at
            FROM follows f
            JOIN users u ON f.follower_id = u.id
            WHERE f.following_id = ?
        `;

        const params = [id];

        // Add search filter
        if (search.trim()) {
            query += ` AND (u.username LIKE ? OR u.full_name LIKE ?)`;
            const searchPattern = `%${search.trim()}%`;
            params.push(searchPattern, searchPattern);
        }

        query += `
            ORDER BY f.created_at DESC
            LIMIT ? OFFSET ?
        `;

        params.push(parseInt(limit), parseInt(offset));

        const [followers] = await pool.query(query, params);

        // Toplam sayı
        const [[{ total }]] = await pool.query(
            'SELECT COUNT(*) as total FROM follows WHERE following_id = ?',
            [id]
        );

        // Eğer giriş yapmışsa, bu kullanıcıları takip ediyor mu kontrol et
        if (req.user) {
            const followerIds = followers.map(f => f.id);
            if (followerIds.length > 0) {
                const [following] = await pool.query(
                    'SELECT following_id FROM follows WHERE follower_id = ? AND following_id IN (?)',
                    [req.user.id, followerIds]
                );
                const followingIds = new Set(following.map(f => f.following_id));
                followers.forEach(f => {
                    f.is_following = followingIds.has(f.id);
                });
            }
        }

        res.json({ followers, total });

    } catch (error) {
        console.error('Takipçi listeleme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

// Takip edilen listesi
async function getFollowing(req, res) {
    const { id } = req.params;
    const { limit = 50, offset = 0, search = '' } = req.query;

    try {
        let query = `
            SELECT
                u.id,
                u.username,
                u.full_name,
                u.avatar_url,
                u.points,
                f.created_at as followed_at
            FROM follows f
            JOIN users u ON f.following_id = u.id
            WHERE f.follower_id = ?
        `;

        const params = [id];

        // Add search filter
        if (search.trim()) {
            query += ` AND (u.username LIKE ? OR u.full_name LIKE ?)`;
            const searchPattern = `%${search.trim()}%`;
            params.push(searchPattern, searchPattern);
        }

        query += `
            ORDER BY f.created_at DESC
            LIMIT ? OFFSET ?
        `;

        params.push(parseInt(limit), parseInt(offset));

        const [following] = await pool.query(query, params);

        // Toplam sayı
        const [[{ total }]] = await pool.query(
            'SELECT COUNT(*) as total FROM follows WHERE follower_id = ?',
            [id]
        );

        // Eğer giriş yapmışsa, bu kullanıcıları takip ediyor mu kontrol et
        if (req.user) {
            const followingIds = following.map(f => f.id);
            if (followingIds.length > 0) {
                const [alsoFollowing] = await pool.query(
                    'SELECT following_id FROM follows WHERE follower_id = ? AND following_id IN (?)',
                    [req.user.id, followingIds]
                );
                const alsoFollowingIds = new Set(alsoFollowing.map(f => f.following_id));
                following.forEach(f => {
                    f.is_following = alsoFollowingIds.has(f.id);
                });
            }
        }

        res.json({ following, total });

    } catch (error) {
        console.error('Takip edilen listeleme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

// Takipçi/takip edilen sayıları ve takip durumu
async function getFollowStats(req, res) {
    const { id } = req.params;

    try {
        // Takipçi sayısı
        const [[{ follower_count }]] = await pool.query(
            'SELECT COUNT(*) as follower_count FROM follows WHERE following_id = ?',
            [id]
        );

        // Takip edilen sayısı
        const [[{ following_count }]] = await pool.query(
            'SELECT COUNT(*) as following_count FROM follows WHERE follower_id = ?',
            [id]
        );

        // Eğer giriş yapmışsa, bu kullanıcıyı takip ediyor mu?
        let is_following = false;
        let is_follower = false;

        if (req.user && req.user.id !== parseInt(id)) {
            const [[followCheck]] = await pool.query(
                'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
                [req.user.id, id]
            );
            is_following = !!followCheck;

            const [[followerCheck]] = await pool.query(
                'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
                [id, req.user.id]
            );
            is_follower = !!followerCheck;
        }

        res.json({
            follower_count,
            following_count,
            is_following,
            is_follower
        });

    } catch (error) {
        console.error('Takip istatistik hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

module.exports = {
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    getFollowStats
};
