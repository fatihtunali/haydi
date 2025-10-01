// Auth durumunu kontrol et ve navbar'ı güncelle
function initAuth() {
    updateAuthButtons();
}

// Auth butonlarını güncelle
function updateAuthButtons() {
    const authButtons = document.getElementById('authButtons');
    if (!authButtons) return;

    if (isLoggedIn()) {
        const user = getUser();
        // Kullanıcı adını belirle (full_name varsa onu kullan, yoksa username)
        const displayName = user.full_name
            ? `${user.full_name} (@${user.username})`
            : `@${user.username}`;

        authButtons.innerHTML = `
            <a href="/profile" class="nav-link" style="color: #2C3E50; font-weight: 500; display: flex; align-items: center; gap: 8px;">
                ${user.avatar_url ? `<img src="${user.avatar_url}" alt="Avatar" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">` : ''}
                ${displayName}
            </a>
            <button onclick="handleLogout()" class="btn btn-small btn-danger">Çıkış</button>
        `;
    } else {
        authButtons.innerHTML = `
            <a href="/login" class="btn btn-small btn-secondary">Giriş Yap</a>
            <a href="/register" class="btn btn-small btn-primary">Kayıt Ol</a>
        `;
    }
}

// Logout
function handleLogout() {
    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
        logout();
    }
}

// Sayfa yüklendiğinde auth'u başlat
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    initAuth();
}
