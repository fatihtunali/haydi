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
        const displayName = user.full_name || user.username;

        authButtons.innerHTML = `
            <!-- Bildirimler -->
            <div style="position: relative;">
                <button onclick="toggleNotifications()" style="display: flex; align-items: center; padding: 0.35rem 0.5rem; background: transparent; color: var(--text); border-radius: 8px; border: 1px solid var(--border); cursor: pointer; font-size: 1rem; transition: all 0.2s; position: relative;" onmouseover="this.style.background='rgba(0,0,0,0.03)';" onmouseout="this.style.background='transparent';">
                    🔔
                    <span id="notificationBadge" style="position: absolute; top: -4px; right: -4px; background: #ef4444; color: white; border-radius: 10px; padding: 0.15rem 0.35rem; font-size: 0.65rem; font-weight: 700; display: none; min-width: 18px; text-align: center;"></span>
                </button>
            </div>

            <!-- Puan -->
            <div style="display: flex; align-items: center; gap: 0.3rem; padding: 0.35rem 0.6rem; background: rgba(16, 185, 129, 0.08); border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.25);">
                <span style="font-size: 0.9rem;">🏆</span>
                <span style="font-weight: 700; color: #10b981; font-size: 0.8rem;" id="userPoints">${user.points || 0}</span>
            </div>

            <!-- Meydan Okuma + -->
            <a href="/create-challenge" style="display: flex; align-items: center; gap: 0.25rem; padding: 0.35rem 0.6rem; background: var(--primary); color: white; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.8rem; transition: all 0.2s; white-space: nowrap;" onmouseover="this.style.opacity='0.9';" onmouseout="this.style.opacity='1';">
                <span style="font-size: 0.9rem;">+</span>
                <span>Meydan Okuma</span>
            </a>

            ${user.role === 'admin' ? `
                <a href="/admin" style="display: flex; align-items: center; padding: 0.35rem 0.6rem; background: #ef4444; color: white; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.8rem; transition: all 0.2s;" onmouseover="this.style.opacity='0.9';" onmouseout="this.style.opacity='1';">
                    Admin
                </a>
            ` : ''}

            <!-- Kullanıcı -->
            <a href="/profile" style="display: flex; align-items: center; gap: 0.35rem; padding: 0.3rem 0.6rem 0.3rem 0.35rem; background: rgba(99, 102, 241, 0.08); border-radius: 8px; text-decoration: none; transition: all 0.2s; border: 1px solid rgba(99, 102, 241, 0.15);" onmouseover="this.style.background='rgba(99, 102, 241, 0.12)';" onmouseout="this.style.background='rgba(99, 102, 241, 0.08)';">
                ${user.avatar_url
                    ? `<img src="${user.avatar_url}" alt="Avatar" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;">`
                    : `<div style="width: 24px; height: 24px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.7rem;">${displayName.charAt(0).toUpperCase()}</div>`
                }
                <span style="font-weight: 600; color: var(--text); font-size: 0.8rem; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${displayName}</span>
            </a>

            <!-- Çıkış -->
            <button onclick="handleLogout()" style="display: flex; align-items: center; padding: 0.35rem 0.5rem; background: transparent; color: var(--text-light); border-radius: 8px; border: 1px solid var(--border); cursor: pointer; font-weight: 600; font-size: 0.8rem; transition: all 0.2s;" onmouseover="this.style.borderColor='#ef4444'; this.style.color='#ef4444';" onmouseout="this.style.borderColor='var(--border)'; this.style.color='var(--text-light)';">
                Çıkış
            </button>
        `;
    } else {
        authButtons.innerHTML = `
            <a href="/login" style="padding: 0.35rem 0.8rem; background: transparent; color: var(--text); border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.8rem; transition: all 0.2s; border: 1px solid var(--border);" onmouseover="this.style.borderColor='var(--primary)';" onmouseout="this.style.borderColor='var(--border)';">
                Giriş Yap
            </a>
            <a href="/register" style="padding: 0.35rem 0.8rem; background: var(--primary); color: white; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.8rem; transition: all 0.2s;" onmouseover="this.style.opacity='0.9';" onmouseout="this.style.opacity='1';">
                Kayıt Ol
            </a>
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
window.updateAuthButtons = updateAuthButtons;

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
