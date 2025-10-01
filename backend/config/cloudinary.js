const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Cloudinary konfigürasyonu
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cloudinary storage oluştur
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        const isVideo = file.mimetype.startsWith('video/');

        return {
            folder: process.env.CLOUDINARY_FOLDER || 'haydi',
            allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'avi', 'webm'],
            resource_type: isVideo ? 'video' : 'image',
            transformation: isVideo ? [
                { width: 1920, height: 1080, crop: 'limit' },
                { quality: 'auto' },
                { fetch_format: 'auto' }
            ] : [
                { width: 1200, height: 1200, crop: 'limit' },
                { quality: 'auto' }
            ]
        };
    }
});

module.exports = { cloudinary, storage };
