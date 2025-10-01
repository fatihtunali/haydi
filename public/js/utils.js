// Utility fonksiyonları

// Tarih formatla
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Bugün';
    if (days === 1) return 'Dün';
    if (days < 7) return `${days} gün önce`;
    if (days < 30) return `${Math.floor(days / 7)} hafta önce`;

    return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Tarih aralığı formatla
function formatDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start > now) {
        return `${formatDate(startDate)} başlıyor`;
    } else if (end < now) {
        return 'Sona erdi';
    } else {
        const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
        return `${daysLeft} gün kaldı`;
    }
}

// Loading göster
function showLoading(element) {
    element.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <p>Yükleniyor...</p>
        </div>
    `;
}

// Empty state göster
function showEmptyState(element, icon, message) {
    element.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">${icon}</div>
            <p>${message}</p>
        </div>
    `;
}

// Error göster
function showError(message) {
    alert(message); // Daha sonra toast notification yapılabilir
}

// Success göster
function showSuccess(message) {
    alert(message);
}

// Sayı formatla (1000 -> 1K)
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Token kontrolü
function isLoggedIn() {
    return !!localStorage.getItem('token');
}

// Kullanıcı bilgisini al
function getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
}

// URL'den query parameter al
function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}
