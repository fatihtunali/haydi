// Profile sayfası

async function loadProfile() {
    const profileContent = document.getElementById('profileContent');

    // Login kontrolü
    if (!isLoggedIn()) {
        window.location.href = '/login';
        return;
    }

    try {
        showLoading(profileContent);

        // Profil bilgilerini API'den al
        const response = await fetch('/api/auth/profile', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Profil yüklenemedi');
        }

        const data = await response.json();
        const user = data.user;

        // Profil HTML'ini oluştur
        profileContent.innerHTML = `
            <div class="profile-container" style="max-width: 800px; margin: 0 auto;">
                <!-- Profil Header -->
                <div style="background: var(--card-bg); padding: 2rem; border-radius: 12px; margin-bottom: 2rem; text-align: center;">
                    ${user.avatar_url
                        ? `<img src="${user.avatar_url}" alt="Avatar" style="width: 120px; height: 120px; border-radius: 50%; margin-bottom: 1rem; object-fit: cover;">`
                        : `<div style="width: 120px; height: 120px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center; font-size: 48px; color: white;">${user.username.charAt(0).toUpperCase()}</div>`
                    }
                    <h1 style="margin: 0 0 0.5rem 0; color: var(--text);">
                        ${user.full_name || user.username}
                    </h1>
                    <p style="color: var(--text-light); margin: 0 0 1rem 0;">@${user.username}</p>
                    ${user.bio ? `<p style="color: var(--text-light); margin: 0 0 1rem 0;">${user.bio}</p>` : ''}

                    <!-- İstatistikler -->
                    <div style="display: flex; gap: 2rem; justify-content: center; margin-top: 1.5rem;">
                        <div>
                            <div style="font-size: 24px; font-weight: bold; color: var(--primary);">${user.points || 0}</div>
                            <div style="color: var(--text-light); font-size: 14px;">Puan</div>
                        </div>
                        <div>
                            <div style="font-size: 24px; font-weight: bold; color: var(--primary);" id="challengeCount">0</div>
                            <div style="color: var(--text-light); font-size: 14px;">Meydan Okuma</div>
                        </div>
                    </div>
                </div>

                <!-- Kullanıcı Bilgileri -->
                <div style="background: var(--card-bg); padding: 2rem; border-radius: 12px;">
                    <h2 style="margin: 0 0 1.5rem 0; color: var(--text);">Bilgilerim</h2>

                    <div style="display: grid; gap: 1rem;">
                        <div>
                            <label style="display: block; color: var(--text-light); font-size: 14px; margin-bottom: 0.5rem;">E-posta</label>
                            <div style="color: var(--text);">${user.email}</div>
                        </div>

                        <div>
                            <label style="display: block; color: var(--text-light); font-size: 14px; margin-bottom: 0.5rem;">Kayıt Tarihi</label>
                            <div style="color: var(--text);">${new Date(user.created_at).toLocaleDateString('tr-TR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}</div>
                        </div>
                    </div>

                    <div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--border);">
                        <button onclick="handleLogout()" class="btn btn-danger" style="width: 100%;">
                            Çıkış Yap
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Challenge sayısını yükle
        loadUserChallenges(user.id);

    } catch (error) {
        console.error('Profil hatası:', error);
        profileContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">❌</div>
                <p>Profil yüklenirken bir hata oluştu</p>
                <button onclick="loadProfile()" class="btn btn-primary">Tekrar Dene</button>
            </div>
        `;
    }
}

// Kullanıcının challenge'larını yükle
async function loadUserChallenges(userId) {
    try {
        const response = await fetch('/api/challenges', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            // Kullanıcının katıldığı challenge'ları say
            // Bu kısım şimdilik basit tutuluyor, backend'de participants bilgisi dönmüyor
            const challengeCount = document.getElementById('challengeCount');
            if (challengeCount) {
                challengeCount.textContent = '0'; // TODO: Gerçek sayıyı backend'den al
            }
        }
    } catch (error) {
        console.error('Challenge sayısı yüklenemedi:', error);
    }
}

// Sayfa yüklendiğinde
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadProfile);
} else {
    loadProfile();
}
