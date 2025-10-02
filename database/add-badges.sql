-- Badge Sistemi Migration
-- Tarih: 2025-10-02

-- badges tablosu (sabit badge tanımları)
CREATE TABLE IF NOT EXISTS badges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(10) NOT NULL,
    type VARCHAR(50) NOT NULL COMMENT 'challenge_complete, submission_count, like_count, comment_count, team_create',
    condition_value INT NOT NULL COMMENT 'Badge için gerekli değer (örn: 10 gönderi)',
    rarity VARCHAR(20) DEFAULT 'common' COMMENT 'common, rare, epic, legendary',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_type_value (type, condition_value)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- user_badges tablosu (kullanıcıların kazandığı badge'ler)
CREATE TABLE IF NOT EXISTS user_badges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    badge_id INT NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_badge (user_id, badge_id),
    INDEX idx_user (user_id),
    INDEX idx_badge (badge_id),
    INDEX idx_earned (earned_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Badge tanımlarını ekle
INSERT INTO badges (name, description, icon, type, condition_value, rarity) VALUES
('İlk Adım', 'İlk challenge\'ını tamamla', '🎯', 'challenge_complete', 1, 'common'),
('Challenge Master', '5 challenge tamamla', '🏆', 'challenge_complete', 5, 'rare'),
('Challenge Efsanesi', '10 challenge tamamla', '👑', 'challenge_complete', 10, 'epic'),

('Aktif Katılımcı', '10 gönderi yap', '📸', 'submission_count', 10, 'common'),
('İçerik Üreticisi', '50 gönderi yap', '🎬', 'submission_count', 50, 'rare'),
('İçerik Kraliçesi', '100 gönderi yap', '⭐', 'submission_count', 100, 'epic'),

('Popüler', '100 beğeni topla', '❤️', 'like_count', 100, 'common'),
('Yıldız', '500 beğeni topla', '🌟', 'like_count', 500, 'rare'),
('Süperstar', '1000 beğeni topla', '💎', 'like_count', 1000, 'epic'),

('Sosyal Kelebek', '100 yorum yaz', '💬', 'comment_count', 100, 'common'),
('Konuşkan', '500 yorum yaz', '🗣️', 'comment_count', 500, 'rare'),

('Takım Lideri', 'İlk takımını kur', '👥', 'team_create', 1, 'common'),
('Takım Ustası', '5 takım kur', '👨‍👩‍👧‍👦', 'team_create', 5, 'rare');
