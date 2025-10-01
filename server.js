const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./backend/config/database');

// Routes
const authRoutes = require('./backend/routes/auth');
const challengeRoutes = require('./backend/routes/challenges');
const submissionRoutes = require('./backend/routes/submissions');

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
    res.render('pages/index', { title: 'Ana Sayfa', activePage: 'home' });
});

app.get('/challenges', (req, res) => {
    res.render('pages/challenges', { title: 'Meydan Okumalar', activePage: 'challenges' });
});

app.get('/challenge/:id', (req, res) => {
    res.render('pages/challenge', { title: 'Meydan Okuma Detay', activePage: 'challenges', challengeId: req.params.id });
});

app.get('/login', (req, res) => {
    res.render('pages/login', { title: 'Giriş Yap', activePage: '' });
});

app.get('/register', (req, res) => {
    res.render('pages/register', { title: 'Kayıt Ol', activePage: '' });
});

app.get('/profile', (req, res) => {
    res.render('pages/profile', { title: 'Profilim', activePage: 'profile' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/submissions', submissionRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Haydi Hep Beraber API çalışıyor!' });
});

// Static files - Routes'lardan SONRA (CSS, JS, images için)
app.use('/uploads', express.static('uploads'));
app.use(express.static('public'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Hata:', err.stack);

    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Dosya çok büyük (max 5MB)' });
        }
        return res.status(400).json({ error: 'Dosya yükleme hatası' });
    }

    res.status(500).json({ error: 'Sunucu hatası' });
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
