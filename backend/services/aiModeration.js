const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/**
 * Kategoriye göre özel kurallar ve esneklik seviyeleri
 */
const CATEGORY_GUIDELINES = {
    'fitness': {
        flexibility: 'high',
        acceptableProof: 'Fitness tracker ekran görüntüleri (Apple Watch, Fitbit, Strava, Google Fit, Huawei Health vb.), egzersiz fotoğrafları, gym check-in\'leri, aktivite görselleri kabul edilir. Spesifik uygulama şartı yoktur.',
        minScore: 50
    },
    'fotograf': {
        flexibility: 'medium',
        acceptableProof: 'Orijinal fotoğraflar, kompozisyon ve teknik kalite önemlidir. Konu ve içerik challenge kurallarına uygun olmalıdır.',
        minScore: 60
    },
    'yazilim': {
        flexibility: 'medium',
        acceptableProof: 'Kod ekran görüntüleri, GitHub commit\'leri, proje görselleri, terminal çıktıları kabul edilir.',
        minScore: 65
    },
    'yemek': {
        flexibility: 'high',
        acceptableProof: 'Yemek fotoğrafları, sunum görselleri, pişirme süreçleri kabul edilir. Profesyonel fotoğraf kalitesi gerekmez.',
        minScore: 50
    },
    'sanat': {
        flexibility: 'high',
        acceptableProof: 'Sanat eserleri, çizimler, resimler, dijital artwork kabul edilir. Yaratıcılık önemlidir.',
        minScore: 55
    },
    'muzik': {
        flexibility: 'high',
        acceptableProof: 'Müzik videoları, kayıt ekran görüntüleri, enstrüman fotoğrafları, performans videoları kabul edilir.',
        minScore: 50
    },
    'okuma': {
        flexibility: 'medium',
        acceptableProof: 'Kitap fotoğrafları, okuma listesi ekran görüntüleri, alıntılar, notlar kabul edilir.',
        minScore: 60
    },
    'dil': {
        flexibility: 'medium',
        acceptableProof: 'Dil öğrenme uygulaması ekran görüntüleri (Duolingo, Babbel vb.), pratik videoları, sertifikalar kabul edilir.',
        minScore: 60
    },
    'default': {
        flexibility: 'medium',
        acceptableProof: 'Challenge kurallarına uygun her türlü içerik kabul edilir.',
        minScore: 60
    }
};

/**
 * AI ile içerik moderasyonu
 * @param {string} content - İçerik metni
 * @param {string} mediaUrl - Medya URL'i (opsiyonel)
 * @param {string} challengeRules - Challenge kuralları
 * @param {string} categorySlug - Kategori slug (fitness, fotograf, vb.)
 * @param {string} challengeTitle - Challenge başlığı
 * @returns {Promise<{approved: boolean, reason: string, score: number}>}
 */
async function moderateSubmission(content, mediaUrl = null, challengeRules = null, categorySlug = 'default', challengeTitle = '') {
    try {
        console.log('🤖 AI Moderation başlatılıyor...');

        // 1. Metin moderasyonu (OpenAI Moderation API)
        const moderationResult = await openai.moderations.create({
            input: content || ''
        });

        const result = moderationResult.results[0];

        // Uygunsuz içerik var mı?
        if (result.flagged) {
            const categories = Object.entries(result.categories)
                .filter(([_, flagged]) => flagged)
                .map(([category]) => category);

            return {
                approved: false,
                reason: `Uygunsuz içerik tespit edildi: ${categories.join(', ')}`,
                score: 0,
                categories: result.categories
            };
        }

        // 2. Challenge kurallarına uygunluk kontrolü (GPT-4 - Kategoriye göre esnek)
        if (challengeRules && content) {
            // Kategori kurallarını al
            const categoryGuideline = CATEGORY_GUIDELINES[categorySlug] || CATEGORY_GUIDELINES['default'];

            console.log(`🏷️ Kategori: ${categorySlug} (Esneklik: ${categoryGuideline.flexibility})`);

            const complianceCheck = await openai.chat.completions.create({
                model: 'gpt-4o-mini', // Daha ekonomik model
                messages: [
                    {
                        role: 'system',
                        content: `Sen bir meydan okuma değerlendirme asistanısın. Kullanıcının gönderisini ${categorySlug} kategorisi için değerlendir.

📋 Challenge Bilgileri:
- Başlık: ${challengeTitle}
- Kurallar: ${challengeRules}

🎯 Kategori: ${categorySlug}
- Esneklik Seviyesi: ${categoryGuideline.flexibility}
- Kabul Edilebilir Kanıtlar: ${categoryGuideline.acceptableProof}
- Minimum Kalite Skoru: ${categoryGuideline.minScore}

⚠️ ÖNEMLİ DEĞERLENDİRME PRENSİPLERİ:
1. ${categoryGuideline.flexibility === 'high' ? 'YÜKSEK ESNEKLİK: Kullanıcı farklı araçlar/uygulamalar kullanabilir. Önemli olan niyet ve çabadır.' : categoryGuideline.flexibility === 'medium' ? 'ORTA ESNEKLİK: Kurallara genel uyum yeterlidir, detaylara takılma.' : 'NORMAL DEĞERLENDİRME: Kurallara uygunluk kontrol et.'}
2. Challenge kurallarındaki spesifik uygulama isimleri ÖRNEK amaçlıdır - alternatif uygulamalar/yöntemler kabul edilir
3. Kullanıcının çabası ve niyeti açıkça görülüyorsa OLUMLU değerlendir
4. Küçük kusurlar veya farklı yaklaşımlar için puan düşür, ama reddetme
5. Sadece açıkça kuraldışı, alakasız veya hileli içerikleri reddet

Yanıtını JSON formatında ver:
{
  "compliant": true/false,
  "reason": "açıklama (Türkçe, kullanıcı dostu)",
  "qualityScore": ${categoryGuideline.minScore}-100 arası puan
}`
                    },
                    {
                        role: 'user',
                        content: `Gönderi içeriği: "${content}"`
                    }
                ],
                response_format: { type: "json_object" },
                temperature: 0.3
            });

            const compliance = JSON.parse(complianceCheck.choices[0].message.content);

            // Minimum skor kontrolü
            const minScore = categoryGuideline.minScore;

            if (!compliance.compliant) {
                return {
                    approved: false,
                    reason: compliance.reason || 'Challenge kurallarına uygun değil',
                    score: Math.max(compliance.qualityScore || 0, 0)
                };
            }

            // Başarılı! Kalite puanı ile onayla
            return {
                approved: true,
                reason: compliance.reason || 'İçerik uygun ve kurallara uyumlu',
                score: Math.max(compliance.qualityScore || minScore, minScore)
            };
        }

        // Challenge kuralı yoksa sadece moderation ile onayla
        return {
            approved: true,
            reason: 'İçerik uygun',
            score: 80
        };

    } catch (error) {
        console.error('AI Moderation hatası:', error);

        // Hata durumunda manuel onay için beklemede bırak
        return {
            approved: null, // null = manuel kontrol gerekli
            reason: 'AI analizi başarısız, manuel kontrol gerekli',
            score: 0,
            error: error.message
        };
    }
}

/**
 * İçerik kalitesine göre puan hesapla
 * @param {number} basePoints - Challenge'ın temel puanı
 * @param {number} qualityScore - AI'ın verdiği kalite skoru (0-100)
 * @param {number} difficultyMultiplier - Zorluk çarpanı (1.0, 1.5, 2.0)
 * @returns {number}
 */
function calculatePoints(basePoints, qualityScore, difficultyMultiplier = 1.0) {
    // Kalite skoru 60'ın altındaysa puan ver ama düşük
    if (qualityScore < 60) {
        return Math.floor(basePoints * 0.5 * difficultyMultiplier);
    }

    // Kalite bonusu: 60-100 arası normalize et (0.5-1.5 arası bonus)
    const qualityBonus = 0.5 + ((qualityScore - 60) / 40);

    return Math.floor(basePoints * qualityBonus * difficultyMultiplier);
}

module.exports = {
    moderateSubmission,
    calculatePoints
};
