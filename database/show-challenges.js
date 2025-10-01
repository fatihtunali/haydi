const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function showChallenges() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    });

    const [challenges] = await connection.query(`
        SELECT
            c.id,
            c.title,
            cat.name as kategori,
            cat.icon,
            c.difficulty,
            c.points,
            c.status
        FROM challenges c
        LEFT JOIN categories cat ON c.category_id = cat.id
        WHERE c.status = 'aktif'
        ORDER BY c.id DESC
        LIMIT 10
    `);

    console.log('\n🏆 VERİTABANINA EKLENEN MEYDAN OKUMALAR:\n');
    challenges.forEach(c => {
        console.log(`${c.id}. ${c.icon} ${c.title}`);
        console.log(`   Kategori: ${c.kategori} | Zorluk: ${c.difficulty} | Puan: ${c.points}\n`);
    });

    await connection.end();
}

showChallenges();
