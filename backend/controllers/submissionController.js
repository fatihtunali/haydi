const { pool } = require('../config/database');
const { moderateSubmission, calculatePoints } = require('../services/aiModeration');

// Challenge için submission'ları listele
async function getSubmissions(req, res) {
    const { challengeId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    try {
        const [submissions] = await pool.query(`
            SELECT
                s.id,
                s.challenge_id,
                s.user_id,
                s.content,
                s.location,
                s.media_url,
                s.media_type,
                s.likes_count,
                s.created_at,
                u.username,
                u.avatar_url,
                u.full_name,
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
    const { content, media_type, location } = req.body;

    console.log('Submission request:', {
        challengeId,
        content,
        location,
        hasFile: !!req.file,
        file: req.file
    });

    // Cloudinary'den gelen URL'i kullan
    const media_url = req.file ? req.file.path : null;

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

        // Challenge bilgilerini al (puanlama ve kural kontrolü için)
        const [challenges] = await pool.query(
            'SELECT title, rules, points, difficulty FROM challenges WHERE id = ?',
            [challengeId]
        );

        if (challenges.length === 0) {
            return res.status(404).json({ error: 'Challenge bulunamadı' });
        }

        const challenge = challenges[0];

        // Media type'ı belirle
        let finalMediaType = media_type;
        if (!finalMediaType && req.file) {
            finalMediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'resim';
        }

        // 🤖 AI MODERATION - İçeriği kontrol et
        const moderationResult = await moderateSubmission(
            content,
            media_url,
            challenge.rules
        );

        let submissionStatus = 'beklemede';
        let pointsAwarded = 0;

        if (moderationResult.approved === false) {
            // ❌ Reddedildi
            submissionStatus = 'reddedildi';
            console.log('❌ Submission reddedildi:', moderationResult.reason);
        } else if (moderationResult.approved === true) {
            // ✅ Onaylandı
            submissionStatus = 'onaylandi';

            // Zorluk çarpanı
            const difficultyMultiplier = {
                'kolay': 1.0,
                'orta': 1.5,
                'zor': 2.0
            }[challenge.difficulty] || 1.0;

            // Puan hesapla
            pointsAwarded = calculatePoints(
                challenge.points,
                moderationResult.score,
                difficultyMultiplier
            );

            console.log('✅ Submission onaylandı! Puan:', pointsAwarded);
        } else {
            // ⏳ Manuel kontrol gerekli
            submissionStatus = 'beklemede';
            console.log('⏳ Submission manuel kontrol bekliyor');
        }

        // Submission ekle
        const [result] = await pool.query(`
            INSERT INTO submissions (challenge_id, user_id, content, location, media_url, media_type, status, points_awarded)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [challengeId, req.user.id, content || null, location || null, media_url, finalMediaType || 'resim', submissionStatus, pointsAwarded]);

        // Eğer onaylandıysa kullanıcıya puan ekle
        if (submissionStatus === 'onaylandi' && pointsAwarded > 0) {
            await pool.query(
                'UPDATE users SET points = points + ? WHERE id = ?',
                [pointsAwarded, req.user.id]
            );

            await pool.query(
                'UPDATE participants SET points_earned = points_earned + ? WHERE challenge_id = ? AND user_id = ?',
                [pointsAwarded, challengeId, req.user.id]
            );
        }

        // Bildirim oluştur (database'de notifications tablosu var)
        let notificationMessage = '';
        if (submissionStatus === 'onaylandi') {
            notificationMessage = `Gönderiniz "${challenge.title}" için onaylandı! +${pointsAwarded} puan kazandınız! 🎉`;
        } else if (submissionStatus === 'reddedildi') {
            notificationMessage = `Gönderiniz "${challenge.title}" için reddedildi. Sebep: ${moderationResult.reason}`;
        } else {
            notificationMessage = `Gönderiniz "${challenge.title}" için manuel kontrol bekliyor.`;
        }

        await pool.query(
            `INSERT INTO notifications (user_id, type, title, message, link)
             VALUES (?, ?, ?, ?, ?)`,
            [
                req.user.id,
                submissionStatus === 'onaylandi' ? 'submission_approved' : 'submission_status',
                submissionStatus === 'onaylandi' ? '✅ Gönderi Onaylandı!' : submissionStatus === 'reddedildi' ? '❌ Gönderi Reddedildi' : '⏳ Gönderi Kontrol Ediliyor',
                notificationMessage,
                `/challenge/${challengeId}`
            ]
        );

        res.status(201).json({
            message: submissionStatus === 'onaylandi'
                ? `Gönderiniz onaylandı! +${pointsAwarded} puan kazandınız! 🎉`
                : submissionStatus === 'reddedildi'
                ? `Gönderiniz reddedildi: ${moderationResult.reason}`
                : 'Gönderiniz manuel kontrol bekliyor',
            submission_id: result.insertId,
            status: submissionStatus,
            points_awarded: pointsAwarded,
            ai_score: moderationResult.score
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

// Submission sil
async function deleteSubmission(req, res) {
    const { id } = req.params;

    try {
        // Submission'ın sahibini kontrol et
        const [submissions] = await pool.query(
            'SELECT user_id FROM submissions WHERE id = ?',
            [id]
        );

        if (submissions.length === 0) {
            return res.status(404).json({ error: 'Gönderi bulunamadı' });
        }

        if (submissions[0].user_id !== req.user.id) {
            return res.status(403).json({ error: 'Bu gönderiyi silme yetkiniz yok' });
        }

        // Submission'ı sil (comments ve likes cascade olarak silinecek)
        await pool.query('DELETE FROM submissions WHERE id = ?', [id]);

        res.json({ message: 'Gönderi başarıyla silindi' });

    } catch (error) {
        console.error('Submission silme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

// Feed - Tüm challenge'lardan popüler submission'ları getir
async function getFeed(req, res) {
    const { limit = 20, offset = 0, category } = req.query;

    try {
        let query = `
            SELECT
                s.id,
                s.challenge_id,
                s.user_id,
                s.content,
                s.location,
                s.media_url,
                s.media_type,
                s.likes_count,
                s.created_at,
                u.username,
                u.avatar_url,
                u.full_name,
                c.title as challenge_title,
                c.difficulty as challenge_difficulty,
                cat.name as category_name,
                cat.slug as category_slug,
                cat.icon as category_icon,
                COUNT(DISTINCT com.id) as comments_count
            FROM submissions s
            JOIN users u ON s.user_id = u.id
            JOIN challenges c ON s.challenge_id = c.id
            LEFT JOIN categories cat ON c.category_id = cat.id
            LEFT JOIN comments com ON s.id = com.submission_id
            WHERE s.status = 'onaylandi'
        `;

        const params = [];

        // Category filtresi
        if (category) {
            query += ` AND cat.slug = ?`;
            params.push(category);
        }

        query += `
            GROUP BY s.id
            ORDER BY s.likes_count DESC, s.created_at DESC
            LIMIT ? OFFSET ?
        `;

        params.push(parseInt(limit), parseInt(offset));

        const [submissions] = await pool.query(query, params);

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
        console.error('Feed yükleme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

module.exports = {
    getSubmissions,
    createSubmission,
    toggleLike,
    addComment,
    getComments,
    deleteSubmission,
    getFeed
};
