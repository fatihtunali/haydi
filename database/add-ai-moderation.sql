-- AI Moderation kolonlarını submissions tablosuna ekle

USE haydihepberaber;

-- AI analiz sonuçları için yeni kolonlar
ALTER TABLE submissions
ADD COLUMN ai_score INT DEFAULT NULL COMMENT 'AI kalite skoru (0-100)',
ADD COLUMN ai_reason TEXT DEFAULT NULL COMMENT 'AI analiz açıklaması',
ADD COLUMN ai_recommendation ENUM('approve', 'reject', 'manual') DEFAULT NULL COMMENT 'AI önerisi';

-- Index ekle
ALTER TABLE submissions
ADD INDEX idx_ai_recommendation (ai_recommendation);

-- Mevcut verileri güncelle (opsiyonel)
-- UPDATE submissions SET ai_recommendation = 'manual' WHERE status = 'beklemede';
