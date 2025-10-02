const { pool } = require('../config/database');
const { createNotification } = require('../controllers/notificationController');

// Badge kontrolü yap ve kazandır
async function checkAndAwardBadges(userId, triggerType) {
    try {
        // Kullanıcının istatistiklerini al
        const stats = await getUserStats(userId);

        // İlgili badge'leri kontrol et
        const badges = await getEligibleBadges(stats, triggerType);

        // Her badge için kontrol yap
        for (const badge of badges) {
            await awardBadgeIfEligible(userId, badge, stats);
        }

    } catch (error) {
        console.error('Badge kontrol hatası:', error);
        // Hata olsa bile devam et (badge sistemi ana işlevi engellemez)
    }
}

// Kullanıcı istatistiklerini al
async function getUserStats(userId) {
    const stats = {};

    // Tamamlanan challenge sayısı
    const [[challengeStats]] = await pool.query(
        `SELECT COUNT(*) as count FROM participants
         WHERE user_id = ? AND status = 'tamamlandi'`,
        [userId]
    );
    stats.challenge_complete = challengeStats.count;

    // Gönderi sayısı
    const [[submissionStats]] = await pool.query(
        `SELECT COUNT(*) as count FROM submissions WHERE user_id = ?`,
        [userId]
    );
    stats.submission_count = submissionStats.count;

    // Toplam beğeni sayısı
    const [[likeStats]] = await pool.query(
        `SELECT SUM(likes_count) as total FROM submissions WHERE user_id = ?`,
        [userId]
    );
    stats.like_count = likeStats.total || 0;

    // Yorum sayısı
    const [[commentStats]] = await pool.query(
        `SELECT COUNT(*) as count FROM comments WHERE user_id = ?`,
        [userId]
    );
    stats.comment_count = commentStats.count;

    // Oluşturulan takım sayısı
    const [[teamStats]] = await pool.query(
        `SELECT COUNT(*) as count FROM teams WHERE captain_id = ?`,
        [userId]
    );
    stats.team_create = teamStats.count;

    return stats;
}

// Uygun badge'leri getir
async function getEligibleBadges(stats, triggerType) {
    // Eğer trigger type belirtilmişse sadece o tip badge'leri getir
    let query = 'SELECT * FROM badges';
    const params = [];

    if (triggerType) {
        query += ' WHERE type = ?';
        params.push(triggerType);
    }

    const [badges] = await pool.query(query, params);
    return badges;
}

// Badge kazanmaya uygunsa kazandır
async function awardBadgeIfEligible(userId, badge, stats) {
    // Bu badge için gerekli istatistiği kontrol et
    const userValue = stats[badge.type] || 0;

    // Yeterli değere ulaşmış mı?
    if (userValue < badge.condition_value) {
        return; // Henüz yeterli değil
    }

    // Kullanıcı bu badge'i zaten kazanmış mı?
    const [[existing]] = await pool.query(
        'SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?',
        [userId, badge.id]
    );

    if (existing) {
        return; // Zaten kazanılmış
    }

    // Badge'i kazandır!
    await pool.query(
        'INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)',
        [userId, badge.id]
    );

    // Bildirim gönder
    await createNotification(
        userId,
        'badge',
        `${badge.icon} Yeni Rozet!`,
        `"${badge.name}" rozetini kazandınız! ${badge.description}`,
        '/profile'
    );

    console.log(`✨ Badge kazanıldı: ${badge.name} - User: ${userId}`);
}

// Kullanıcının badge'lerini getir
async function getUserBadges(userId) {
    const [badges] = await pool.query(`
        SELECT
            b.*,
            ub.earned_at
        FROM user_badges ub
        JOIN badges b ON ub.badge_id = b.id
        WHERE ub.user_id = ?
        ORDER BY ub.earned_at DESC
    `, [userId]);

    return badges;
}

// Tüm badge'leri getir (kazanılmamış olanlar dahil)
async function getAllBadgesWithUserStatus(userId) {
    const [badges] = await pool.query(`
        SELECT
            b.*,
            ub.earned_at,
            IF(ub.id IS NOT NULL, TRUE, FALSE) as is_earned
        FROM badges b
        LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = ?
        ORDER BY b.rarity DESC, b.condition_value ASC
    `, [userId]);

    return badges;
}

// Badge istatistikleri (kaç kişi kazandı)
async function getBadgeStats(badgeId) {
    const [[stats]] = await pool.query(`
        SELECT
            COUNT(*) as earned_count,
            (SELECT COUNT(*) FROM users) as total_users
        FROM user_badges
        WHERE badge_id = ?
    `, [badgeId]);

    return {
        earned_count: stats.earned_count,
        total_users: stats.total_users,
        percentage: stats.total_users > 0
            ? ((stats.earned_count / stats.total_users) * 100).toFixed(1)
            : 0
    };
}

module.exports = {
    checkAndAwardBadges,
    getUserBadges,
    getAllBadgesWithUserStatus,
    getBadgeStats
};
