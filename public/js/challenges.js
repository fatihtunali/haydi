// Challenges Page Handler
let allCategories = [];
let allChallenges = []; // Arama için tüm challenge'ları sakla
let searchTimeout = null;

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
            limit: 100, // Tüm challenge'ları çek
            ...params
        });

        allChallenges = data.challenges;
        renderChallenges(allChallenges);

    } catch (error) {
        console.error('Challenge yükleme hatası:', error);
        challengesList.innerHTML = '<p>Meydan okumalar yüklenemedi</p>';
    }
}

// Challenge'ları render et
function renderChallenges(challenges) {
    const challengesList = document.getElementById('challengesList');

    if (challenges.length === 0) {
        showEmptyState(challengesList, '🎯', 'Sonuç bulunamadı');
        return;
    }

    challengesList.innerHTML = challenges.map(challenge =>
        createChallengeCard(challenge)
    ).join('');
}

// Arama fonksiyonu (debounced)
function handleSearch(event) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        applyFilters();
    }, 300); // 300ms bekle
}

// Filtreleri uygula
function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const category = document.getElementById('categoryFilter').value;
    const difficulty = document.getElementById('difficultyFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const teamFilter = document.getElementById('teamFilter').value;

    // Filtreleme yap
    let filtered = allChallenges.filter(challenge => {
        // Arama
        if (searchTerm) {
            const titleMatch = challenge.title.toLowerCase().includes(searchTerm);
            const descMatch = challenge.description.toLowerCase().includes(searchTerm);
            if (!titleMatch && !descMatch) return false;
        }

        // Kategori
        if (category && challenge.category_slug !== category) return false;

        // Zorluk
        if (difficulty && challenge.difficulty !== difficulty) return false;

        // Takım/Solo
        if (teamFilter === 'solo' && challenge.is_team_based) return false;
        if (teamFilter === 'team' && !challenge.is_team_based) return false;

        // Status filtresi
        if (statusFilter) {
            const now = new Date();
            const startDate = new Date(challenge.start_date);
            const endDate = new Date(challenge.end_date);

            if (statusFilter === 'aktif') {
                // Başlamış ve bitmemiş
                if (!(startDate <= now && now <= endDate)) return false;
            } else if (statusFilter === 'yaklasan') {
                // Henüz başlamamış
                if (startDate <= now) return false;
            } else if (statusFilter === 'biten') {
                // Bitmiş
                if (endDate >= now) return false;
            }
        }

        return true;
    });

    renderChallenges(filtered);

    // URL'i güncelle
    const params = {};
    if (searchTerm) params.q = searchTerm;
    if (category) params.category = category;
    if (difficulty) params.difficulty = difficulty;
    if (statusFilter) params.status = statusFilter;
    if (teamFilter) params.team = teamFilter;

    const urlParams = new URLSearchParams(params);
    const newURL = urlParams.toString() ? '?' + urlParams.toString() : window.location.pathname;
    window.history.replaceState({}, '', newURL);
}

// Filtreleri temizle
function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('difficultyFilter').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('teamFilter').value = '';
    renderChallenges(allChallenges);
    window.history.replaceState({}, '', window.location.pathname);
}

// URL'den filtreleri kontrol et
function checkURLFilters() {
    const searchTerm = getQueryParam('q');
    const category = getQueryParam('category');
    const difficulty = getQueryParam('difficulty');
    const statusFilter = getQueryParam('status');
    const teamFilter = getQueryParam('team');

    if (searchTerm) {
        document.getElementById('searchInput').value = searchTerm;
    }
    if (category) {
        document.getElementById('categoryFilter').value = category;
    }
    if (difficulty) {
        document.getElementById('difficultyFilter').value = difficulty;
    }
    if (statusFilter) {
        document.getElementById('statusFilter').value = statusFilter;
    }
    if (teamFilter) {
        document.getElementById('teamFilter').value = teamFilter;
    }

    if (searchTerm || category || difficulty || statusFilter || teamFilter) {
        applyFilters();
    }
}
