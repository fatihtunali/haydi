const nodemailer = require('nodemailer');
const { pool } = require('../config/database');

// Email transporter yapılandırması
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true', // SSL/TLS
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: {
        rejectUnauthorized: false // Self-signed sertifika için
    },
    requireTLS: false,
    debug: true, // Debug logları görmek için
    logger: true
});

// Email gönderme fonksiyonu
async function sendEmail({ to, subject, html, text, userId = null, type = 'other' }) {
    let status = 'failed';
    let errorMessage = null;
    let messageId = null;

    try {
        const info = await transporter.sendMail({
            from: `"Haydi Hep Beraber" <${process.env.EMAIL_FROM}>`,
            to,
            subject,
            text,
            html
        });

        status = 'success';
        messageId = info.messageId;
        console.log('✅ Email gönderildi:', info.messageId, 'to', to);

        // Database'e log kaydet
        await pool.query(`
            INSERT INTO email_logs (user_id, email, subject, type, status, message_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [userId, to, subject, type, status, messageId]);

        return { success: true, messageId: info.messageId };
    } catch (error) {
        status = 'failed';
        errorMessage = error.message;
        console.error('❌ Email gönderme hatası:', error);

        // Hatayı database'e kaydet
        try {
            await pool.query(`
                INSERT INTO email_logs (user_id, email, subject, type, status, error_message)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [userId, to, subject, type, status, errorMessage]);
        } catch (logError) {
            console.error('Log kayıt hatası:', logError);
        }

        return { success: false, error: error.message };
    }
}

// Challenge başlangıç hatırlatması
async function sendChallengeStartReminder(user, challenge) {
    const subject = `🎯 "${challenge.title}" Meydan Okuması Başlıyor!`;

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #6366f1 0%, #10b981 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; padding: 12px 30px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎯 Meydan Okuma Başlıyor!</h1>
                </div>
                <div class="content">
                    <p>Merhaba ${user.full_name || user.username},</p>

                    <p><strong>"${challenge.title}"</strong> meydan okuması bugün başlıyor!</p>

                    <p><strong>Detaylar:</strong></p>
                    <ul>
                        <li>📅 Başlangıç: ${new Date(challenge.start_date).toLocaleDateString('tr-TR')}</li>
                        <li>🏁 Bitiş: ${new Date(challenge.end_date).toLocaleDateString('tr-TR')}</li>
                        <li>📂 Kategori: ${challenge.category_name}</li>
                        <li>⚡ Zorluk: ${challenge.difficulty}</li>
                    </ul>

                    <p>${challenge.description}</p>

                    <a href="https://haydihepberaber.com/challenge/${challenge.id}" class="button">Meydan Okumaya Git →</a>

                    <p>Başarılar dileriz! 🚀</p>
                </div>
                <div class="footer">
                    <p>Haydi Hep Beraber - Birlikte Daha Güçlüyüz!</p>
                    <p><a href="https://haydihepberaber.com">haydihepberaber.com</a></p>
                </div>
            </div>
        </body>
        </html>
    `;

    const text = `
Merhaba ${user.full_name || user.username},

"${challenge.title}" meydan okuması bugün başlıyor!

Detaylar:
- Başlangıç: ${new Date(challenge.start_date).toLocaleDateString('tr-TR')}
- Bitiş: ${new Date(challenge.end_date).toLocaleDateString('tr-TR')}
- Kategori: ${challenge.category_name}
- Zorluk: ${challenge.difficulty}

${challenge.description}

Meydan okumaya katılmak için: https://haydihepberaber.com/challenge/${challenge.id}

Başarılar dileriz! 🚀

Haydi Hep Beraber
https://haydihepberaber.com
    `;

    return await sendEmail({
        to: user.email,
        subject,
        html,
        text,
        userId: user.id,
        type: 'challenge_reminder'
    });
}

// Haftalık özet maili
async function sendWeeklySummary(user, stats) {
    const subject = '📊 Haftalık Özet - Haydi Hep Beraber';

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #6366f1 0%, #10b981 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .stat-card { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #6366f1; }
                .stat-number { font-size: 32px; font-weight: bold; color: #6366f1; }
                .stat-label { color: #6b7280; margin-top: 5px; }
                .button { display: inline-block; padding: 12px 30px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📊 Haftalık Özetin</h1>
                </div>
                <div class="content">
                    <p>Merhaba ${user.full_name || user.username},</p>

                    <p>Bu hafta harika bir performans sergildin! İşte istatistiklerin:</p>

                    <div class="stat-card">
                        <div class="stat-number">${stats.points || 0}</div>
                        <div class="stat-label">🏆 Kazanılan Puan</div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-number">${stats.submissions || 0}</div>
                        <div class="stat-label">📸 Gönderilen İçerik</div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-number">${stats.activeChallenges || 0}</div>
                        <div class="stat-label">🎯 Aktif Meydan Okuma</div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-number">#${stats.rank || '-'}</div>
                        <div class="stat-label">📈 Sıralaman</div>
                    </div>

                    ${stats.newFollowers > 0 ? `
                    <div class="stat-card">
                        <div class="stat-number">${stats.newFollowers}</div>
                        <div class="stat-label">👥 Yeni Takipçi</div>
                    </div>
                    ` : ''}

                    <p>Harika gidiyorsun! Devam et! 🚀</p>

                    <a href="https://haydihepberaber.com/profile" class="button">Profilini Görüntüle →</a>
                </div>
                <div class="footer">
                    <p>Haydi Hep Beraber - Birlikte Daha Güçlüyüz!</p>
                    <p><a href="https://haydihepberaber.com">haydihepberaber.com</a></p>
                </div>
            </div>
        </body>
        </html>
    `;

    const text = `
Merhaba ${user.full_name || user.username},

Bu hafta harika bir performans sergildin! İşte istatistiklerin:

🏆 Kazanılan Puan: ${stats.points || 0}
📸 Gönderilen İçerik: ${stats.submissions || 0}
🎯 Aktif Meydan Okuma: ${stats.activeChallenges || 0}
📈 Sıralaman: #${stats.rank || '-'}
${stats.newFollowers > 0 ? `👥 Yeni Takipçi: ${stats.newFollowers}` : ''}

Harika gidiyorsun! Devam et! 🚀

Profilini görüntüle: https://haydihepberaber.com/profile

Haydi Hep Beraber
https://haydihepberaber.com
    `;

    return await sendEmail({
        to: user.email,
        subject,
        html,
        text,
        userId: user.id,
        type: 'weekly_summary'
    });
}

// Test email
async function sendTestEmail(to, userId = null) {
    return await sendEmail({
        to,
        subject: '✅ Test Email - Haydi Hep Beraber',
        html: '<h1>Test Email</h1><p>Email sistemi başarıyla çalışıyor! 🎉</p>',
        text: 'Test Email - Email sistemi başarıyla çalışıyor! 🎉',
        userId,
        type: 'test'
    });
}

module.exports = {
    sendEmail,
    sendChallengeStartReminder,
    sendWeeklySummary,
    sendTestEmail
};
