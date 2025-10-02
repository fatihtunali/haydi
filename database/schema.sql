-- Veritabanı oluştur
CREATE DATABASE IF NOT EXISTS haydihepberaber CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE haydihepberaber;

-- Kullanıcılar tablosu
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    avatar_url VARCHAR(255),
    bio TEXT,
    points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_points (points)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Challenge kategorileri
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Challenge'lar tablosu
CREATE TABLE IF NOT EXISTS challenges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category_id INT,
    creator_id INT NOT NULL,
    difficulty ENUM('kolay', 'orta', 'zor') DEFAULT 'orta',
    points INT DEFAULT 100,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    max_participants INT DEFAULT NULL,
    status ENUM('taslak', 'aktif', 'bitti', 'iptal') DEFAULT 'taslak',
    rules TEXT,
    prize_description TEXT,
    image_url VARCHAR(255),
    is_team_based BOOLEAN DEFAULT FALSE,
    min_team_size INT DEFAULT 1,
    max_team_size INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_start_date (start_date),
    INDEX idx_end_date (end_date),
    INDEX idx_category (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Takımlar tablosu
CREATE TABLE IF NOT EXISTS teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    challenge_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    captain_id INT NOT NULL,
    total_points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
    FOREIGN KEY (captain_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_challenge (challenge_id),
    INDEX idx_points (total_points)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Challenge katılımcıları
CREATE TABLE IF NOT EXISTS participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    challenge_id INT NOT NULL,
    user_id INT NOT NULL,
    team_id INT DEFAULT NULL,
    status ENUM('beklemede', 'aktif', 'tamamlandi', 'vazgecti') DEFAULT 'aktif',
    points_earned INT DEFAULT 0,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
    UNIQUE KEY unique_participation (challenge_id, user_id),
    INDEX idx_challenge (challenge_id),
    INDEX idx_user (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Gönderi/Submission tablosu
CREATE TABLE IF NOT EXISTS submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    challenge_id INT NOT NULL,
    user_id INT NOT NULL,
    team_id INT DEFAULT NULL,
    content TEXT,
    location VARCHAR(255) DEFAULT NULL,
    media_url VARCHAR(255),
    media_type ENUM('resim', 'video', 'link', 'metin') DEFAULT 'metin',
    status ENUM('beklemede', 'onaylandi', 'reddedildi') DEFAULT 'beklemede',
    points_awarded INT DEFAULT 0,
    likes_count INT DEFAULT 0,
    ai_score INT DEFAULT NULL COMMENT 'AI kalite skoru (0-100)',
    ai_reason TEXT DEFAULT NULL COMMENT 'AI analiz açıklaması',
    ai_recommendation ENUM('approve', 'reject', 'manual') DEFAULT NULL COMMENT 'AI önerisi',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
    INDEX idx_challenge (challenge_id),
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at),
    INDEX idx_ai_recommendation (ai_recommendation)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Beğeniler
CREATE TABLE IF NOT EXISTS likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_like (submission_id, user_id),
    INDEX idx_submission (submission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Yorumlar
CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_submission (submission_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bildirimler
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    link VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_read (is_read),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Başlangıç kategorileri ekle
INSERT INTO categories (name, slug, description, icon) VALUES
('Fitness', 'fitness', '30 günlük fitness challenge\'ları', '💪'),
('Fotoğrafçılık', 'fotograf', 'Günlük fotoğraf challenge\'ları', '📸'),
('Yazılım', 'yazilim', 'Kod yazma ve geliştirme challenge\'ları', '💻'),
('Yemek', 'yemek', 'Yemek yapma ve sunum challenge\'ları', '🍳'),
('Sanat', 'sanat', 'Çizim, resim ve yaratıcı sanat challenge\'ları', '🎨'),
('Müzik', 'muzik', 'Müzik yapma ve paylaşma challenge\'ları', '🎵'),
('Okuma', 'okuma', 'Kitap okuma ve paylaşma challenge\'ları', '📚'),
('Dil Öğrenme', 'dil', 'Yabancı dil öğrenme challenge\'ları', '🗣️');
