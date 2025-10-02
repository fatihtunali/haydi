const multer = require('multer');
const { storage } = require('../config/cloudinary');

// Dosya filtreleme
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        // Resimler
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        // Videolar
        'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Sadece resim (jpg, png, gif, webp) ve video (mp4, mov, avi, webm) dosyaları yüklenebilir'), false);
    }
};

// Multer yapılandırması - Cloudinary storage ile
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB (videolar için)
    },
    fileFilter: fileFilter
});

// Avatar upload için özel yapılandırma (sadece resim, max 5MB)
const avatarFileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Sadece resim dosyaları (jpg, png, gif, webp) yüklenebilir'), false);
    }
};

const avatarUpload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: avatarFileFilter
});

module.exports = { upload, avatarUpload };
