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
            <a href="/challenges?category=${cat.slug}" class="category-card">
                <div class="category-icon">${cat.icon}</div>
                <div class="category-name">${cat.name}</div>
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
        const data = await ChallengeAPI.getAll({ status: 'aktif', limit: 6 });
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

    return `
        <div class="challenge-card" onclick="goToChallenge(${challenge.id})">
            <div class="challenge-image"></div>
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
                <div class="challenge-meta">
                    <span class="meta-item">
                        👥 ${participantCount} katılımcı
                    </span>
                    <span class="meta-item">
                        🏆 ${challenge.points} puan
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
