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
                points: user.points
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
            `SELECT id, username, email, full_name, avatar_url, bio, points, created_at
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

module.exports = { register, login, getProfile };
