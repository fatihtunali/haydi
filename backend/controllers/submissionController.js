const { pool } = require('../config/database');

// Challenge için submission'ları listele
async function getSubmissions(req, res) {
    const { challengeId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    try {
        const [submissions] = await pool.query(`
            SELECT
                s.*,
                u.username,
                u.avatar_url,
                s.likes_count,
                COUNT(DISTINCT c.id) as comments_count
            FROM submissions s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN comments c ON s.id = c.submission_id
            WHERE s.challenge_id = ? AND s.status = 'onaylandi'
            GROUP BY s.id
            ORDER BY s.created_at DESC
            LIMIT ? OFFSET ?
        `, [challengeId, parseInt(limit), parseInt(offset)]);

        // Eğer kullanıcı giriş yapmışsa beğenilerini kontrol et
        if (req.user) {
            const submissionIds = submissions.map(s => s.id);
            if (submissionIds.length > 0) {
                const [likes] = await pool.query(`
                    SELECT submission_id
                    FROM likes
                    WHERE user_id = ? AND submission_id IN (?)
                `, [req.user.id, submissionIds]);

                const likedIds = new Set(likes.map(l => l.submission_id));
                submissions.forEach(s => {
                    s.is_liked_by_user = likedIds.has(s.id);
                });
            }
        }

        res.json({ submissions });

    } catch (error) {
        console.error('Submission listeleme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

// Yeni submission oluştur
async function createSubmission(req, res) {
    const { challengeId } = req.params;
    const { content, media_type } = req.body;
    const media_url = req.file ? `/uploads/${req.file.filename}` : null;

    if (!content && !media_url) {
        return res.status(400).json({ error: 'İçerik veya medya gerekli' });
    }

    try {
        // Kullanıcının challenge'a katıldığını kontrol et
        const [participation] = await pool.query(
            'SELECT id FROM participants WHERE challenge_id = ? AND user_id = ? AND status = ?',
            [challengeId, req.user.id, 'aktif']
        );

        if (participation.length === 0) {
            return res.status(403).json({ error: 'Bu challenge\'a katılmadınız' });
        }

        // Submission ekle
        const [result] = await pool.query(`
            INSERT INTO submissions (challenge_id, user_id, content, media_url, media_type, status)
            VALUES (?, ?, ?, ?, ?, 'beklemede')
        `, [challengeId, req.user.id, content || null, media_url, media_type || 'metin']);

        res.status(201).json({
            message: 'Gönderiniz başarıyla oluşturuldu ve onay bekliyor',
            submission_id: result.insertId
        });

    } catch (error) {
        console.error('Submission oluşturma hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

// Submission'ı beğen/beğenmekten vazgeç
async function toggleLike(req, res) {
    const { id } = req.params;

    try {
        // Beğeni var mı kontrol et
        const [existing] = await pool.query(
            'SELECT id FROM likes WHERE submission_id = ? AND user_id = ?',
            [id, req.user.id]
        );

        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            if (existing.length > 0) {
                // Beğeniyi kaldır
                await connection.query(
                    'DELETE FROM likes WHERE submission_id = ? AND user_id = ?',
                    [id, req.user.id]
                );

                await connection.query(
                    'UPDATE submissions SET likes_count = likes_count - 1 WHERE id = ?',
                    [id]
                );

                await connection.commit();
                res.json({ message: 'Beğeni kaldırıldı', liked: false });

            } else {
                // Beğeni ekle
                await connection.query(
                    'INSERT INTO likes (submission_id, user_id) VALUES (?, ?)',
                    [id, req.user.id]
                );

                await connection.query(
                    'UPDATE submissions SET likes_count = likes_count + 1 WHERE id = ?',
                    [id]
                );

                await connection.commit();
                res.json({ message: 'Beğenildi', liked: true });
            }

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Beğeni hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

// Yorum ekle
async function addComment(req, res) {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: 'Yorum içeriği gerekli' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO comments (submission_id, user_id, content) VALUES (?, ?, ?)',
            [id, req.user.id, content.trim()]
        );

        const [comment] = await pool.query(`
            SELECT c.*, u.username, u.avatar_url
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = ?
        `, [result.insertId]);

        res.status(201).json({
            message: 'Yorum eklendi',
            comment: comment[0]
        });

    } catch (error) {
        console.error('Yorum ekleme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

// Submission yorumlarını getir
async function getComments(req, res) {
    const { id } = req.params;

    try {
        const [comments] = await pool.query(`
            SELECT c.*, u.username, u.avatar_url
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.submission_id = ?
            ORDER BY c.created_at DESC
        `, [id]);

        res.json({ comments });

    } catch (error) {
        console.error('Yorum listeleme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

module.exports = {
    getSubmissions,
    createSubmission,
    toggleLike,
    addComment,
    getComments
};
