const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
    let connection;

    try {
        console.log('MySQL sunucusuna bağlanılıyor...');

        // İlk bağlantı (veritabanı olmadan)
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT,
            multipleStatements: true
        });

        console.log('✓ MySQL bağlantısı başarılı!');
        console.log('');

        // SQL dosyasını oku
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('Veritabanı ve tablolar oluşturuluyor...');

        // Schema'yı çalıştır
        await connection.query(schema);

        console.log('✓ Veritabanı başarıyla oluşturuldu!');
        console.log('✓ Tablolar oluşturuldu!');
        console.log('✓ Başlangıç kategorileri eklendi!');
        console.log('');
        console.log('Kurulum tamamlandı! 🎉');
        console.log('');
        console.log('Sunucuyu başlatmak için: npm start');

    } catch (error) {
        console.error('❌ Hata oluştu:', error.message);

        if (error.code === 'ECONNREFUSED') {
            console.error('MySQL sunucusuna bağlanılamadı. Bağlantı bilgilerini kontrol edin.');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('MySQL kullanıcı adı veya şifre hatalı.');
        }

        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

setupDatabase();
