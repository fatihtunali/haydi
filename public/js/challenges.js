// Challenges Page Handler
let allCategories = [];

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', async () => {
    await loadCategoriesFilter();
    await loadChallenges();
    checkURLFilters();
});

// Kategori filtresini yükle
async function loadCategoriesFilter() {
    try {
        const data = await ChallengeAPI.getCategories();
        allCategories = data.categories;

        const categoryFilter = document.getElementById('categoryFilter');
        categoryFilter.innerHTML = '<option value="">Tüm Kategoriler</option>' +
            allCategories.map(cat => `
                <option value="${cat.slug}">${cat.icon} ${cat.name}</option>
            `).join('');

    } catch (error) {
        console.error('Kategori yükleme hatası:', error);
    }
}

// Challenge'ları yükle
async function loadChallenges(params = {}) {
    const challengesList = document.getElementById('challengesList');
    showLoading(challengesList);

    try {
        const data = await ChallengeAPI.getAll({
            status: 'aktif',
            limit: 50,
            ...params
        });

        const challenges = data.challenges;

        if (challenges.length === 0) {
            showEmptyState(challengesList, '🎯', 'Henüz meydan okuma yok');
            return;
        }

        challengesList.innerHTML = challenges.map(challenge =>
            createChallengeCard(challenge)
        ).join('');

    } catch (error) {
        console.error('Challenge yükleme hatası:', error);
        challengesList.innerHTML = '<p>Meydan okumalar yüklenemedi</p>';
    }
}

// Filtreleri uygula
function applyFilters() {
    const category = document.getElementById('categoryFilter').value;
    const difficulty = document.getElementById('difficultyFilter').value;

    const params = {};
    if (category) params.category = category;
    if (difficulty) params.difficulty = difficulty;

    loadChallenges(params);

    // URL'i güncelle
    const urlParams = new URLSearchParams(params);
    window.history.replaceState({}, '', '?' + urlParams.toString());
}

// Filtreleri temizle
function resetFilters() {
    document.getElementById('categoryFilter').value = '';
    document.getElementById('difficultyFilter').value = '';
    loadChallenges();
    window.history.replaceState({}, '', window.location.pathname);
}

// URL'den filtreleri kontrol et
function checkURLFilters() {
    const category = getQueryParam('category');
    const difficulty = getQueryParam('difficulty');

    if (category) {
        document.getElementById('categoryFilter').value = category;
    }
    if (difficulty) {
        document.getElementById('difficultyFilter').value = difficulty;
    }

    if (category || difficulty) {
        applyFilters();
    }
}
