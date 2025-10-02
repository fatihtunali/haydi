const { pool } = require('../backend/config/database');
const fs = require('fs');
const path = require('path');

async function setupEmailLogs() {
    try {
        const sql = fs.readFileSync(
            path.join(__dirname, 'email-logs-table.sql'),
            'utf8'
        );

        await pool.query(sql);
        console.log('✅ email_logs tablosu oluşturuldu');

        process.exit(0);
    } catch (error) {
        console.error('❌ Hata:', error);
        process.exit(1);
    }
}

setupEmailLogs();
