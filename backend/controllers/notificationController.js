const { pool } = require('../config/database');

// Bildirim oluşturma helper fonksiyonu
async function createNotification(userId, type, title, message, link = null) {
    try {
        await pool.query(
            `INSERT INTO notifications (user_id, type, title, message, link)
             VALUES (?, ?, ?, ?, ?)`,
            [userId, type, title, message, link]
        );
    } catch (error) {
        console.error('Bildirim oluşturma hatası:', error);
    }
}

// Kullanıcının bildirimlerini getir
async function getNotifications(req, res) {
    try {
        const { limit = 20, offset = 0 } = req.query;

        const [notifications] = await pool.query(
            `SELECT * FROM notifications
             WHERE user_id = ?
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?`,
            [req.user.id, parseInt(limit), parseInt(offset)]
        );

        res.json({ notifications });

    } catch (error) {
        console.error('Bildirimler getirme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

// Okunmamış bildirim sayısı
async function getUnreadCount(req, res) {
    try {
        const [[{ count }]] = await pool.query(
            `SELECT COUNT(*) as count FROM notifications
             WHERE user_id = ? AND is_read = FALSE`,
            [req.user.id]
        );

        res.json({ count });

    } catch (error) {
        console.error('Okunmamış bildirim sayısı hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

// Bildirimi okundu işaretle
async function markAsRead(req, res) {
    try {
        const { id } = req.params;

        await pool.query(
            `UPDATE notifications SET is_read = TRUE
             WHERE id = ? AND user_id = ?`,
            [id, req.user.id]
        );

        res.json({ message: 'Bildirim okundu olarak işaretlendi' });

    } catch (error) {
        console.error('Bildirim güncelleme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

// Tüm bildirimleri okundu işaretle
async function markAllAsRead(req, res) {
    try {
        await pool.query(
            `UPDATE notifications SET is_read = TRUE
             WHERE user_id = ? AND is_read = FALSE`,
            [req.user.id]
        );

        res.json({ message: 'Tüm bildirimler okundu olarak işaretlendi' });

    } catch (error) {
        console.error('Tüm bildirimleri güncelleme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

// Bildirimi sil
async function deleteNotification(req, res) {
    try {
        const { id } = req.params;

        await pool.query(
            `DELETE FROM notifications
             WHERE id = ? AND user_id = ?`,
            [id, req.user.id]
        );

        res.json({ message: 'Bildirim silindi' });

    } catch (error) {
        console.error('Bildirim silme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

module.exports = {
    createNotification,
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
};
