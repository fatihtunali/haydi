const { pool } = require('../config/database');

// ===== DASHBOARD İSTATİSTİKLERİ =====

async function getDashboard(req, res) {
    try {
        // Toplam sayılar
        const [[stats]] = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM challenges) as total_challenges,
                (SELECT COUNT(*) FROM submissions) as total_submissions,
                (SELECT COUNT(*) FROM submissions WHERE status = 'beklemede') as pending_submissions,
                (SELECT SUM(points) FROM users) as total_points_distributed
        `);

        // Son 7 günlük istatistikler
        const [dailyStats] = await pool.query(`
            SELECT
                DATE(created_at) as date,
                COUNT(*) as count
            FROM submissions
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `);

        // En aktif kullanıcılar (top 10)
        const [topUsers] = await pool.query(`
            SELECT
                u.id,
                u.username,
                u.email,
                u.points,
                COUNT(DISTINCT s.id) as submission_count
            FROM users u
            LEFT JOIN submissions s ON u.id = s.user_id
            WHERE u.role = 'user'
            GROUP BY u.id
            ORDER BY u.points DESC
            LIMIT 10
        `);

        res.json({
            stats,
            dailyStats,
            topUsers
        });

    } catch (error) {
        console.error('Dashboard hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

// ===== SUBMISSION YÖNETİMİ =====

async function getAllSubmissions(req, res) {
    const { status, limit = 50, offset = 0 } = req.query;

    try {
        let query = `
            SELECT
                s.*,
                u.username,
                u.email,
                c.title as challenge_title,
                c.difficulty,
                c.points as challenge_points
            FROM submissions s
            JOIN users u ON s.user_id = u.id
            JOIN challenges c ON s.challenge_id = c.id
        `;

        const params = [];

        if (status) {
            query += ' WHERE s.status = ?';
            params.push(status);
        }

        query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [submissions] = await pool.query(query, params);

        // Toplam sayı
        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) as total FROM submissions ${status ? 'WHERE status = ?' : ''}`,
            status ? [status] : []
        );

        res.json({
            submissions,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        console.error('Submission listeleme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

async function approveSubmission(req, res) {
    const { id } = req.params;
    const { points } = req.body; // Manuel puan verme opsiyonu (AI skorunu override eder)

    try {
        // Submission'ı al
        const [[submission]] = await pool.query(
            'SELECT * FROM submissions WHERE id = ?',
            [id]
        );

        if (!submission) {
            return res.status(404).json({ error: 'Gönderi bulunamadı' });
        }

        if (submission.status === 'onaylandi') {
            return res.status(400).json({ error: 'Gönderi zaten onaylı' });
        }

        // Challenge bilgilerini al
        const [[challenge]] = await pool.query(
            'SELECT points, difficulty FROM challenges WHERE id = ?',
            [submission.challenge_id]
        );

        // Puan hesapla - AI skoru varsa kullan, yoksa standart hesaplama
        let pointsToAward;

        if (points) {
            // Admin manuel puan verdiyse onu kullan
            pointsToAward = points;
        } else if (submission.ai_score && submission.ai_score > 0) {
            // AI skoru varsa ona göre puan hesapla
            const { calculatePoints } = require('../services/aiModeration');
            const difficultyMultiplier = {
                'kolay': 1.0,
                'orta': 1.5,
                'zor': 2.0
            }[challenge.difficulty] || 1.0;

            pointsToAward = calculatePoints(
                challenge.points,
                submission.ai_score,
                difficultyMultiplier
            );
        } else {
            // AI skoru yoksa standart hesaplama
            const difficultyMultiplier = {
                'kolay': 1.0,
                'orta': 1.5,
                'zor': 2.0
            }[challenge.difficulty] || 1.0;

            pointsToAward = Math.floor(challenge.points * difficultyMultiplier);
        }

        // Submission'ı onayla ve puan ver
        await pool.query(
            'UPDATE submissions SET status = ?, points_awarded = ?, reviewed_at = NOW() WHERE id = ?',
            ['onaylandi', pointsToAward, id]
        );

        // Kullanıcıya puan ekle
        await pool.query(
            'UPDATE users SET points = points + ? WHERE id = ?',
            [pointsToAward, submission.user_id]
        );

        await pool.query(
            'UPDATE participants SET points_earned = points_earned + ? WHERE challenge_id = ? AND user_id = ?',
            [pointsToAward, submission.challenge_id, submission.user_id]
        );

        // Bildirim oluştur
        await pool.query(
            `INSERT INTO notifications (user_id, type, title, message, link)
             VALUES (?, ?, ?, ?, ?)`,
            [
                submission.user_id,
                'submission_approved',
                '✅ Gönderi Onaylandı!',
                `Gönderiniz onaylandı! +${pointsToAward} puan kazandınız! 🎉`,
                `/challenge/${submission.challenge_id}`
            ]
        );

        res.json({
            message: 'Gönderi onaylandı',
            points_awarded: pointsToAward,
            ai_score: submission.ai_score
        });

    } catch (error) {
        console.error('Submission onaylama hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

async function rejectSubmission(req, res) {
    const { id } = req.params;
    const { reason } = req.body;

    try {
        const [[submission]] = await pool.query(
            'SELECT * FROM submissions WHERE id = ?',
            [id]
        );

        if (!submission) {
            return res.status(404).json({ error: 'Gönderi bulunamadı' });
        }

        // Submission'ı reddet
        await pool.query(
            'UPDATE submissions SET status = ?, reviewed_at = NOW() WHERE id = ?',
            ['reddedildi', id]
        );

        // Bildirim oluştur
        const rejectReason = reason || submission.ai_reason || 'Kurallara uygun değil';

        await pool.query(
            `INSERT INTO notifications (user_id, type, title, message, link)
             VALUES (?, ?, ?, ?, ?)`,
            [
                submission.user_id,
                'submission_rejected',
                '❌ Gönderi Reddedildi',
                `Gönderiniz reddedildi. Sebep: ${rejectReason}`,
                `/challenge/${submission.challenge_id}`
            ]
        );

        res.json({
            message: 'Gönderi reddedildi',
            reason: rejectReason
        });

    } catch (error) {
        console.error('Submission reddetme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

async function deleteSubmission(req, res) {
    const { id } = req.params;

    try {
        const [[submission]] = await pool.query(
            'SELECT * FROM submissions WHERE id = ?',
            [id]
        );

        if (!submission) {
            return res.status(404).json({ error: 'Gönderi bulunamadı' });
        }

        // Submission'ı sil (cascade ile comments ve likes de silinecek)
        await pool.query('DELETE FROM submissions WHERE id = ?', [id]);

        res.json({ message: 'Gönderi silindi' });

    } catch (error) {
        console.error('Submission silme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

// ===== KULLANICI YÖNETİMİ =====

async function getAllUsers(req, res) {
    const { search, limit = 50, offset = 0 } = req.query;

    try {
        let query = `
            SELECT
                u.id,
                u.username,
                u.email,
                u.full_name,
                u.role,
                u.points,
                u.created_at,
                COUNT(DISTINCT s.id) as submission_count,
                COUNT(DISTINCT p.id) as challenge_count
            FROM users u
            LEFT JOIN submissions s ON u.id = s.user_id
            LEFT JOIN participants p ON u.id = p.user_id
        `;

        const params = [];

        if (search) {
            query += ' WHERE u.username LIKE ? OR u.email LIKE ?';
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ' GROUP BY u.id ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [users] = await pool.query(query, params);

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) as total FROM users ${search ? 'WHERE username LIKE ? OR email LIKE ?' : ''}`,
            search ? [`%${search}%`, `%${search}%`] : []
        );

        res.json({
            users,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        console.error('Kullanıcı listeleme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

async function updateUser(req, res) {
    const { id } = req.params;
    const { role, points } = req.body;

    try {
        const updates = [];
        const params = [];

        if (role) {
            updates.push('role = ?');
            params.push(role);
        }

        if (points !== undefined) {
            updates.push('points = ?');
            params.push(points);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'Güncellenecek alan belirtilmedi' });
        }

        params.push(id);

        await pool.query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        res.json({ message: 'Kullanıcı güncellendi' });

    } catch (error) {
        console.error('Kullanıcı güncelleme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

async function deleteUser(req, res) {
    const { id } = req.params;

    try {
        // Admin kendini silemez
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ error: 'Kendi hesabınızı silemezsiniz' });
        }

        const [[user]] = await pool.query(
            'SELECT * FROM users WHERE id = ?',
            [id]
        );

        if (!user) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        }

        // Kullanıcıyı sil (cascade ile ilişkili veriler de silinecek)
        await pool.query('DELETE FROM users WHERE id = ?', [id]);

        res.json({ message: 'Kullanıcı silindi' });

    } catch (error) {
        console.error('Kullanıcı silme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

// ===== CHALLENGE YÖNETİMİ =====

async function getAllChallengesAdmin(req, res) {
    const { status, limit = 50, offset = 0 } = req.query;

    try {
        let query = `
            SELECT
                c.*,
                cat.name as category_name,
                u.username as creator_username,
                COUNT(DISTINCT p.id) as participant_count,
                COUNT(DISTINCT s.id) as submission_count
            FROM challenges c
            LEFT JOIN categories cat ON c.category_id = cat.id
            LEFT JOIN users u ON c.creator_id = u.id
            LEFT JOIN participants p ON c.id = p.challenge_id AND p.status = 'aktif'
            LEFT JOIN submissions s ON c.id = s.challenge_id
        `;

        const params = [];

        if (status) {
            query += ' WHERE c.status = ?';
            params.push(status);
        }

        query += ' GROUP BY c.id ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [challenges] = await pool.query(query, params);

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) as total FROM challenges ${status ? 'WHERE status = ?' : ''}`,
            status ? [status] : []
        );

        res.json({
            challenges,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

    } catch (error) {
        console.error('Challenge listeleme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

async function getChallengeDetail(req, res) {
    const { id } = req.params;

    try {
        const [[challenge]] = await pool.query(`
            SELECT c.*, cat.name as category_name
            FROM challenges c
            LEFT JOIN categories cat ON c.category_id = cat.id
            WHERE c.id = ?
        `, [id]);

        if (!challenge) {
            return res.status(404).json({ error: 'Challenge bulunamadı' });
        }

        res.json({ challenge });

    } catch (error) {
        console.error('Challenge detay hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

async function getCategories(req, res) {
    try {
        const [categories] = await pool.query(
            'SELECT id, name, slug, icon FROM categories ORDER BY name'
        );

        res.json({ categories });

    } catch (error) {
        console.error('Kategori listeleme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

async function updateChallenge(req, res) {
    const { id } = req.params;
    const {
        title,
        description,
        rules,
        category_id,
        difficulty,
        points,
        start_date,
        end_date,
        status,
        max_participants,
        requires_team
    } = req.body;

    try {
        const updates = [];
        const params = [];

        if (title) {
            updates.push('title = ?');
            params.push(title);
        }

        if (description) {
            updates.push('description = ?');
            params.push(description);
        }

        if (rules !== undefined) {
            updates.push('rules = ?');
            params.push(rules);
        }

        if (category_id !== undefined) {
            updates.push('category_id = ?');
            params.push(category_id);
        }

        if (difficulty) {
            updates.push('difficulty = ?');
            params.push(difficulty);
        }

        if (points !== undefined) {
            updates.push('points = ?');
            params.push(points);
        }

        if (start_date) {
            updates.push('start_date = ?');
            params.push(start_date);
        }

        if (end_date) {
            updates.push('end_date = ?');
            params.push(end_date);
        }

        if (status) {
            updates.push('status = ?');
            params.push(status);
        }

        if (max_participants !== undefined) {
            updates.push('max_participants = ?');
            params.push(max_participants);
        }

        if (requires_team !== undefined) {
            updates.push('requires_team = ?');
            params.push(requires_team ? 1 : 0);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'Güncellenecek alan belirtilmedi' });
        }

        params.push(id);

        await pool.query(
            `UPDATE challenges SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        res.json({ message: 'Challenge güncellendi' });

    } catch (error) {
        console.error('Challenge güncelleme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

async function deleteChallenge(req, res) {
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM challenges WHERE id = ?', [id]);
        res.json({ message: 'Challenge silindi' });

    } catch (error) {
        console.error('Challenge silme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

module.exports = {
    getDashboard,
    getAllSubmissions,
    approveSubmission,
    rejectSubmission,
    deleteSubmission,
    getAllUsers,
    updateUser,
    deleteUser,
    getAllChallengesAdmin,
    getChallengeDetail,
    getCategories,
    updateChallenge,
    deleteChallenge
};
