const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/**
 * AI ile içerik moderasyonu
 * @param {string} content - İçerik metni
 * @param {string} mediaUrl - Medya URL'i (opsiyonel)
 * @returns {Promise<{approved: boolean, reason: string, score: number}>}
 */
async function moderateSubmission(content, mediaUrl = null, challengeRules = null) {
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

        // 2. Challenge kurallarına uygunluk kontrolü (GPT-4)
        if (challengeRules && content) {
            const complianceCheck = await openai.chat.completions.create({
                model: 'gpt-4o-mini', // Daha ekonomik model
                messages: [
                    {
                        role: 'system',
                        content: `Sen bir meydan okuma değerlendirme asistanısın. Kullanıcının gönderisinin challenge kurallarına uyup uymadığını kontrol et.

Kurallar:
${challengeRules}

Yanıtını JSON formatında ver:
{
  "compliant": true/false,
  "reason": "açıklama",
  "qualityScore": 1-100 arası puan
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

            if (!compliance.compliant) {
                return {
                    approved: false,
                    reason: compliance.reason || 'Challenge kurallarına uygun değil',
                    score: compliance.qualityScore || 0
                };
            }

            // Başarılı! Kalite puanı ile onayla
            return {
                approved: true,
                reason: 'İçerik uygun ve kurallara uyumlu',
                score: compliance.qualityScore || 80
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
