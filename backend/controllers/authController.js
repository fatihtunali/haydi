const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Kullanıcı kaydı
async function register(req, res) {
    const { username, email, password, full_name } = req.body;

    console.log('Register request body:', req.body);

    // Validasyon
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Kullanıcı adı, email ve şifre gerekli' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Şifre en az 6 karakter olmalı' });
    }

    try {
        // Kullanıcı var mı kontrol et (email veya username)
        const [existing] = await pool.query(
            'SELECT id FROM users WHERE email = ? OR username = ?',
            [email, username]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Bu email veya kullanıcı adı zaten kullanımda' });
        }

        // Şifreyi hashle
        const hashedPassword = await bcrypt.hash(password, 10);

        // Kullanıcıyı kaydet
        const [result] = await pool.query(
            `INSERT INTO users (username, email, password, full_name, points)
             VALUES (?, ?, ?, ?, 0)`,
            [username, email, hashedPassword, full_name || null]
        );

        // Token oluştur
        const token = jwt.sign(
            { id: result.insertId, username, email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Kayıt başarılı',
            token,
            user: {
                id: result.insertId,
                username,
                email,
                full_name: full_name || null,
                points: 0
            }
        });

    } catch (error) {
        console.error('Kayıt hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

// Kullanıcı girişi
async function login(req, res) {
    const { email, password } = req.body;

    console.log('Login request:', { email, password: password ? '***' : undefined });

    if (!email || !password) {
        return res.status(400).json({ error: 'Email ve şifre gerekli' });
    }

    try {
        // Kullanıcıyı bul
        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Email veya şifre hatalı' });
        }

        const user = users[0];

        // Şifreyi kontrol et
        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            return res.status(401).json({ error: 'Email veya şifre hatalı' });
        }

        // Token oluştur
        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Giriş başarılı',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                avatar_url: user.avatar_url,
                points: user.points,
                role: user.role || 'user'
            }
        });

    } catch (error) {
        console.error('Giriş hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

// Kullanıcı bilgilerini getir
async function getProfile(req, res) {
    try {
        const [users] = await pool.query(
            `SELECT id, username, email, full_name, avatar_url, bio, points, role, created_at
             FROM users WHERE id = ?`,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        }

        res.json({ user: users[0] });

    } catch (error) {
        console.error('Profil hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

// Kullanıcının katıldığı challenge'ları getir
async function getUserChallenges(req, res) {
    try {
        const [challenges] = await pool.query(`
            SELECT
                c.id,
                c.title,
                c.description,
                c.difficulty,
                c.points,
                c.start_date,
                c.end_date,
                c.status as challenge_status,
                c.is_team_based,
                c.min_team_size,
                c.max_team_size,
                cat.name as category_name,
                cat.icon as category_icon,
                p.status as participation_status,
                p.points_earned,
                p.joined_at,
                p.completed_at,
                COUNT(DISTINCT p2.id) as participant_count
            FROM participants p
            INNER JOIN challenges c ON p.challenge_id = c.id
            LEFT JOIN categories cat ON c.category_id = cat.id
            LEFT JOIN participants p2 ON c.id = p2.challenge_id AND p2.status = 'aktif'
            WHERE p.user_id = ?
            GROUP BY c.id, p.id
            ORDER BY p.joined_at DESC
        `, [req.user.id]);

        res.json({ challenges });

    } catch (error) {
        console.error('Kullanıcı challenge\'ları getirme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

// Kullanıcının submission'larını getir
async function getUserSubmissions(req, res) {
    try {
        const [submissions] = await pool.query(`
            SELECT
                s.id,
                s.challenge_id,
                s.content,
                s.location,
                s.media_url,
                s.media_type,
                s.status,
                s.likes_count,
                s.created_at,
                c.title as challenge_title,
                c.category_id,
                cat.name as category_name,
                cat.icon as category_icon,
                COUNT(DISTINCT com.id) as comments_count
            FROM submissions s
            INNER JOIN challenges c ON s.challenge_id = c.id
            LEFT JOIN categories cat ON c.category_id = cat.id
            LEFT JOIN comments com ON s.id = com.submission_id
            WHERE s.user_id = ?
            GROUP BY s.id
            ORDER BY s.created_at DESC
        `, [req.user.id]);

        res.json({ submissions });

    } catch (error) {
        console.error('Kullanıcı submission\'ları getirme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

// Profil güncelleme (bio, full_name)
async function updateProfile(req, res) {
    const { full_name, bio } = req.body;

    try {
        // Validasyon
        if (full_name && full_name.length > 100) {
            return res.status(400).json({ error: 'İsim en fazla 100 karakter olabilir' });
        }

        if (bio && bio.length > 500) {
            return res.status(400).json({ error: 'Bio en fazla 500 karakter olabilir' });
        }

        // Profili güncelle
        await pool.query(
            `UPDATE users SET full_name = ?, bio = ? WHERE id = ?`,
            [full_name || null, bio || null, req.user.id]
        );

        // Güncel kullanıcı bilgilerini getir
        const [users] = await pool.query(
            `SELECT id, username, email, full_name, avatar_url, bio, points, role, created_at
             FROM users WHERE id = ?`,
            [req.user.id]
        );

        res.json({
            message: 'Profil güncellendi',
            user: users[0]
        });

    } catch (error) {
        console.error('Profil güncelleme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

// Avatar güncelleme
async function updateAvatar(req, res) {
    try {
        // Cloudinary'den gelen URL'i al
        if (!req.file || !req.file.path) {
            return res.status(400).json({ error: 'Avatar dosyası gerekli' });
        }

        const avatarUrl = req.file.path; // Cloudinary URL

        // Avatar'ı güncelle
        await pool.query(
            `UPDATE users SET avatar_url = ? WHERE id = ?`,
            [avatarUrl, req.user.id]
        );

        // Güncel kullanıcı bilgilerini getir
        const [users] = await pool.query(
            `SELECT id, username, email, full_name, avatar_url, bio, points, role, created_at
             FROM users WHERE id = ?`,
            [req.user.id]
        );

        res.json({
            message: 'Avatar güncellendi',
            user: users[0]
        });

    } catch (error) {
        console.error('Avatar güncelleme hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

// Başka kullanıcının profilini getir (public)
async function getUserById(req, res) {
    const { id } = req.params;

    try {
        const [users] = await pool.query(
            `SELECT id, username, full_name, avatar_url, bio, points, created_at
             FROM users WHERE id = ?`,
            [id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        }

        res.json({ user: users[0] });

    } catch (error) {
        console.error('Kullanıcı profil hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
}

module.exports = {
    register,
    login,
    getProfile,
    getUserById,
    getUserChallenges,
    getUserSubmissions,
    updateProfile,
    updateAvatar
};
