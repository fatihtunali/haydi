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
            <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(16, 185, 129, 0.1)); border-radius: 20px; border: 2px solid var(--primary);">
                <span style="font-size: 1.2rem;">🏆</span>
                <span style="font-weight: 700; color: var(--primary); transition: all 0.3s;" id="userPoints">${user.points || 0}</span>
                <span style="font-size: 0.85rem; color: var(--text-light);">puan</span>
            </div>
            ${user.role === 'admin' ? '<a href="/admin" class="btn btn-small" style="background: #ef4444; color: white;">🎛️ Admin</a>' : ''}
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

// Kullanıcı bilgilerini yenile (puan güncellemesi için)
async function updateUserInfo() {
    if (!isLoggedIn()) return;

    try {
        const data = await AuthAPI.getProfile();
        const user = data.user;

        // LocalStorage'ı güncelle
        const currentUser = getUser();
        currentUser.points = user.points;
        localStorage.setItem('user', JSON.stringify(currentUser));

        // Header'daki puanı güncelle
        const userPointsEl = document.getElementById('userPoints');
        if (userPointsEl) {
            userPointsEl.textContent = user.points || 0;

            // Animasyon ekle
            userPointsEl.style.transform = 'scale(1.3)';
            userPointsEl.style.color = '#10b981';
            setTimeout(() => {
                userPointsEl.style.transform = 'scale(1)';
                userPointsEl.style.color = 'var(--primary)';
            }, 500);
        }
    } catch (error) {
        console.error('Kullanıcı bilgileri güncellenemedi:', error);
    }
}

// Global olarak erişilebilir yap
window.updateUserInfo = updateUserInfo;

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
