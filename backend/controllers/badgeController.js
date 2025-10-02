const { getUserBadges, getAllBadgesWithUserStatus, getBadgeStats } = require('../services/badgeService');

// Kullanıcının badge'lerini getir
async function getMyBadges(req, res) {
    try {
        const badges = await getUserBadges(req.user.id);

        res.json({ badges });

    } catch (error) {
        console.error('Badge getirme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

// Tüm badge'leri getir (kazanılma durumu ile)
async function getAllBadges(req, res) {
    try {
        const userId = req.user ? req.user.id : null;
        const badges = await getAllBadgesWithUserStatus(userId);

        res.json({ badges });

    } catch (error) {
        console.error('Tüm badge\'leri getirme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

// Badge istatistikleri
async function getBadgeStatistics(req, res) {
    try {
        const { id } = req.params;
        const stats = await getBadgeStats(id);

        res.json(stats);

    } catch (error) {
        console.error('Badge istatistik hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

module.exports = {
    getMyBadges,
    getAllBadges,
    getBadgeStatistics
};
