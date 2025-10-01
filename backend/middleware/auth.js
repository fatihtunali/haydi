const jwt = require('jsonwebtoken');

// JWT token doğrulama middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Giriş yapmanız gerekiyor' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Geçersiz token' });
        }

        req.user = user;
        next();
    });
}

// Opsiyonel auth - token varsa user'ı ekle, yoksa devam et
function optionalAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        req.user = null;
        return next();
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            req.user = null;
        } else {
            req.user = user;
        }
        next();
    });
}

// Admin kontrolü
async function isAdmin(req, res, next) {
    const { pool } = require('../config/database');

    // Önce token kontrolü yap
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Giriş yapmanız gerekiyor' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Geçersiz token' });
        }

        try {
            // Database'den kullanıcının role'ünü kontrol et
            const [users] = await pool.query(
                'SELECT role FROM users WHERE id = ?',
                [user.id]
            );

            if (users.length === 0 || users[0].role !== 'admin') {
                return res.status(403).json({ error: 'Bu işlem için admin yetkisi gerekli' });
            }

            req.user = user;
            req.user.role = users[0].role;
            next();
        } catch (error) {
            console.error('Admin kontrol hatası:', error);
            res.status(500).json({ error: 'Sunucu hatası' });
        }
    });
}

module.exports = { authenticateToken, optionalAuth, isAdmin };
