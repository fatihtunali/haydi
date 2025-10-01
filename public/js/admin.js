// Admin Panel
let activeTab = 'dashboard'; // dashboard, submissions, users, challenges
let dashboardData = null;
let submissionsData = [];
let usersData = [];
let challengesData = [];

async function loadAdminPanel() {
    const adminContent = document.getElementById('adminContent');

    // Admin kontrolü
    if (!isLoggedIn()) {
        window.location.href = '/login';
        return;
    }

    try {
        // Dashboard verilerini yükle
        await loadDashboard();

        // Panel'i render et
        renderAdminPanel();

    } catch (error) {
        console.error('Admin panel hatası:', error);

        if (error.message.includes('admin yetkisi')) {
            adminContent.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🚫</div>
                    <h2>Yetkisiz Erişim</h2>
                    <p>Bu sayfaya erişim için admin yetkisi gereklidir.</p>
                    <a href="/" class="btn btn-primary">Ana Sayfaya Dön</a>
                </div>
            `;
        } else {
            adminContent.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">❌</div>
                    <p>Admin panel yüklenirken bir hata oluştu</p>
                    <button onclick="loadAdminPanel()" class="btn btn-primary">Tekrar Dene</button>
                </div>
            `;
        }
    }
}

// Dashboard verilerini yükle
async function loadDashboard() {
    const response = await fetch('/api/admin/dashboard', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Dashboard yüklenemedi');
    }

    dashboardData = await response.json();
}

// Admin panelini render et
function renderAdminPanel() {
    const adminContent = document.getElementById('adminContent');

    adminContent.innerHTML = `
        <div style="margin-bottom: 2rem;">
            <h1 style="font-size: 2rem; margin-bottom: 0.5rem;">🎛️ Admin Panel</h1>
            <p style="color: var(--text-light);">Platform yönetim paneli</p>
        </div>

        <!-- Tab Navigation -->
        <div style="background: var(--card-bg); border-radius: 12px; padding: 1rem; margin-bottom: 2rem; display: flex; gap: 1rem; flex-wrap: wrap; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
            <button onclick="switchAdminTab('dashboard')" class="btn ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}">
                📊 Dashboard
            </button>
            <button onclick="switchAdminTab('submissions')" class="btn ${activeTab === 'submissions' ? 'btn-primary' : 'btn-secondary'}">
                📤 Gönderiler ${dashboardData.stats.pending_submissions > 0 ? `(${dashboardData.stats.pending_submissions})` : ''}
            </button>
            <button onclick="switchAdminTab('users')" class="btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}">
                👥 Kullanıcılar
            </button>
            <button onclick="switchAdminTab('challenges')" class="btn ${activeTab === 'challenges' ? 'btn-primary' : 'btn-secondary'}">
                🎯 Meydan Okumalar
            </button>
        </div>

        <!-- Tab Content -->
        <div id="adminTabContent"></div>
    `;

    renderAdminTabContent();
}

// Tab değiştir
async function switchAdminTab(tab) {
    activeTab = tab;

    // Veriyi yükle
    if (tab === 'submissions' && submissionsData.length === 0) {
        await loadSubmissions();
    } else if (tab === 'users' && usersData.length === 0) {
        await loadUsers();
    } else if (tab === 'challenges' && challengesData.length === 0) {
        await loadChallenges();
    }

    renderAdminPanel();
}

// Tab içeriğini render et
function renderAdminTabContent() {
    const tabContent = document.getElementById('adminTabContent');

    switch (activeTab) {
        case 'dashboard':
            tabContent.innerHTML = renderDashboard();
            break;
        case 'submissions':
            tabContent.innerHTML = renderSubmissions();
            break;
        case 'users':
            tabContent.innerHTML = renderUsers();
            break;
        case 'challenges':
            tabContent.innerHTML = renderChallenges();
            break;
    }
}

// Dashboard render
function renderDashboard() {
    const stats = dashboardData.stats;

    return `
        <!-- İstatistik Kartları -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
            <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 2rem; border-radius: 12px; color: white;">
                <div style="font-size: 2.5rem; font-weight: bold; margin-bottom: 0.5rem;">${stats.total_users}</div>
                <div>Toplam Kullanıcı</div>
            </div>

            <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 2rem; border-radius: 12px; color: white;">
                <div style="font-size: 2.5rem; font-weight: bold; margin-bottom: 0.5rem;">${stats.total_challenges}</div>
                <div>Toplam Meydan Okuma</div>
            </div>

            <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 2rem; border-radius: 12px; color: white;">
                <div style="font-size: 2.5rem; font-weight: bold; margin-bottom: 0.5rem;">${stats.total_submissions}</div>
                <div>Toplam Gönderi</div>
            </div>

            <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 2rem; border-radius: 12px; color: white;">
                <div style="font-size: 2.5rem; font-weight: bold; margin-bottom: 0.5rem;">${stats.pending_submissions}</div>
                <div>Bekleyen Gönderi</div>
            </div>
        </div>

        <!-- En Aktif Kullanıcılar -->
        <div style="background: var(--card-bg); padding: 2rem; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
            <h3 style="margin-bottom: 1.5rem;">🏆 En Aktif Kullanıcılar (Top 10)</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 2px solid var(--border);">
                        <th style="text-align: left; padding: 1rem;">Sıra</th>
                        <th style="text-align: left; padding: 1rem;">Kullanıcı</th>
                        <th style="text-align: center; padding: 1rem;">Puan</th>
                        <th style="text-align: center; padding: 1rem;">Gönderi</th>
                    </tr>
                </thead>
                <tbody>
                    ${dashboardData.topUsers.map((user, index) => `
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 1rem;">
                                <span style="font-size: 1.5rem; font-weight: bold;">${index + 1}</span>
                            </td>
                            <td style="padding: 1rem;">
                                <div style="font-weight: 600;">${user.username}</div>
                                <div style="font-size: 0.85rem; color: var(--text-light);">${user.email}</div>
                            </td>
                            <td style="text-align: center; padding: 1rem;">
                                <span style="font-weight: 700; color: var(--primary);">${user.points}</span>
                            </td>
                            <td style="text-align: center; padding: 1rem;">
                                ${user.submission_count}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Submissions yükle
async function loadSubmissions(status = 'beklemede') {
    const response = await fetch(`/api/admin/submissions?status=${status}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });

    if (!response.ok) throw new Error('Gönderiler yüklenemedi');

    const data = await response.json();
    submissionsData = data.submissions;
}

// Submissions render
function renderSubmissions() {
    if (submissionsData.length === 0) {
        return `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <p>Bekleyen gönderi yok</p>
            </div>
        `;
    }

    return `
        <div style="display: grid; gap: 1.5rem;">
            ${submissionsData.map(s => `
                <div style="background: var(--card-bg); padding: 1.5rem; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); border-left: 4px solid var(--primary);">
                    <div style="display: grid; grid-template-columns: ${s.media_url ? '200px 1fr auto' : '1fr auto'}; gap: 1.5rem; align-items: start;">

                        ${s.media_url ? `
                            <img src="${s.media_url}" style="width: 200px; height: 150px; object-fit: cover; border-radius: 8px;">
                        ` : ''}

                        <div>
                            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                                <span style="font-weight: 700; color: var(--primary);">${s.challenge_title}</span>
                                <span class="challenge-difficulty difficulty-${s.difficulty}">${s.difficulty}</span>
                            </div>

                            <div style="font-size: 0.9rem; color: var(--text-light); margin-bottom: 0.5rem;">
                                Gönderen: <strong>${s.username}</strong> (${s.email})
                            </div>

                            ${s.location ? `<div style="margin-bottom: 0.5rem;">📍 ${s.location}</div>` : ''}

                            <p style="color: var(--text); line-height: 1.6; margin-top: 0.75rem;">
                                ${s.content || ''}
                            </p>

                            <div style="font-size: 0.85rem; color: var(--text-light); margin-top: 0.75rem;">
                                ${new Date(s.created_at).toLocaleString('tr-TR')}
                            </div>
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                            <button onclick="approveSubmission(${s.id})" class="btn btn-primary" style="white-space: nowrap;">
                                ✅ Onayla
                            </button>
                            <button onclick="rejectSubmission(${s.id})" class="btn btn-danger" style="white-space: nowrap;">
                                ❌ Reddet
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Submission onayla
async function approveSubmission(id) {
    if (!confirm('Bu gönderiyi onaylamak istediğinizden emin misiniz?')) return;

    try {
        const response = await fetch(`/api/admin/submissions/${id}/approve`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Onaylama başarısız');

        const data = await response.json();
        showSuccess(`Gönderi onaylandı! ${data.points_awarded} puan verildi.`);

        await loadSubmissions();
        renderAdminTabContent();

    } catch (error) {
        showError(error.message);
    }
}

// Submission reddet
async function rejectSubmission(id) {
    const reason = prompt('Reddetme sebebi (opsiyonel):');
    if (reason === null) return; // İptal

    try {
        const response = await fetch(`/api/admin/submissions/${id}/reject`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reason })
        });

        if (!response.ok) throw new Error('Reddetme başarısız');

        showSuccess('Gönderi reddedildi');

        await loadSubmissions();
        renderAdminTabContent();

    } catch (error) {
        showError(error.message);
    }
}

// Users yükle
async function loadUsers() {
    const response = await fetch('/api/admin/users', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });

    if (!response.ok) throw new Error('Kullanıcılar yüklenemedi');

    const data = await response.json();
    usersData = data.users;
}

// Users render
function renderUsers() {
    return `
        <div style="background: var(--card-bg); padding: 2rem; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
            <h3 style="margin-bottom: 1.5rem;">Kullanıcı Listesi</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 2px solid var(--border);">
                        <th style="text-align: left; padding: 1rem;">Kullanıcı</th>
                        <th style="text-align: center; padding: 1rem;">Rol</th>
                        <th style="text-align: center; padding: 1rem;">Puan</th>
                        <th style="text-align: center; padding: 1rem;">Gönderi</th>
                        <th style="text-align: center; padding: 1rem;">Kayıt Tarihi</th>
                    </tr>
                </thead>
                <tbody>
                    ${usersData.map(user => `
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 1rem;">
                                <div style="font-weight: 600;">${user.username}</div>
                                <div style="font-size: 0.85rem; color: var(--text-light);">${user.email}</div>
                            </td>
                            <td style="text-align: center; padding: 1rem;">
                                <span style="padding: 0.25rem 0.75rem; background: ${user.role === 'admin' ? '#ef4444' : '#6366f1'}; color: white; border-radius: 12px; font-size: 0.85rem;">
                                    ${user.role === 'admin' ? '👑 Admin' : '👤 User'}
                                </span>
                            </td>
                            <td style="text-align: center; padding: 1rem;">
                                <strong>${user.points}</strong>
                            </td>
                            <td style="text-align: center; padding: 1rem;">
                                ${user.submission_count}
                            </td>
                            <td style="text-align: center; padding: 1rem; font-size: 0.85rem;">
                                ${new Date(user.created_at).toLocaleDateString('tr-TR')}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Challenges yükle
async function loadChallenges() {
    const response = await fetch('/api/admin/challenges', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });

    if (!response.ok) throw new Error('Meydan okumalar yüklenemedi');

    const data = await response.json();
    challengesData = data.challenges;
}

// Challenges render
function renderChallenges() {
    return `
        <div style="background: var(--card-bg); padding: 2rem; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
            <h3 style="margin-bottom: 1.5rem;">Meydan Okuma Listesi</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 2px solid var(--border);">
                        <th style="text-align: left; padding: 1rem;">Başlık</th>
                        <th style="text-align: center; padding: 1rem;">Kategori</th>
                        <th style="text-align: center; padding: 1rem;">Durum</th>
                        <th style="text-align: center; padding: 1rem;">Katılımcı</th>
                        <th style="text-align: center; padding: 1rem;">Gönderi</th>
                        <th style="text-align: center; padding: 1rem;">İşlem</th>
                    </tr>
                </thead>
                <tbody>
                    ${challengesData.map(c => `
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 1rem;">
                                <div style="font-weight: 600;">${c.title}</div>
                                <div style="font-size: 0.85rem; color: var(--text-light);">🏆 ${c.points} puan</div>
                            </td>
                            <td style="text-align: center; padding: 1rem;">
                                ${c.category_name || '-'}
                            </td>
                            <td style="text-align: center; padding: 1rem;">
                                <span style="padding: 0.25rem 0.75rem; background: ${c.status === 'aktif' ? '#10b981' : '#6b7280'}; color: white; border-radius: 12px; font-size: 0.85rem;">
                                    ${c.status}
                                </span>
                            </td>
                            <td style="text-align: center; padding: 1rem;">
                                ${c.participant_count}
                            </td>
                            <td style="text-align: center; padding: 1rem;">
                                ${c.submission_count}
                            </td>
                            <td style="text-align: center; padding: 1rem;">
                                <a href="/challenge/${c.id}" class="btn btn-small btn-primary">Görüntüle</a>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Sayfa yüklendiğinde
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAdminPanel);
} else {
    loadAdminPanel();
}
