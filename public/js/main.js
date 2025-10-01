// Ana sayfa için JavaScript

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', async () => {
    await loadCategories();
    await loadFeaturedChallenges();
    await loadStats();
});

// Kategorileri yükle
async function loadCategories() {
    const categoriesGrid = document.getElementById('categoriesGrid');
    if (!categoriesGrid) return;

    showLoading(categoriesGrid);

    try {
        const data = await ChallengeAPI.getCategories();
        const categories = data.categories;

        if (categories.length === 0) {
            showEmptyState(categoriesGrid, '📁', 'Henüz kategori yok');
            return;
        }

        categoriesGrid.innerHTML = categories.map(cat => `
            <a href="/challenges?category=${cat.slug}" style="display: flex; align-items: center; gap: 0.75rem; padding: 1rem; background: var(--card-bg); border-radius: 12px; text-decoration: none; transition: all 0.3s; border: 2px solid transparent;">
                <div style="font-size: 2rem; line-height: 1;">${cat.icon}</div>
                <div style="font-weight: 600; color: var(--text); font-size: 1rem;">${cat.name}</div>
            </a>
        `).join('');

    } catch (error) {
        console.error('Kategori yükleme hatası:', error);
        categoriesGrid.innerHTML = `<p>Kategoriler yüklenemedi</p>`;
    }
}

// Öne çıkan challenge'ları yükle
async function loadFeaturedChallenges() {
    const featuredChallenges = document.getElementById('featuredChallenges');
    if (!featuredChallenges) return;

    showLoading(featuredChallenges);

    try {
        const data = await ChallengeAPI.getAll({ status: 'aktif', limit: 8 });
        const challenges = data.challenges;

        if (challenges.length === 0) {
            showEmptyState(featuredChallenges, '🎯', 'Henüz aktif meydan okuma yok');
            return;
        }

        featuredChallenges.innerHTML = challenges.map(challenge =>
            createChallengeCard(challenge)
        ).join('');

    } catch (error) {
        console.error('Challenge yükleme hatası:', error);
        featuredChallenges.innerHTML = `<p>Meydan okumalar yüklenemedi</p>`;
    }
}

// Challenge kartı oluştur
function createChallengeCard(challenge) {
    const difficultyClass = `difficulty-${challenge.difficulty}`;
    const participantCount = challenge.participant_count || 0;

    // Tarih hesaplamaları
    const now = new Date();
    const startDate = new Date(challenge.start_date);
    const endDate = new Date(challenge.end_date);

    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.ceil((now - startDate) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    const progressPercentage = Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100));

    // Durum kontrolü
    let countdownClass = 'active';
    let countdownText = '';
    if (now < startDate) {
        countdownClass = 'upcoming';
        const daysUntilStart = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
        countdownText = `🕐 ${daysUntilStart} gün sonra başlıyor`;
    } else if (now > endDate) {
        countdownClass = 'ended';
        countdownText = '⏱️ Sona erdi';
    } else {
        countdownText = `⏰ ${daysRemaining} gün kaldı`;
    }

    return `
        <div class="challenge-card" onclick="goToChallenge(${challenge.id})">
            <div class="challenge-image">
                <div class="challenge-badge">🏆 ${challenge.points} Puan</div>
            </div>
            <div class="challenge-content">
                <div class="challenge-header">
                    ${challenge.category_name ? `
                        <span class="challenge-category">
                            ${challenge.category_icon} ${challenge.category_name}
                        </span>
                    ` : ''}
                    <span class="challenge-difficulty ${difficultyClass}">
                        ${challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
                    </span>
                </div>
                <h3 class="challenge-title">${challenge.title}</h3>
                <p class="challenge-description">${challenge.description}</p>

                <!-- Progress Bar -->
                <div class="challenge-progress">
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${progressPercentage}%"></div>
                    </div>
                </div>

                <!-- Stats -->
                <div class="challenge-stats">
                    <span class="stat-badge">
                        👥 ${participantCount} katılımcı
                    </span>
                    <span class="countdown ${countdownClass}">
                        ${countdownText}
                    </span>
                </div>
            </div>
        </div>
    `;
}

// Challenge sayfasına git
function goToChallenge(id) {
    window.location.href = `/challenge/${id}`;
}

// İstatistikleri yükle
async function loadStats() {
    const activeChallengesEl = document.getElementById('activeChallenges');
    if (!activeChallengesEl) return;

    try {
        const data = await ChallengeAPI.getAll({ status: 'aktif', limit: 100 });
        activeChallengesEl.textContent = data.challenges.length;
    } catch (error) {
        console.error('İstatistik yükleme hatası:', error);
    }
}
