const cron = require('node-cron');
const { pool } = require('../config/database');
const { sendChallengeStartReminder, sendWeeklySummary } = require('./emailService');

// Challenge başlangıç hatırlatmaları - Her gün sabah 9:00'da
function startChallengeReminders() {
    cron.schedule('0 9 * * *', async () => {
        console.log('🔔 Challenge hatırlatmaları kontrol ediliyor...');

        try {
            // Bugün başlayan challenge'ları bul
            const [challenges] = await pool.query(`
                SELECT c.*, cat.name as category_name
                FROM challenges c
                LEFT JOIN categories cat ON c.category_id = cat.id
                WHERE DATE(c.start_date) = CURDATE()
                    AND c.status = 'aktif'
            `);

            console.log(`📅 Bugün başlayan ${challenges.length} challenge bulundu`);

            for (const challenge of challenges) {
                // Challenge'a katılmış kullanıcıları al
                const [participants] = await pool.query(`
                    SELECT u.id, u.email, u.username, u.full_name
                    FROM participants p
                    JOIN users u ON p.user_id = u.id
                    WHERE p.challenge_id = ?
                        AND u.email IS NOT NULL
                        AND u.email != ''
                `, [challenge.id]);

                console.log(`👥 "${challenge.title}" için ${participants.length} katılımcıya email gönderiliyor...`);

                let successCount = 0;
                for (const user of participants) {
                    const result = await sendChallengeStartReminder(user, challenge);
                    if (result.success) {
                        successCount++;
                    }
                }

                console.log(`✅ "${challenge.title}" için ${successCount}/${participants.length} email gönderildi`);
            }

        } catch (error) {
            console.error('❌ Challenge hatırlatma hatası:', error);
        }
    });

    console.log('✅ Challenge hatırlatma scheduler başlatıldı (Her gün 09:00)');
}

// Haftalık özet - Her Pazartesi sabah 10:00'da
function startWeeklySummaries() {
    cron.schedule('0 10 * * 1', async () => {
        console.log('📊 Haftalık özetler gönderiliyor...');

        try {
            // Email adresi olan tüm kullanıcıları al
            const [users] = await pool.query(`
                SELECT id, email, username, full_name
                FROM users
                WHERE email IS NOT NULL
                    AND email != ''
            `);

            console.log(`👥 ${users.length} kullanıcıya haftalık özet gönderiliyor...`);

            let successCount = 0;
            for (const user of users) {
                try {
                    // Haftalık istatistikleri hesapla
                    const [[pointsData]] = await pool.query(`
                        SELECT COALESCE(SUM(points_awarded), 0) as points
                        FROM submissions
                        WHERE user_id = ?
                            AND status = 'onaylandi'
                            AND reviewed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                    `, [user.id]);

                    const [[submissionsData]] = await pool.query(`
                        SELECT COUNT(*) as count
                        FROM submissions
                        WHERE user_id = ?
                            AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                    `, [user.id]);

                    const [[activeChallengesData]] = await pool.query(`
                        SELECT COUNT(*) as count
                        FROM participants
                        WHERE user_id = ?
                            AND status = 'aktif'
                    `, [user.id]);

                    const [[rankData]] = await pool.query(`
                        SELECT COUNT(*) + 1 as \`rank\`
                        FROM (
                            SELECT u.id, COALESCE(SUM(s.points_awarded), 0) as points
                            FROM users u
                            LEFT JOIN submissions s ON u.id = s.user_id
                                AND s.status = 'onaylandi'
                                AND s.reviewed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                            GROUP BY u.id
                        ) as rankings
                        WHERE points > (
                            SELECT COALESCE(SUM(points_awarded), 0)
                            FROM submissions
                            WHERE user_id = ?
                                AND status = 'onaylandi'
                                AND reviewed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                        )
                    `, [user.id]);

                    const [[followersData]] = await pool.query(`
                        SELECT COUNT(*) as count
                        FROM follows
                        WHERE following_id = ?
                            AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                    `, [user.id]);

                    const stats = {
                        points: pointsData.points,
                        submissions: submissionsData.count,
                        activeChallenges: activeChallengesData.count,
                        rank: rankData.rank,
                        newFollowers: followersData.count
                    };

                    // Sadece aktif olan kullanıcılara gönder (en az 1 gönderi veya puan kazanan)
                    if (stats.submissions > 0 || stats.points > 0 || stats.activeChallenges > 0) {
                        const result = await sendWeeklySummary(user, stats);
                        if (result.success) {
                            successCount++;
                        }
                    }

                } catch (userError) {
                    console.error(`Kullanıcı ${user.email} için özet hatası:`, userError);
                }
            }

            console.log(`✅ ${successCount} kullanıcıya haftalık özet gönderildi`);

        } catch (error) {
            console.error('❌ Haftalık özet hatası:', error);
        }
    });

    console.log('✅ Haftalık özet scheduler başlatıldı (Her Pazartesi 10:00)');
}

// Tüm scheduler'ları başlat
function startEmailSchedulers() {
    startChallengeReminders();
    startWeeklySummaries();
    console.log('📧 Email scheduler\'ları başlatıldı');
}

module.exports = {
    startEmailSchedulers
};
