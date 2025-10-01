-- Meydan Okumalar için seed data
-- Önce bir sistem kullanıcısı oluştur (eğer yoksa)
INSERT INTO users (username, email, password, full_name, points)
VALUES ('sistem', 'sistem@haydihepberaber.com', '$2b$10$dummyhash', 'Sistem Yöneticisi', 0)
ON DUPLICATE KEY UPDATE id=id;

-- Sistem kullanıcısının ID'sini al
SET @creator_id = (SELECT id FROM users WHERE username = 'sistem');

-- 10 Meydan Okuma Ekle

-- 1. 30 Günde 10.000 Adım
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
    prize_description
) VALUES (
    '30 Günde 10.000 Adım',
    'Her gün 10.000 adım yürüyerek sağlıklı yaşam alışkanlığı kazanın. Telefonunuzdaki adım sayar uygulamasını kullanarak günlük ilerlemenizi takip edin ve paylaşın.',
    (SELECT id FROM categories WHERE slug = 'fitness'),
    @creator_id,
    'kolay',
    100,
    DATE_ADD(NOW(), INTERVAL 1 DAY),
    DATE_ADD(NOW(), INTERVAL 31 DAY),
    'aktif',
    '- Her gün en az 10.000 adım atın\n- Adım sayar uygulaması ekran görüntüsünü paylaşın\n- Günlük güncellemeler yapın',
    'Tamamlayanlar arasında spor malzemesi hediye çeki çekilişi'
);

-- 2. İstanbul'un Gizli Köşeleri
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
    prize_description
) VALUES (
    'İstanbul\'un Gizli Köşeleri',
    'İstanbul\'un turistik olmayan, yerel halkın bildiği özel yerlerini keşfedin ve fotoğraflayın. Her fotoğrafla birlikte o yerin hikayesini paylaşın.',
    (SELECT id FROM categories WHERE slug = 'fotograf'),
    @creator_id,
    'orta',
    250,
    DATE_ADD(NOW(), INTERVAL 1 DAY),
    DATE_ADD(NOW(), INTERVAL 21 DAY),
    'aktif',
    '- En az 7 farklı gizli köşe fotoğraflayın\n- Her fotoğraf için konum ve hikaye ekleyin\n- Turistik mekanlar kabul edilmez',
    'En iyi fotoğraf serisi sahibine fotoğraf kitabı'
);

-- 3. Türkçe Açık Kaynak Projeye Katkı
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
    prize_description
) VALUES (
    'Türkçe Açık Kaynak Projeye Katkı',
    'GitHub\'da Türkçe bir açık kaynak projeye kod, dokümantasyon veya çeviri katkısı yapın. Açık kaynak dünyasına ilk adımınızı atın!',
    (SELECT id FROM categories WHERE slug = 'yazilim'),
    @creator_id,
    'zor',
    500,
    DATE_ADD(NOW(), INTERVAL 1 DAY),
    DATE_ADD(NOW(), INTERVAL 30 DAY),
    'aktif',
    '- GitHub\'da Türkçe bir projeye Pull Request gönderin\n- Merge edilmiş PR linkini paylaşın\n- Katkı türü: kod, dokümantasyon veya çeviri olabilir',
    'En değerli katkı sahibine teknoloji konferansı bileti'
);

-- 4. 7 Günde 7 Türk Yemeği
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
    prize_description
) VALUES (
    '7 Günde 7 Türk Yemeği',
    'Her gün farklı bir geleneksel Türk yemeği pişirin ve tarifini paylaşın. İmam Bayıldı, Mantı, Kuru Fasulye ve daha fazlası!',
    (SELECT id FROM categories WHERE slug = 'yemek'),
    @creator_id,
    'orta',
    200,
    DATE_ADD(NOW(), INTERVAL 1 DAY),
    DATE_ADD(NOW(), INTERVAL 8 DAY),
    'aktif',
    '- 7 gün boyunca her gün farklı bir Türk yemeği yapın\n- Yemeğin fotoğrafını ve tarifini paylaşın\n- Her yemek geleneksel Türk mutfağından olmalı',
    'En lezzetli sunumlar için mutfak gereçleri seti'
);

-- 5. Ebru Sanatı ile Tanış
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
    prize_description
) VALUES (
    'Ebru Sanatı ile Tanış',
    'Türk kültürünün önemli sanatlarından Ebru sanatını öğrenin ve kendi eserinizi oluşturun. Geleneksel sanatları modern hayata taşıyın.',
    (SELECT id FROM categories WHERE slug = 'sanat'),
    @creator_id,
    'orta',
    300,
    DATE_ADD(NOW(), INTERVAL 1 DAY),
    DATE_ADD(NOW(), INTERVAL 15 DAY),
    'aktif',
    '- Ebru sanatı tekniğini öğrenin (online veya atölye)\n- En az 3 ebru çalışması yapın\n- Çalışmalarınızın fotoğraflarını paylaşın',
    'En güzel ebru çalışmasına sanat malzemeleri seti'
);

-- 6. Bağlama ile İlk Şarkım
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
    prize_description
) VALUES (
    'Bağlama ile İlk Şarkım',
    'Geleneksel Türk enstrümanı bağlamayı çalmayı öğrenin ve basit bir türküyü seslendirebilir hale gelin.',
    (SELECT id FROM categories WHERE slug = 'muzik'),
    @creator_id,
    'zor',
    450,
    DATE_ADD(NOW(), INTERVAL 1 DAY),
    DATE_ADD(NOW(), INTERVAL 45 DAY),
    'aktif',
    '- Bağlama çalmayı öğrenin (online kurs veya özel ders)\n- Basit bir türküyü çalabilir hale gelin\n- Performansınızın videosunu paylaşın',
    'En başarılı performansa müzik mağazası hediye çeki'
);

-- 7. Ayda Bir Kitap - Türk Edebiyatı
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
    prize_description
) VALUES (
    'Ayda Bir Kitap - Türk Edebiyatı',
    'Her ay bir Türk edebiyatı klasiği okuyun. Sabahattin Ali, Orhan Pamuk, Yaşar Kemal ve daha fazlası sizi bekliyor!',
    (SELECT id FROM categories WHERE slug = 'okuma'),
    @creator_id,
    'kolay',
    150,
    DATE_ADD(NOW(), INTERVAL 1 DAY),
    DATE_ADD(NOW(), INTERVAL 31 DAY),
    'aktif',
    '- Türk edebiyatından bir klasik eser seçin\n- Ayda en az 1 kitap okuyun\n- Kitap hakkında kısa bir değerlendirme yazın',
    'En ilginç değerlendirmeye kitap seti hediyesi'
);

-- 8. 21 Günde 500 İngilizce Kelime
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
    prize_description
) VALUES (
    '21 Günde 500 İngilizce Kelime',
    '21 gün boyunca her gün 25 yeni İngilizce kelime öğrenin ve cümlelerde kullanın. Kelime dağarcığınızı genişletin!',
    (SELECT id FROM categories WHERE slug = 'dil'),
    @creator_id,
    'orta',
    250,
    DATE_ADD(NOW(), INTERVAL 1 DAY),
    DATE_ADD(NOW(), INTERVAL 22 DAY),
    'aktif',
    '- Her gün 25 yeni kelime öğrenin\n- Öğrendiğiniz kelimeleri cümlelerde kullanın\n- Günlük ilerleme kaydı paylaşın',
    'En kararlı katılımcıya online dil kursu üyeliği'
);

-- 9. Sıfır Atık Haftası
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
    prize_description
) VALUES (
    'Sıfır Atık Haftası',
    '7 gün boyunca plastik kullanmadan yaşayın, yerel pazardan alışveriş yapın ve çevreye duyarlı bir yaşam sürün.',
    (SELECT id FROM categories WHERE slug = 'fitness'),
    @creator_id,
    'kolay',
    120,
    DATE_ADD(NOW(), INTERVAL 1 DAY),
    DATE_ADD(NOW(), INTERVAL 8 DAY),
    'aktif',
    '- 7 gün plastik kullanmayın\n- Kendi bez çantanızla alışveriş yapın\n- Günlük deneyimlerinizi fotoğraflarla paylaşın',
    'En yaratıcı çözümlere çevre dostu ürün seti'
);

-- 10. 7 Bölge 7 Fotoğraf
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
    prize_description
) VALUES (
    '7 Bölge 7 Fotoğraf',
    'Türkiye\'nin 7 coğrafi bölgesinden birer fotoğraf çekin ve her bölgenin özel hikayesini paylaşın. Ülkemizi yeniden keşfedin!',
    (SELECT id FROM categories WHERE slug = 'fotograf'),
    @creator_id,
    'zor',
    600,
    DATE_ADD(NOW(), INTERVAL 1 DAY),
    DATE_ADD(NOW(), INTERVAL 60 DAY),
    'aktif',
    '- Her coğrafi bölgeden bir fotoğraf çekin\n- Fotoğraflarla birlikte o bölgenin hikayesini anlatın\n- Toplam 7 bölgenin tamamını kapsayın',
    'En etkileyici fotoğraf serisine profesyonel kamera'
);

-- Başarı mesajı
SELECT 'Meydan okumalar başarıyla eklendi!' as Sonuc;
SELECT COUNT(*) as 'Toplam Aktif Meydan Okuma' FROM challenges WHERE status = 'aktif';
