const { pool } = require('../config/database');

// Tüm challenge'ları listele
async function getAllChallenges(req, res) {
    const { status, category, limit = 100, offset = 0 } = req.query;

    try {
        let query = `
            SELECT
                c.*,
                cat.name as category_name,
                cat.slug as category_slug,
                cat.icon as category_icon,
                u.username as creator_username,
                COUNT(DISTINCT p.id) as participant_count
            FROM challenges c
            LEFT JOIN categories cat ON c.category_id = cat.id
            LEFT JOIN users u ON c.creator_id = u.id
            LEFT JOIN participants p ON c.id = p.challenge_id AND p.status = 'aktif'
        `;

        const params = [];
        const conditions = [];

        // Status filtresi (opsiyonel)
        if (status) {
            conditions.push('c.status = ?');
            params.push(status);
        }

        // Kategori filtresi (opsiyonel)
        if (category) {
            conditions.push('cat.slug = ?');
            params.push(category);
        }

        // WHERE clause ekle (eğer koşul varsa)
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' GROUP BY c.id ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [challenges] = await pool.query(query, params);

        res.json({ challenges });

    } catch (error) {
        console.error('Challenge listeleme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

// Tek challenge detayı
async function getChallengeById(req, res) {
    const { id } = req.params;

    try {
        const [challenges] = await pool.query(`
            SELECT
                c.*,
                cat.name as category_name,
                cat.slug as category_slug,
                cat.icon as category_icon,
                u.username as creator_username,
                u.avatar_url as creator_avatar,
                COUNT(DISTINCT p.id) as participant_count
            FROM challenges c
            LEFT JOIN categories cat ON c.category_id = cat.id
            LEFT JOIN users u ON c.creator_id = u.id
            LEFT JOIN participants p ON c.id = p.challenge_id AND p.status = 'aktif'
            WHERE c.id = ?
            GROUP BY c.id
        `, [id]);

        if (challenges.length === 0) {
            return res.status(404).json({ error: 'Challenge bulunamadı' });
        }

        // Katılımcıyı kontrol et (eğer kullanıcı giriş yapmışsa)
        let isParticipant = false;
        if (req.user) {
            const [participation] = await pool.query(
                'SELECT id FROM participants WHERE challenge_id = ? AND user_id = ? AND status = ?',
                [id, req.user.id, 'aktif']
            );
            isParticipant = participation.length > 0;
        }

        res.json({
            challenge: challenges[0],
            isParticipant
        });

    } catch (error) {
        console.error('Challenge detay hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

// Yeni challenge oluştur
async function createChallenge(req, res) {
    const {
        title,
        description,
        category_id,
        difficulty,
        points,
        start_date,
        end_date,
        max_participants,
        rules,
        prize_description,
        is_team_based,
        min_team_size,
        max_team_size
    } = req.body;

    if (!title || !description || !start_date || !end_date) {
        return res.status(400).json({ error: 'Gerekli alanlar eksik' });
    }

    try {
        const [result] = await pool.query(`
            INSERT INTO challenges (
                title, description, category_id, creator_id, difficulty,
                points, start_date, end_date, max_participants, rules,
                prize_description, is_team_based, min_team_size, max_team_size,
                status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'aktif')
        `, [
            title,
            description,
            category_id || null,
            req.user.id,
            difficulty || 'orta',
            points || 100,
            start_date,
            end_date,
            max_participants || null,
            rules || null,
            prize_description || null,
            is_team_based || false,
            min_team_size || 1,
            max_team_size || 1
        ]);

        res.status(201).json({
            message: 'Challenge oluşturuldu',
            challenge_id: result.insertId
        });

    } catch (error) {
        console.error('Challenge oluşturma hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

// Challenge'a katıl
async function joinChallenge(req, res) {
    const { id } = req.params;

    try {
        // Challenge'ı kontrol et
        const [challenges] = await pool.query(
            'SELECT * FROM challenges WHERE id = ? AND status = ?',
            [id, 'aktif']
        );

        if (challenges.length === 0) {
            return res.status(404).json({ error: 'Challenge bulunamadı veya aktif değil' });
        }

        const challenge = challenges[0];

        // Max katılımcı kontrolü
        if (challenge.max_participants) {
            const [count] = await pool.query(
                'SELECT COUNT(*) as count FROM participants WHERE challenge_id = ? AND status = ?',
                [id, 'aktif']
            );

            if (count[0].count >= challenge.max_participants) {
                return res.status(400).json({ error: 'Challenge dolu' });
            }
        }

        // Zaten katılmış mı kontrol et
        const [existing] = await pool.query(
            'SELECT id FROM participants WHERE challenge_id = ? AND user_id = ?',
            [id, req.user.id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Zaten bu challenge\'a katıldınız' });
        }

        // Katılımcı ekle
        await pool.query(
            'INSERT INTO participants (challenge_id, user_id, status) VALUES (?, ?, ?)',
            [id, req.user.id, 'aktif']
        );

        res.json({ message: 'Challenge\'a başarıyla katıldınız' });

    } catch (error) {
        console.error('Challenge katılım hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

// Kategorileri listele
async function getCategories(req, res) {
    try {
        const [categories] = await pool.query('SELECT * FROM categories ORDER BY name');
        res.json({ categories });
    } catch (error) {
        console.error('Kategori listeleme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

// Genel istatistikleri getir
async function getStats(req, res) {
    try {
        const [[stats]] = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM challenges WHERE status = 'aktif') as active_challenges,
                (SELECT COUNT(*) FROM submissions) as total_submissions,
                (SELECT COALESCE(SUM(points), 0) FROM users) as total_points_distributed
        `);

        res.json({ stats });
    } catch (error) {
        console.error('İstatistik yükleme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

module.exports = {
    getAllChallenges,
    getChallengeById,
    createChallenge,
    joinChallenge,
    getCategories,
    getStats
};
