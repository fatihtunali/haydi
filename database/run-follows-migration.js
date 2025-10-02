const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function runMigration() {
    let connection;

    try {
        // MySQL bağlantısı oluştur
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'haydihepberaber',
            port: process.env.DB_PORT || 3306
        });

        console.log('✓ MySQL bağlantısı başarılı');

        // SQL dosyasını oku
        const sqlPath = path.join(__dirname, 'add-follows.sql');
        const sql = await fs.readFile(sqlPath, 'utf8');

        // SQL'i çalıştır
        await connection.query(sql);

        console.log('✓ Follows tablosu oluşturuldu!');
        console.log('✓ Migration başarıyla tamamlandı');

    } catch (error) {
        console.error('❌ Migration hatası:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

runMigration();
