const { pool } = require('../backend/config/database');

/**
 * Bulk create submissions for participants
 * Each active/completed participant creates 2-4 realistic submissions
 */

/**
 * Get random number between min and max (inclusive)
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get random element from array
 */
function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate realistic Turkish content based on challenge category
 */
function generateSubmissionContent(challenge, categoryName) {
    const templates = {
        'Fitness': [
            `Bugün ${getRandomInt(5, 15)} km koştum! Egzersiz sonrası kendimi harika hissediyorum. 💪`,
            `${getRandomInt(30, 60)} dakika boyunca spor yaptım. Hedefime adım adım yaklaşıyorum!`,
            `Sabah koşusunu tamamladım. ${getRandomInt(300, 800)} kalori yaktım. Motivasyonum çok yüksek!`,
            `Günlük adım hedefimi aştım! ${getRandomInt(10000, 15000)} adım. Kendimle gurur duyuyorum.`,
            `Egzersiz rutinimi tamamladım. Vücut ağrıları var ama değdi! 🏃‍♂️`
        ],
        'Fotoğrafçılık': [
            `Gün batımında çektiğim bu kare favorim oldu. Işık oyunları muhteşemdi. 📷`,
            `Şehrin gizli köşelerinden birinde yakaladığım an. Detaylar çok önemliydi.`,
            `Siyah beyaz bir kare. Gölgeler ve ışık tam istediğim gibi oldu.`,
            `Sabah erken saatlerde çektiğim bu fotoğrafla challenge'a katılıyorum.`,
            `Bu karede renk paleti çok hoşuma gitti. Kompozisyon üzerinde çok çalıştım.`
        ],
        'Kodlama': [
            `Pull request'imi gönderdim! Türkçe dökümantasyon ekledim. 💻`,
            `Bug fix için kod yazdım ve test ettim. Artık daha stabil çalışıyor.`,
            `README dosyasını Türkçeleştirdim ve örnekler ekledim.`,
            `Yeni bir özellik geliştirdim. Code review'dan geçmesini bekliyorum.`,
            `Açık kaynak projeye katkımı yaptım. Topluluğa faydalı olmak güzel! 🚀`
        ],
        'Yemek Pişirme': [
            `${getRandomElement(['Karnıyarık', 'İmam Bayıldı', 'Hünkar Beğendi', 'Etli Yaprak Sarma', 'Mantı', 'Kuru Fasulye', 'Menemen'])} yaptım! Tarif anneanneminindi. Çok lezzetli oldu. 😋`,
            `Bugünkü yemeğim hazır! ${getRandomInt(1, 3)} saat emek verdim ama değdi.`,
            `Geleneksel Türk mutfağından bir lezzet. Ailem çok beğendi.`,
            `İlk denememde bu kadar güzel olacağını düşünmemiştim. Tarifi paylaşıyorum.`,
            `El emeği göz nuru. Mutfakta geçen ${getRandomInt(2, 4)} saat çok keyifliydi!`
        ],
        'Sanat': [
            `Ebru sanatı denemem. Renkler su üzerinde dans ediyor gibi. 🎨`,
            `İlk denemem ama sonuçtan çok memnunum. Sanat terapi gibi geldi.`,
            `${getRandomInt(3, 6)} saat uğraştım ama ortaya güzel bir eser çıktı.`,
            `Renk seçimi ve kompozisyon üzerine çok düşündüm. İşte sonuç!`,
            `Sanatla uğraşmak ruhumu dinlendiriyor. Bu challenge çok iyi geldi.`
        ],
        'Müzik': [
            `Gitar çalışmam tamamlandı. ${getRandomInt(30, 90)} dakika pratik yaptım. 🎸`,
            `Yeni bir şarkı öğrendim. Notalarla boğuşmak çok eğlenceliydi!`,
            `Vokal çalışması yaptım. Sesim gün geçtikçe gelişiyor.`,
            `Bugünkü müzik pratiğimi kaydettim. Kendinizi dinlemek çok ilginç bir deneyim.`,
            `Ritim çalışması tamamlandı. Metronom ile çalışmak işe yarıyor!`
        ],
        'Okuma': [
            `Bugün ${getRandomInt(50, 150)} sayfa okudum. Kitap çok sürükleyici! 📚`,
            `Bu kitabı bitirdim. Karakterler çok etkileyiciydi. Özet paylaşıyorum.`,
            `${getRandomInt(2, 4)} saat boyunca kitap okudum. Zaman nasıl geçti anlamadım.`,
            `Kitaptan aldığım notları paylaşıyorum. Çok şey öğrendim.`,
            `Bu bölüm çok etkileyiciydi. Favorilerim arasına girdi.`
        ],
        'Dil Öğrenme': [
            `Bugün ${getRandomInt(20, 50)} yeni kelime öğrendim. Tekrar tekrar yazarak ezberledim. 🌍`,
            `İngilizce pratik yaptım. Günlük konuşma cümleleri kurdum.`,
            `Gramer çalışması tamamlandı. Şimdiye kadar en zor konuydu ama hallettim!`,
            `Dinleme pratiği yaptım. Anlamaya başladıkça motivasyonum artıyor.`,
            `Bugünkü hedefim tamamlandı: ${getRandomInt(30, 60)} dakika dil pratiği.`
        ]
    };

    const categoryTemplates = templates[categoryName] || [
        `Challenge'a katılım ${getRandomInt(1, 10)}. Çok keyif alıyorum!`,
        `Bugünkü aktivitemi tamamladım. Hedefime yaklaşıyorum.`,
        `Çok güzel bir deneyim. Devam edeceğim!`,
        `Bu challenge sayesinde yeni şeyler öğreniyorum.`,
        `Motivasyonum çok yüksek. Devam!`
    ];

    return getRandomElement(categoryTemplates);
}

/**
 * Generate media URL based on category
 */
function generateMediaUrl(categoryName, index) {
    // Using placeholder images for realistic submissions
    const seed = Math.random().toString(36).substring(7);

    const mediaMap = {
        'Fitness': `https://picsum.photos/seed/fitness-${seed}/800/600`,
        'Fotoğrafçılık': `https://picsum.photos/seed/photo-${seed}/800/600`,
        'Yemek Pişirme': `https://picsum.photos/seed/food-${seed}/800/600`,
        'Sanat': `https://picsum.photos/seed/art-${seed}/800/600`,
        'Okuma': null, // Text only
        'Kodlama': `https://github.com/user/project-${seed}`,
        'Müzik': `https://www.youtube.com/watch?v=${seed}`,
        'Dil Öğrenme': null // Text only
    };

    return mediaMap[categoryName] || `https://picsum.photos/seed/${seed}/800/600`;
}

/**
 * Get media type based on category
 */
function getMediaType(categoryName, mediaUrl) {
    if (!mediaUrl) return 'metin';
    if (mediaUrl.includes('github')) return 'link';
    if (mediaUrl.includes('youtube')) return 'link';
    return 'resim';
}

/**
 * Generate AI score (60-95 for realistic quality)
 */
function generateAiScore() {
    return getRandomInt(60, 95);
}

/**
 * Generate AI recommendation based on score
 */
function generateAiRecommendation(score) {
    if (score >= 85) return 'approve';
    if (score >= 70) return 'approve';
    return 'manual';
}

/**
 * Generate AI reason based on score
 */
function generateAiReason(score) {
    if (score >= 85) {
        return getRandomElement([
            'Mükemmel içerik kalitesi. Challenge gereksinimlerini tam olarak karşılıyor.',
            'Çok detaylı ve özenli bir gönderi. Onaylanması önerilir.',
            'Yüksek kaliteli içerik. Topluluk için örnek teşkil edebilir.'
        ]);
    } else if (score >= 70) {
        return getRandomElement([
            'İyi kalitede içerik. Challenge kurallarına uygun.',
            'Kabul edilebilir seviyede gönderi. Onaylanabilir.',
            'Yeterli detay ve çaba gösterilmiş.'
        ]);
    } else {
        return getRandomElement([
            'Orta seviye içerik. Manuel inceleme önerilir.',
            'Detaylar eksik olabilir. İncelenmeli.',
            'Geliştirilmesi gereken yönleri var.'
        ]);
    }
}

/**
 * Get random status based on AI score
 */
function getSubmissionStatus(aiScore) {
    if (aiScore >= 80) {
        return Math.random() < 0.8 ? 'onaylandi' : 'beklemede';
    } else if (aiScore >= 65) {
        return Math.random() < 0.5 ? 'onaylandi' : 'beklemede';
    } else {
        return Math.random() < 0.3 ? 'onaylandi' : 'beklemede';
    }
}

/**
 * Bulk create submissions
 */
async function bulkCreateSubmissions() {
    console.log('🚀 Gönderi oluşturma başlatılıyor...\n');

    try {
        // Get active and completed participants with challenge details
        const [participants] = await pool.query(`
            SELECT
                p.user_id,
                p.challenge_id,
                u.username,
                c.title as challenge_title,
                c.description,
                cat.name as category_name
            FROM participants p
            JOIN users u ON p.user_id = u.id
            JOIN challenges c ON p.challenge_id = c.id
            JOIN categories cat ON c.category_id = cat.id
            WHERE p.status IN ('aktif', 'tamamlandi')
            ORDER BY RAND()
        `);

        console.log(`👥 Toplam katılımcı: ${participants.length}\n`);

        let totalCreated = 0;
        let totalSkipped = 0;

        for (let i = 0; i < participants.length; i++) {
            const participant = participants[i];

            // Each participant creates 2-4 submissions
            const submissionCount = getRandomInt(2, 4);

            let userCreated = 0;
            let userSkipped = 0;

            for (let j = 0; j < submissionCount; j++) {
                try {
                    // Check how many submissions this user already has for this challenge
                    const [existing] = await pool.query(
                        'SELECT COUNT(*) as count FROM submissions WHERE user_id = ? AND challenge_id = ?',
                        [participant.user_id, participant.challenge_id]
                    );

                    // Limit to max 4 submissions per user per challenge
                    if (existing[0].count >= 4) {
                        userSkipped++;
                        continue;
                    }

                    const content = generateSubmissionContent(
                        { title: participant.challenge_title, description: participant.description },
                        participant.category_name
                    );

                    const mediaUrl = generateMediaUrl(participant.category_name, j);
                    const mediaType = getMediaType(participant.category_name, mediaUrl);
                    const aiScore = generateAiScore();
                    const aiRecommendation = generateAiRecommendation(aiScore);
                    const aiReason = generateAiReason(aiScore);
                    const status = getSubmissionStatus(aiScore);
                    const pointsAwarded = status === 'onaylandi' ? Math.floor(aiScore * 0.8) : 0;

                    await pool.query(`
                        INSERT INTO submissions (
                            user_id, challenge_id, content, media_url, media_type,
                            status, points_awarded, ai_score, ai_reason, ai_recommendation,
                            created_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                    `, [
                        participant.user_id,
                        participant.challenge_id,
                        content,
                        mediaUrl,
                        mediaType,
                        status,
                        pointsAwarded,
                        aiScore,
                        aiReason,
                        aiRecommendation
                    ]);

                    userCreated++;
                } catch (error) {
                    userSkipped++;
                    console.log(`⚠️  ${participant.username} - Gönderi ${j + 1} eklenemedi: ${error.message}`);
                }
            }

            totalCreated += userCreated;
            totalSkipped += userSkipped;

            if ((i + 1) % 20 === 0 || i === participants.length - 1) {
                console.log(`✅ ${i + 1}/${participants.length} işlendi - Toplam eklenen: ${totalCreated}`);
            }
        }

        console.log('\n📊 Özet:');
        console.log(`✅ Oluşturulan gönderi: ${totalCreated}`);
        console.log(`⚠️  Atlanan: ${totalSkipped}`);

        // Get submission statistics
        const [stats] = await pool.query(`
            SELECT
                status,
                COUNT(*) as count,
                ROUND(AVG(ai_score), 1) as avg_score
            FROM submissions
            GROUP BY status
        `);

        console.log('\n📊 Gönderi Durumları:');
        stats.forEach(stat => {
            const emoji = stat.status === 'onaylandi' ? '✅' : stat.status === 'beklemede' ? '⏳' : '❌';
            console.log(`${emoji} ${stat.status}: ${stat.count} gönderi (Ort. AI Score: ${stat.avg_score})`);
        });

        // Category breakdown
        const [categoryStats] = await pool.query(`
            SELECT
                cat.name,
                COUNT(s.id) as submission_count
            FROM submissions s
            JOIN challenges c ON s.challenge_id = c.id
            JOIN categories cat ON c.category_id = cat.id
            GROUP BY cat.name
            ORDER BY submission_count DESC
        `);

        console.log('\n📊 Kategorilere Göre Gönderiler:');
        categoryStats.forEach(stat => {
            console.log(`${stat.name}: ${stat.submission_count} gönderi`);
        });

        console.log('\n');

    } catch (error) {
        console.error('❌ Kritik hata:', error);
        throw error;
    }
}

// Run the script
bulkCreateSubmissions()
    .then(() => {
        console.log('✅ İşlem tamamlandı');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Hata:', error);
        process.exit(1);
    });
