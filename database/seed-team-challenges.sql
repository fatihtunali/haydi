-- Takım Challenge'ları
-- Başlangıç: 15 Ekim 2025
-- Bitiş: 14 Kasım 2025 (30 gün)

USE haydihepberaber;

-- Admin kullanıcısının ID'sini al (creator olarak)
SET @admin_id = (SELECT id FROM users WHERE role = 'admin' LIMIT 1);

-- Admin yoksa ilk kullanıcıyı kullan
SET @admin_id = IFNULL(@admin_id, 1);

-- Kategori ID'lerini al
SET @yemek_id = (SELECT id FROM categories WHERE slug = 'yemek');
SET @muzik_id = (SELECT id FROM categories WHERE slug = 'muzik');
SET @fitness_id = (SELECT id FROM categories WHERE slug = 'fitness');
SET @fotograf_id = (SELECT id FROM categories WHERE slug = 'fotograf');
SET @sanat_id = (SELECT id FROM categories WHERE slug = 'sanat');

-- Takım Challenge'ları Ekle
INSERT INTO challenges (
    title,
    description,
    category_id,
    creator_id,
    difficulty,
    points,
    start_date,
    end_date,
    status,
    rules,
    is_team_based,
    min_team_size,
    max_team_size,
    image_url
) VALUES

-- 1. Sokak Lezzetleri Turu
(
    'Sokak Lezzetleri Turu',
    'Takım halinde farklı sokak lezzetleri (midye, kokoreç, tantuni, kestane vb.) tadın, hepsini tek videoda birleştirin.',
    @yemek_id,
    @admin_id,
    'orta',
    200,
    '2025-10-15 00:00:00',
    '2025-11-14 23:59:59',
    'aktif',
    'En az 3 farklı sokak lezzeti tatmanız gerekiyor. Her lezzeti tadıma anınızı videoya kaydedin ve tek bir videoda birleştirin. Video minimum 2 dakika olmalı.',
    TRUE,
    2,
    5,
    NULL
),

-- 2. Takım Koreografisi
(
    'Takım Koreografisi',
    'Basit bir TikTok/Instagram dansı veya eğlenceli hareketli koreografi öğrenip meydanda, parkta ya da ofiste birlikte sergileyin.',
    @muzik_id,
    @admin_id,
    'orta',
    250,
    '2025-10-15 00:00:00',
    '2025-11-14 23:59:59',
    'aktif',
    'Popüler bir dans koreografisi seçin ve takım olarak öğrenin. Açık alanda (meydan, park) ya da ofiste çekim yapın. Video minimum 1 dakika olmalı.',
    TRUE,
    3,
    10,
    NULL
),

-- 3. Takım Spor Meydan Okuması
(
    'Takım Spor Meydan Okuması',
    '3''e 3 basket, 5''e 5 mini futbol ya da plaj voleybolu maçı. Skor ikinci planda, eğlence ön planda.',
    @fitness_id,
    @admin_id,
    'kolay',
    180,
    '2025-10-15 00:00:00',
    '2025-11-14 23:59:59',
    'aktif',
    'Basket, futbol veya voleybol gibi takım sporlarından birini seçin. Minimum 6 kişi (3''e 3) olmalı. Maçtan eğlenceli anları ve final skorunu videoya kaydedin.',
    TRUE,
    6,
    10,
    NULL
),

-- 4. Şehir Simge Avı
(
    'Şehir Simge Avı',
    'Takımı bölüp şehrin sembolik noktalarında (kule, köprü, heykel, meydan) fotoğraf/video çekip birleştirin. Küçük bir ''şehir maratonu'' havası olur.',
    @fotograf_id,
    @admin_id,
    'orta',
    220,
    '2025-10-15 00:00:00',
    '2025-11-14 23:59:59',
    'aktif',
    'Şehrinizin en az 5 sembolik noktasında takım fotoğrafı çekin. Her noktada tüm takım görünmeli. Fotoğrafları tek bir kolaj/video halinde paylaşın.',
    TRUE,
    3,
    8,
    NULL
),

-- 5. Birlikte Yemek Yap
(
    'Birlikte Yemek Yap',
    'Takımca tek bir yemeği (ör. kocaman bir lahmacun tepsisi ya da dev menemen) yapın ve videosunu hızlandırılmış ''mutfak kaosu'' gibi paylaşın.',
    @yemek_id,
    @admin_id,
    'kolay',
    190,
    '2025-10-15 00:00:00',
    '2025-11-14 23:59:59',
    'aktif',
    'Takım olarak tek bir yemek seçin ve birlikte hazırlayın. Hazırlık sürecini videoya kaydedin. Timelapse veya hızlandırılmış video olarak paylaşın. Sonunda yemeğin tadımı olmalı.',
    TRUE,
    2,
    6,
    NULL
),

-- 6. Flashmob Tarzı Şarkı Söyleme
(
    'Flashmob Tarzı Şarkı Söyleme',
    'Bir parkta veya kafede topluca aynı şarkıyı söyleyin. Şaşkın bakışlar da videonun eğlencesi olur.',
    @muzik_id,
    @admin_id,
    'zor',
    280,
    '2025-10-15 00:00:00',
    '2025-11-14 23:59:59',
    'aktif',
    'Herkesin bildiği popüler bir şarkı seçin. Park, kafe veya kalabalık bir yerde sürpriz flashmob yapın. Etraftaki insanların tepkilerini de videoya alın. Minimum 2 dakika sürmeli.',
    TRUE,
    4,
    15,
    NULL
),

-- 7. Doğa Temizliği
(
    'Doğa Temizliği',
    'Bir sahil ya da ormanlık alanda takımca çöp toplayın. Öncesi/sonrası fotoğrafı çok etkileyici olur.',
    @sanat_id,
    @admin_id,
    'kolay',
    300,
    '2025-10-15 00:00:00',
    '2025-11-14 23:59:59',
    'aktif',
    'Sahil, orman veya park gibi bir doğal alanda çöp toplama etkinliği düzenleyin. Başlamadan önce ve temizlik sonrası karşılaştırma fotoğrafları çekin. Toplanan çöp miktarını gösterin.',
    TRUE,
    3,
    20,
    NULL
),

-- 8. Kıyafet Değişim Videosu
(
    'Kıyafet Değişim Videosu',
    'Takımdaki herkes önce sıradan günlük kıyafetlerle video başlar, sonra aynı anda şık/tuhaf/kostümlü halleriyle devam eder.',
    @sanat_id,
    @admin_id,
    'orta',
    210,
    '2025-10-15 00:00:00',
    '2025-11-14 23:59:59',
    'aktif',
    'Tüm takım üyeleri günlük kıyafetlerle başlayıp, ani geçişle şık/kostümlü kıyafetlere dönüşüyor. TikTok/Instagram formatında çekin. Müzik ve geçiş efektleri kullanın.',
    TRUE,
    3,
    8,
    NULL
),

-- 9. Takım Puzzle / Lego Yapbozu
(
    'Takım Puzzle / Lego Yapbozu',
    'Bir masa etrafında hızlıca puzzle ya da lego seti tamamlamaya çalışın, timelapse video çekin.',
    @sanat_id,
    @admin_id,
    'orta',
    170,
    '2025-10-15 00:00:00',
    '2025-11-14 23:59:59',
    'aktif',
    'En az 500 parçalık puzzle veya orta boy Lego set seçin. Baştan sona tamamlama sürecini timelapse video olarak kaydedin. Sonunda tamamlanmış hali gösterilmeli.',
    TRUE,
    2,
    6,
    NULL
),

-- 10. Dayanışma Görevi
(
    'Dayanışma Görevi',
    'Bir huzurevi, çocuk esirgeme kurumu veya hayvan barınağını ziyaret edip birlikte katkı sağlayın. Hem sosyal fayda hem güzel içerik üretimi olur.',
    @sanat_id,
    @admin_id,
    'orta',
    350,
    '2025-10-15 00:00:00',
    '2025-11-14 23:59:59',
    'aktif',
    'Huzurevi, çocuk yurdu veya hayvan barınağı gibi bir kurumu ziyaret edin. Yardım aktivitelerinizi ve mutlu anları fotoğraf/video ile belgeleyin. Kurumun izni alınmalı.',
    TRUE,
    3,
    10,
    NULL
);

SELECT CONCAT('✅ ', COUNT(*), ' takım challenge''ı eklendi!') as sonuc
FROM challenges
WHERE is_team_based = TRUE
AND start_date = '2025-10-15 00:00:00';
