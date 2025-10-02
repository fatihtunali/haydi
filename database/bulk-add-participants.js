const { pool } = require('../backend/config/database');

/**
 * Bulk add participants to challenges
 * Each user joins 3-8 random challenges
 */

/**
 * Get random number between min and max (inclusive)
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get random elements from array
 */
function getRandomElements(arr, count) {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

/**
 * Get random status with weighted distribution
 */
function getRandomStatus() {
    const rand = Math.random();
    if (rand < 0.70) return 'aktif';          // 70% active/participating
    if (rand < 0.85) return 'tamamlandi';     // 15% completed
    return 'vazgecti';                         // 15% quit
}

/**
 * Get random points (0-100) for completed challenges
 */
function getRandomPoints() {
    return getRandomInt(10, 100);
}

/**
 * Add random participants to challenges
 */
async function bulkAddParticipants() {
    console.log('🚀 Kullanıcılar challenge\'lara ekleniyor...\n');

    try {
        // Get all users (excluding admin)
        const [users] = await pool.query(
            'SELECT id, username FROM users WHERE role != "admin" ORDER BY id'
        );

        // Get all active challenges
        const [challenges] = await pool.query(
            'SELECT id, title, status FROM challenges WHERE status = "aktif"'
        );

        if (challenges.length === 0) {
            console.log('❌ Aktif challenge bulunamadı!');
            return;
        }

        console.log(`👥 Kullanıcı sayısı: ${users.length}`);
        console.log(`🎯 Aktif challenge sayısı: ${challenges.length}\n`);

        let totalAdded = 0;
        let totalSkipped = 0;

        for (let i = 0; i < users.length; i++) {
            const user = users[i];

            // Each user joins 3-8 random challenges
            const challengeCount = getRandomInt(3, Math.min(8, challenges.length));
            const selectedChallenges = getRandomElements(challenges, challengeCount);

            let userAdded = 0;
            let userSkipped = 0;

            for (const challenge of selectedChallenges) {
                try {
                    // Check if already participating
                    const [existing] = await pool.query(
                        'SELECT id FROM participants WHERE user_id = ? AND challenge_id = ?',
                        [user.id, challenge.id]
                    );

                    if (existing.length > 0) {
                        userSkipped++;
                        continue;
                    }

                    const status = getRandomStatus();
                    const pointsEarned = status === 'tamamlandi' ? getRandomPoints() : 0;

                    // Add participant
                    await pool.query(
                        `INSERT INTO participants (user_id, challenge_id, status, points_earned, joined_at)
                         VALUES (?, ?, ?, ?, NOW())`,
                        [user.id, challenge.id, status, pointsEarned]
                    );

                    // Update user points if completed
                    if (status === 'tamamlandi' && pointsEarned > 0) {
                        await pool.query(
                            'UPDATE users SET points = points + ? WHERE id = ?',
                            [pointsEarned, user.id]
                        );
                    }

                    userAdded++;
                } catch (error) {
                    userSkipped++;
                    console.log(`⚠️  ${user.username} - Challenge ${challenge.id} eklenemedi: ${error.message}`);
                }
            }

            totalAdded += userAdded;
            totalSkipped += userSkipped;

            console.log(`✅ ${i + 1}/${users.length} - ${user.username} - ${userAdded} challenge'a katıldı ${userSkipped > 0 ? `(${userSkipped} atlandı)` : ''}`);
        }

        console.log('\n📊 Özet:');
        console.log(`✅ Eklenen katılım: ${totalAdded}`);
        console.log(`⚠️  Atlanan: ${totalSkipped}`);
        console.log(`📈 Ortalama: ${(totalAdded / users.length).toFixed(1)} challenge/kullanıcı\n`);

        // Show status distribution
        const [stats] = await pool.query(`
            SELECT
                status,
                COUNT(*) as count,
                ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM participants), 1) as percentage
            FROM participants
            GROUP BY status
        `);

        console.log('📊 Durum Dağılımı:');
        stats.forEach(stat => {
            const emoji = stat.status === 'katildi' ? '🏃' : stat.status === 'tamamladi' ? '✅' : '❌';
            console.log(`${emoji} ${stat.status}: ${stat.count} (${stat.percentage}%)`);
        });

        console.log('\n');

    } catch (error) {
        console.error('❌ Kritik hata:', error);
        throw error;
    }
}

// Run the script
bulkAddParticipants()
    .then(() => {
        console.log('✅ İşlem tamamlandı');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Hata:', error);
        process.exit(1);
    });
