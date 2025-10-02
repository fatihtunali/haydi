const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./backend/config/database');

// Routes
const authRoutes = require('./backend/routes/auth');
const challengeRoutes = require('./backend/routes/challenges');
const submissionRoutes = require('./backend/routes/submissions');
const adminRoutes = require('./backend/routes/admin');
const teamRoutes = require('./backend/routes/teams');
const leaderboardRoutes = require('./backend/routes/leaderboard');
const notificationRoutes = require('./backend/routes/notifications');
const badgeRoutes = require('./backend/routes/badges');

const app = express();
const PORT = process.env.PORT || 3000;

// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// View Routes (EJS) - ÖNCE routes tanımla
app.get('/', (req, res) => {
    res.render('pages/index', { title: 'Ana Sayfa', activePage: 'home', challenge: null });
});

app.get('/challenges', (req, res) => {
    res.render('pages/challenges', { title: 'Meydan Okumalar', activePage: 'challenges', challenge: null });
});

app.get('/challenge/:id', async (req, res) => {
    try {
        const { pool } = require('./backend/config/database');
        const [challenges] = await pool.query(`
            SELECT
                c.*,
                cat.name as category_name,
                cat.icon as category_icon,
                u.username as creator_username
            FROM challenges c
            LEFT JOIN categories cat ON c.category_id = cat.id
            LEFT JOIN users u ON c.creator_id = u.id
            WHERE c.id = ?
        `, [req.params.id]);

        if (challenges.length === 0) {
            return res.status(404).render('pages/404', { title: 'Bulunamadı', activePage: '' });
        }

        const challenge = challenges[0];

        res.render('pages/challenge', {
            title: challenge.title,
            activePage: 'challenges',
            challengeId: req.params.id,
            challenge: challenge
        });
    } catch (error) {
        console.error('Challenge detay hatası:', error);
        res.render('pages/challenge', {
            title: 'Meydan Okuma Detay',
            activePage: 'challenges',
            challengeId: req.params.id,
            challenge: null
        });
    }
});

app.get('/login', (req, res) => {
    res.render('pages/login', { title: 'Giriş Yap', activePage: '', challenge: null });
});

app.get('/register', (req, res) => {
    res.render('pages/register', { title: 'Kayıt Ol', activePage: '', challenge: null });
});

app.get('/profile', (req, res) => {
    res.render('pages/profile', { title: 'Profilim', activePage: 'profile', challenge: null });
});

app.get('/admin', (req, res) => {
    res.render('pages/admin', { title: 'Admin Panel', activePage: 'admin', challenge: null });
});

app.get('/leaderboard', (req, res) => {
    res.render('pages/leaderboard', { title: 'Liderlik Tablosu', activePage: 'leaderboard', challenge: null });
});

app.get('/create-challenge', (req, res) => {
    res.render('pages/create-challenge', { title: 'Challenge Oluştur', activePage: '', challenge: null });
});

app.get('/edit-challenge/:id', (req, res) => {
    res.render('pages/edit-challenge', { title: 'Challenge Düzenle', activePage: '', challenge: null, challengeId: req.params.id });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/badges', badgeRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Haydi Hep Beraber API çalışıyor!' });
});

// Static files - Routes'lardan SONRA (CSS, JS, images için)
app.use('/uploads', express.static('uploads'));
app.use(express.static('public'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Hata:', err);

    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Dosya çok büyük (max 100MB)' });
        }
        console.error('MulterError details:', err);
        return res.status(400).json({ error: 'Dosya yükleme hatası: ' + err.message });
    }

    // Cloudinary hatası
    if (err.message && err.message.includes('cloudinary')) {
        console.error('Cloudinary error:', err);
        return res.status(400).json({ error: 'Cloudinary yükleme hatası: ' + err.message });
    }

    res.status(500).json({ error: 'Sunucu hatası: ' + (err.message || 'Bilinmeyen hata') });
});

// Sunucuyu başlat
async function startServer() {
    // Veritabanı bağlantısını test et
    const dbConnected = await testConnection();

    if (!dbConnected) {
        console.error('Veritabanı bağlantısı kurulamadı. Sunucu başlatılamıyor.');
        process.exit(1);
    }

    app.listen(PORT, () => {
        console.log('');
        console.log('🎉 Haydi Hep Beraber API Başlatıldı!');
        console.log('');
        console.log(`🌐 Sunucu: http://localhost:${PORT}`);
        console.log(`📡 API: http://localhost:${PORT}/api`);
        console.log(`💚 Health: http://localhost:${PORT}/api/health`);
        console.log('');
        console.log('Durdurmak için: Ctrl+C');
        console.log('');
    });
}

startServer();
