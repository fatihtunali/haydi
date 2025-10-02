// Badge Sistemi Migration Script
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function runMigration() {
    let connection;

    try {
        console.log('🔄 Veritabanına bağlanılıyor...');

        // Bağlantı oluştur
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT || 3306,
            database: process.env.DB_NAME,
            multipleStatements: true
        });

        console.log('✅ Veritabanı bağlantısı başarılı');

        // SQL dosyasını oku
        const sqlFile = path.join(__dirname, 'add-badges.sql');
        const sql = await fs.readFile(sqlFile, 'utf8');

        console.log('🔄 Badge migration çalıştırılıyor...');

        // SQL'i çalıştır
        await connection.query(sql);

        console.log('✅ Badge sistemi başarıyla kuruldu!');
        console.log('📊 13 badge tanımı eklendi');
        console.log('');
        console.log('Badge türleri:');
        console.log('  🎯 Challenge tamamlama: 3 badge');
        console.log('  📸 Gönderi yapma: 3 badge');
        console.log('  ❤️ Beğeni alma: 3 badge');
        console.log('  💬 Yorum yazma: 2 badge');
        console.log('  👥 Takım kurma: 2 badge');

    } catch (error) {
        console.error('❌ Migration hatası:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('');
            console.log('🔌 Bağlantı kapatıldı');
        }
    }
}

// Migration'ı çalıştır
runMigration();
