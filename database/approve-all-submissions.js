const { pool } = require('../backend/config/database');

/**
 * Approve all pending submissions and award points
 */
async function approveAllPendingSubmissions() {
    console.log('🚀 Bekleyen gönderiler onaylanıyor...\n');

    try {
        // Get all pending submissions
        const [pendingSubmissions] = await pool.query(`
            SELECT id, user_id, challenge_id, ai_score
            FROM submissions
            WHERE status = 'beklemede'
        `);

        console.log(`📋 Bekleyen gönderi sayısı: ${pendingSubmissions.length}\n`);

        if (pendingSubmissions.length === 0) {
            console.log('✅ Bekleyen gönderi yok!\n');
            return;
        }

        let approvedCount = 0;
        let errorCount = 0;

        for (const submission of pendingSubmissions) {
            try {
                // Calculate points based on AI score
                const pointsAwarded = Math.floor(submission.ai_score * 0.8);

                // Update submission status and points
                await pool.query(`
                    UPDATE submissions
                    SET status = 'onaylandi',
                        points_awarded = ?
                    WHERE id = ?
                `, [pointsAwarded, submission.id]);

                // Update user points
                await pool.query(`
                    UPDATE users
                    SET points = points + ?
                    WHERE id = ?
                `, [pointsAwarded, submission.user_id]);

                approvedCount++;

                if (approvedCount % 100 === 0) {
                    console.log(`✅ ${approvedCount}/${pendingSubmissions.length} gönderi onaylandı...`);
                }
            } catch (error) {
                errorCount++;
                console.log(`❌ Gönderi ${submission.id} onaylanamadı: ${error.message}`);
            }
        }

        console.log(`\n📊 Özet:`);
        console.log(`✅ Onaylanan: ${approvedCount}`);
        console.log(`❌ Hatalı: ${errorCount}`);

        // Show updated statistics
        const [stats] = await pool.query(`
            SELECT
                status,
                COUNT(*) as count,
                ROUND(AVG(ai_score), 1) as avg_score,
                SUM(points_awarded) as total_points
            FROM submissions
            GROUP BY status
        `);

        console.log('\n📊 Güncel Gönderi İstatistikleri:');
        stats.forEach(stat => {
            const emoji = stat.status === 'onaylandi' ? '✅' : stat.status === 'beklemede' ? '⏳' : '❌';
            console.log(`${emoji} ${stat.status}: ${stat.count} gönderi | Ort. Score: ${stat.avg_score} | Toplam Puan: ${stat.total_points || 0}`);
        });

        console.log('\n');

    } catch (error) {
        console.error('❌ Kritik hata:', error);
        throw error;
    }
}

// Run the script
approveAllPendingSubmissions()
    .then(() => {
        console.log('✅ İşlem tamamlandı\n');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Hata:', error);
        process.exit(1);
    });
