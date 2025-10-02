// Admin Panel
let activeTab = 'dashboard'; // dashboard, submissions, users, challenges
let submissionsFilter = ''; // '', 'beklemede', 'onaylandi', 'reddedildi'
let dashboardData = null;
let submissionsData = [];
let usersData = [];
let challengesData = [];
let categoriesData = [];

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
        await loadSubmissions('beklemede'); // İlk açılışta bekleyen gönderiler
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
async function loadSubmissions(status = '') {
    submissionsFilter = status;
    const url = status ? `/api/admin/submissions?status=${status}` : '/api/admin/submissions';

    const response = await fetch(url, {
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
    const filterButtons = `
        <div style="background: var(--card-bg); border-radius: 12px; padding: 1rem; margin-bottom: 1.5rem; display: flex; gap: 0.75rem; flex-wrap: wrap; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
            <button onclick="filterSubmissions('')" class="btn ${submissionsFilter === '' ? 'btn-primary' : 'btn-secondary'}">
                📋 Tümü
            </button>
            <button onclick="filterSubmissions('beklemede')" class="btn ${submissionsFilter === 'beklemede' ? 'btn-primary' : 'btn-secondary'}">
                ⏳ Bekleyen (${dashboardData.stats.pending_submissions || 0})
            </button>
            <button onclick="filterSubmissions('onaylandi')" class="btn ${submissionsFilter === 'onaylandi' ? 'btn-primary' : 'btn-secondary'}">
                ✅ Onaylananlar
            </button>
            <button onclick="filterSubmissions('reddedildi')" class="btn ${submissionsFilter === 'reddedildi' ? 'btn-primary' : 'btn-secondary'}">
                ❌ Reddedilenler
            </button>
        </div>
    `;

    if (submissionsData.length === 0) {
        return filterButtons + `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <p>${submissionsFilter === '' ? 'Hiç gönderi yok' : submissionsFilter === 'beklemede' ? 'Bekleyen gönderi yok' : submissionsFilter === 'onaylandi' ? 'Onaylanmış gönderi yok' : 'Reddedilmiş gönderi yok'}</p>
            </div>
        `;
    }

    return filterButtons + `
        <div style="display: grid; gap: 1.5rem;">
            ${submissionsData.map(s => {
                // AI önerisi rengini belirle
                const aiRecommendationColor = {
                    'approve': '#10b981',
                    'reject': '#ef4444',
                    'manual': '#f59e0b'
                }[s.ai_recommendation] || '#94a3b8';

                const aiRecommendationText = {
                    'approve': '✅ AI Önerisi: Onayla',
                    'reject': '❌ AI Önerisi: Reddet',
                    'manual': '🤔 AI Önerisi: Manuel İnceleme'
                }[s.ai_recommendation] || 'AI analizi yok';

                return `
                    <div style="background: var(--card-bg); padding: 1.5rem; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); border-left: 4px solid ${aiRecommendationColor};">
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

                                <!-- AI Analiz Sonucu -->
                                ${s.ai_recommendation ? `
                                    <div style="background: ${aiRecommendationColor}15; border: 1px solid ${aiRecommendationColor}40; border-radius: 8px; padding: 0.75rem; margin: 0.75rem 0;">
                                        <div style="font-weight: 600; color: ${aiRecommendationColor}; margin-bottom: 0.5rem;">
                                            🤖 ${aiRecommendationText}
                                        </div>
                                        ${s.ai_score ? `
                                            <div style="font-size: 0.9rem; margin-bottom: 0.25rem;">
                                                <strong>Kalite Skoru:</strong> ${s.ai_score}/100
                                                <div style="background: #e5e7eb; height: 8px; border-radius: 4px; margin-top: 0.25rem; overflow: hidden;">
                                                    <div style="background: ${aiRecommendationColor}; height: 100%; width: ${s.ai_score}%; transition: width 0.3s;"></div>
                                                </div>
                                            </div>
                                        ` : ''}
                                        ${s.ai_reason ? `
                                            <div style="font-size: 0.85rem; color: var(--text); margin-top: 0.5rem;">
                                                <strong>Açıklama:</strong> ${s.ai_reason}
                                            </div>
                                        ` : ''}
                                    </div>
                                ` : ''}

                                <p style="color: var(--text); line-height: 1.6; margin-top: 0.75rem;">
                                    ${s.content || ''}
                                </p>

                                <div style="font-size: 0.85rem; color: var(--text-light); margin-top: 0.75rem;">
                                    📅 ${new Date(s.created_at).toLocaleString('tr-TR')}
                                </div>
                            </div>

                            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                                ${s.status !== 'onaylandi' ? `
                                    <button onclick="approveSubmission(${s.id})" class="btn btn-primary" style="white-space: nowrap;">
                                        ✅ Onayla
                                    </button>
                                ` : ''}
                                ${s.status === 'beklemede' ? `
                                    <button onclick="rejectSubmission(${s.id})" class="btn btn-danger" style="white-space: nowrap;">
                                        ❌ Reddet
                                    </button>
                                ` : ''}
                                ${s.status === 'onaylandi' ? `
                                    <div style="padding: 0.75rem; background: #10b98115; border: 1px solid #10b98140; border-radius: 8px; text-align: center; color: #10b981; font-weight: 600;">
                                        ✅ Onaylandı
                                    </div>
                                ` : ''}
                                ${s.status === 'reddedildi' ? `
                                    <div style="padding: 0.75rem; background: #ef444415; border: 1px solid #ef444440; border-radius: 8px; text-align: center; color: #ef4444; font-weight: 600;">
                                        ❌ Reddedildi
                                    </div>
                                ` : ''}
                                <button onclick="deleteSubmissionAdmin(${s.id})" class="btn btn-secondary" style="white-space: nowrap;">
                                    🗑️ Sil
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// Submissions filtrele
async function filterSubmissions(status) {
    try {
        await loadSubmissions(status);
        renderAdminTabContent();
    } catch (error) {
        console.error('Filtreleme hatası:', error);
        showError('Gönderiler yüklenemedi');
    }
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

        await loadSubmissions(submissionsFilter);
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

        await loadSubmissions(submissionsFilter);
        renderAdminTabContent();

    } catch (error) {
        showError(error.message);
    }
}

// Submission sil
async function deleteSubmissionAdmin(id) {
    if (!confirm('Bu gönderiyi kalıcı olarak silmek istediğinizden emin misiniz?')) return;

    try {
        const response = await fetch(`/api/admin/submissions/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Silme başarısız');

        showSuccess('Gönderi silindi');

        await loadSubmissions(submissionsFilter);
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
                        <th style="text-align: center; padding: 1rem;">İşlem</th>
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
                            <td style="text-align: center; padding: 1rem;">
                                <div style="display: flex; gap: 0.5rem; justify-content: center;">
                                    <button onclick="editUser(${user.id}, '${user.username}', '${user.role}', ${user.points})" class="btn btn-small btn-primary">✏️ Düzenle</button>
                                    <button onclick="deleteUserAdmin(${user.id}, '${user.username}')" class="btn btn-small btn-danger">🗑️ Sil</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Kullanıcı düzenle
async function editUser(id, username, currentRole, currentPoints) {
    const newRole = prompt(`${username} için yeni rol (user/admin):`, currentRole);
    if (!newRole || (newRole !== 'user' && newRole !== 'admin')) {
        showError('Geçerli bir rol girin (user veya admin)');
        return;
    }

    const newPoints = prompt(`${username} için yeni puan:`, currentPoints);
    if (newPoints === null) return;

    const points = parseInt(newPoints);
    if (isNaN(points) || points < 0) {
        showError('Geçerli bir puan girin');
        return;
    }

    try {
        const response = await fetch(`/api/admin/users/${id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ role: newRole, points })
        });

        if (!response.ok) throw new Error('Güncelleme başarısız');

        showSuccess('Kullanıcı güncellendi');

        await loadUsers();
        renderAdminTabContent();

    } catch (error) {
        showError(error.message);
    }
}

// Kullanıcı sil
async function deleteUserAdmin(id, username) {
    if (!confirm(`${username} kullanıcısını kalıcı olarak silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz ve kullanıcının tüm verileri silinecektir.`)) return;

    try {
        const response = await fetch(`/api/admin/users/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Silme başarısız');
        }

        showSuccess('Kullanıcı silindi');

        await loadUsers();
        renderAdminTabContent();

    } catch (error) {
        showError(error.message);
    }
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

// Kategorileri yükle
async function loadCategories() {
    if (categoriesData.length > 0) return; // Cache

    const response = await fetch('/api/admin/categories', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });

    if (!response.ok) throw new Error('Kategoriler yüklenemedi');

    const data = await response.json();
    categoriesData = data.categories;
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
                                <div style="display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap;">
                                    <a href="/challenge/${c.id}" class="btn btn-small btn-secondary">👁️ Görüntüle</a>
                                    <button onclick="editChallenge(${c.id})" class="btn btn-small btn-primary">✏️ Düzenle</button>
                                    <button onclick="deleteChallengeAdmin(${c.id}, '${c.title.replace(/'/g, "\\'")}', ${c.participant_count})" class="btn btn-small btn-danger">🗑️ Sil</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Challenge düzenle - Modal aç
async function editChallenge(id) {
    try {
        // Kategorileri yükle
        await loadCategories();

        // Challenge detaylarını yükle
        const response = await fetch(`/api/admin/challenges/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Challenge detayları yüklenemedi');

        const data = await response.json();
        const challenge = data.challenge;

        // Modal oluştur
        showEditChallengeModal(challenge);

    } catch (error) {
        showError(error.message);
    }
}

// Challenge düzenleme modalını göster
function showEditChallengeModal(challenge) {
    // Tarih formatı düzelt (datetime-local için)
    const formatDateForInput = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toISOString().slice(0, 16);
    };

    const modalHTML = `
        <div id="editChallengeModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 2rem;">
            <div style="background: var(--card-bg); border-radius: 12px; max-width: 800px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
                <div style="padding: 2rem; border-bottom: 2px solid var(--border);">
                    <h2 style="margin: 0; font-size: 1.5rem;">✏️ Meydan Okuma Düzenle</h2>
                </div>

                <form id="editChallengeForm" style="padding: 2rem;">
                    <div style="display: grid; gap: 1.5rem;">
                        <!-- Başlık -->
                        <div>
                            <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Başlık *</label>
                            <input type="text" id="edit_title" value="${challenge.title || ''}" required style="width: 100%; padding: 0.75rem; border: 2px solid var(--border); border-radius: 8px; font-size: 1rem;">
                        </div>

                        <!-- Açıklama -->
                        <div>
                            <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Açıklama *</label>
                            <textarea id="edit_description" rows="4" required style="width: 100%; padding: 0.75rem; border: 2px solid var(--border); border-radius: 8px; font-size: 1rem; resize: vertical;">${challenge.description || ''}</textarea>
                        </div>

                        <!-- Kurallar -->
                        <div>
                            <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Kurallar</label>
                            <textarea id="edit_rules" rows="3" style="width: 100%; padding: 0.75rem; border: 2px solid var(--border); border-radius: 8px; font-size: 1rem; resize: vertical;">${challenge.rules || ''}</textarea>
                            <small style="color: var(--text-light);">Her kural yeni satıra yazılabilir</small>
                        </div>

                        <!-- İki kolon -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <!-- Kategori -->
                            <div>
                                <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Kategori *</label>
                                <select id="edit_category_id" required style="width: 100%; padding: 0.75rem; border: 2px solid var(--border); border-radius: 8px; font-size: 1rem;">
                                    <option value="">Seçiniz</option>
                                    ${categoriesData.map(cat => `
                                        <option value="${cat.id}" ${challenge.category_id === cat.id ? 'selected' : ''}>
                                            ${cat.icon} ${cat.name}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>

                            <!-- Zorluk -->
                            <div>
                                <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Zorluk *</label>
                                <select id="edit_difficulty" required style="width: 100%; padding: 0.75rem; border: 2px solid var(--border); border-radius: 8px; font-size: 1rem;">
                                    <option value="kolay" ${challenge.difficulty === 'kolay' ? 'selected' : ''}>Kolay</option>
                                    <option value="orta" ${challenge.difficulty === 'orta' ? 'selected' : ''}>Orta</option>
                                    <option value="zor" ${challenge.difficulty === 'zor' ? 'selected' : ''}>Zor</option>
                                </select>
                            </div>
                        </div>

                        <!-- İki kolon -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <!-- Puan -->
                            <div>
                                <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Puan *</label>
                                <input type="number" id="edit_points" value="${challenge.points || 0}" min="0" required style="width: 100%; padding: 0.75rem; border: 2px solid var(--border); border-radius: 8px; font-size: 1rem;">
                            </div>

                            <!-- Durum -->
                            <div>
                                <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Durum *</label>
                                <select id="edit_status" required style="width: 100%; padding: 0.75rem; border: 2px solid var(--border); border-radius: 8px; font-size: 1rem;">
                                    <option value="taslak" ${challenge.status === 'taslak' ? 'selected' : ''}>Taslak</option>
                                    <option value="aktif" ${challenge.status === 'aktif' ? 'selected' : ''}>Aktif</option>
                                    <option value="bitti" ${challenge.status === 'bitti' ? 'selected' : ''}>Bitti</option>
                                    <option value="iptal" ${challenge.status === 'iptal' ? 'selected' : ''}>İptal</option>
                                </select>
                            </div>
                        </div>

                        <!-- Tarihler -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <!-- Başlangıç Tarihi -->
                            <div>
                                <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Başlangıç Tarihi</label>
                                <input type="datetime-local" id="edit_start_date" value="${formatDateForInput(challenge.start_date)}" style="width: 100%; padding: 0.75rem; border: 2px solid var(--border); border-radius: 8px; font-size: 1rem;">
                            </div>

                            <!-- Bitiş Tarihi -->
                            <div>
                                <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Bitiş Tarihi</label>
                                <input type="datetime-local" id="edit_end_date" value="${formatDateForInput(challenge.end_date)}" style="width: 100%; padding: 0.75rem; border: 2px solid var(--border); border-radius: 8px; font-size: 1rem;">
                            </div>
                        </div>

                        <!-- Max katılımcı ve takım -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <!-- Max Katılımcı -->
                            <div>
                                <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Maksimum Katılımcı</label>
                                <input type="number" id="edit_max_participants" value="${challenge.max_participants || ''}" min="0" placeholder="Sınırsız için boş bırakın" style="width: 100%; padding: 0.75rem; border: 2px solid var(--border); border-radius: 8px; font-size: 1rem;">
                            </div>

                            <!-- Takım Gerektirir -->
                            <div>
                                <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Takım Gerektirir</label>
                                <select id="edit_requires_team" style="width: 100%; padding: 0.75rem; border: 2px solid var(--border); border-radius: 8px; font-size: 1rem;">
                                    <option value="0" ${!challenge.requires_team ? 'selected' : ''}>Hayır</option>
                                    <option value="1" ${challenge.requires_team ? 'selected' : ''}>Evet</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Butonlar -->
                    <div style="display: flex; gap: 1rem; margin-top: 2rem; justify-content: flex-end;">
                        <button type="button" onclick="closeEditChallengeModal()" class="btn btn-secondary">İptal</button>
                        <button type="submit" class="btn btn-primary">💾 Kaydet</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Modal'ı ekle
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Form submit handler
    document.getElementById('editChallengeForm').addEventListener('submit', (e) => {
        e.preventDefault();
        saveChallengeChanges(challenge.id);
    });

    // ESC tuşu ile kapat
    document.addEventListener('keydown', handleEscapeKey);
}

// Challenge değişikliklerini kaydet
async function saveChallengeChanges(id) {
    try {
        const formData = {
            title: document.getElementById('edit_title').value.trim(),
            description: document.getElementById('edit_description').value.trim(),
            rules: document.getElementById('edit_rules').value.trim(),
            category_id: parseInt(document.getElementById('edit_category_id').value),
            difficulty: document.getElementById('edit_difficulty').value,
            points: parseInt(document.getElementById('edit_points').value),
            status: document.getElementById('edit_status').value,
            start_date: document.getElementById('edit_start_date').value || null,
            end_date: document.getElementById('edit_end_date').value || null,
            max_participants: document.getElementById('edit_max_participants').value ? parseInt(document.getElementById('edit_max_participants').value) : null,
            requires_team: parseInt(document.getElementById('edit_requires_team').value)
        };

        const response = await fetch(`/api/admin/challenges/${id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Güncelleme başarısız');

        showSuccess('Meydan okuma güncellendi');
        closeEditChallengeModal();

        await loadChallenges();
        renderAdminTabContent();

    } catch (error) {
        showError(error.message);
    }
}

// Modal'ı kapat
function closeEditChallengeModal() {
    const modal = document.getElementById('editChallengeModal');
    if (modal) {
        modal.remove();
    }
    document.removeEventListener('keydown', handleEscapeKey);
}

// ESC tuşu handler
function handleEscapeKey(e) {
    if (e.key === 'Escape') {
        closeEditChallengeModal();
    }
}

// Challenge sil
async function deleteChallengeAdmin(id, title, participantCount) {
    if (participantCount > 0) {
        if (!confirm(`⚠️ UYARI: "${title}" meydan okumasında ${participantCount} katılımcı var!\n\nBu meydan okumayı silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz ve tüm katılımcı verileri silinecektir.`)) return;
    } else {
        if (!confirm(`"${title}" meydan okumasını kalıcı olarak silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz.`)) return;
    }

    try {
        const response = await fetch(`/api/admin/challenges/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Silme başarısız');

        showSuccess('Meydan okuma silindi');

        await loadChallenges();
        renderAdminTabContent();

    } catch (error) {
        showError(error.message);
    }
}

// Sayfa yüklendiğinde
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAdminPanel);
} else {
    loadAdminPanel();
}
