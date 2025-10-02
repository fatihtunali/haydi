// Profile sayfası

let currentUser = null;
let userChallenges = [];
let userSubmissions = [];
let userTeams = [];
let activeTab = 'info'; // 'info', 'challenges', 'submissions', veya 'teams'

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
        currentUser = data.user;

        // Kullanıcının challenge'larını, submission'larını ve takımlarını yükle (render'dan ÖNCE)
        await loadUserChallenges();
        await loadUserSubmissions();
        await loadUserTeams();

        // Profil HTML'ini oluştur
        renderProfile();

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

// Profil HTML'ini render et
function renderProfile() {
    const user = currentUser;
    const profileContent = document.getElementById('profileContent');

    profileContent.innerHTML = `
        <div class="profile-container" style="max-width: 1000px; margin: 0 auto;">
            <!-- Profil Header -->
            <div style="background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%); padding: 3rem 2rem; border-radius: 16px; margin-bottom: 2rem; color: white;">
                <div style="display: flex; align-items: center; gap: 2rem; flex-wrap: wrap;">
                    ${user.avatar_url
                        ? `<img src="${user.avatar_url}" alt="Avatar" style="width: 120px; height: 120px; border-radius: 50%; border: 4px solid white; object-fit: cover;">`
                        : `<div style="width: 120px; height: 120px; border-radius: 50%; background: white; color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 48px; font-weight: bold; border: 4px solid white;">${user.username.charAt(0).toUpperCase()}</div>`
                    }
                    <div style="flex: 1;">
                        <h1 style="margin: 0 0 0.5rem 0; font-size: 2rem;">
                            ${user.full_name || user.username}
                        </h1>
                        <p style="margin: 0 0 1rem 0; opacity: 0.9; font-size: 1.1rem;">@${user.username}</p>
                        ${user.bio ? `<p style="margin: 0; opacity: 0.9;">${user.bio}</p>` : ''}
                    </div>

                    <!-- İstatistikler -->
                    <div style="display: flex; gap: 2rem;">
                        <div style="text-align: center; background: rgba(255,255,255,0.2); padding: 1rem 1.5rem; border-radius: 12px; backdrop-filter: blur(10px);">
                            <div style="font-size: 28px; font-weight: bold;">${user.points || 0}</div>
                            <div style="font-size: 14px; opacity: 0.9;">Puan</div>
                        </div>
                        <div style="text-align: center; background: rgba(255,255,255,0.2); padding: 1rem 1.5rem; border-radius: 12px; backdrop-filter: blur(10px);">
                            <div style="font-size: 28px; font-weight: bold;" id="challengeCount">0</div>
                            <div style="font-size: 14px; opacity: 0.9;">Meydan Okuma</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tab Navigation -->
            <div style="background: var(--card-bg); border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                <div style="display: flex; border-bottom: 2px solid var(--border);">
                    <button
                        onclick="switchTab('info')"
                        id="tab-info"
                        class="profile-tab ${activeTab === 'info' ? 'active' : ''}"
                        style="flex: 1; padding: 1.25rem; background: none; border: none; cursor: pointer; font-weight: 600; font-size: 1rem; color: ${activeTab === 'info' ? 'var(--primary)' : 'var(--text-light)'}; border-bottom: 3px solid ${activeTab === 'info' ? 'var(--primary)' : 'transparent'}; transition: all 0.3s;">
                        📋 Genel Bilgiler
                    </button>
                    <button
                        onclick="switchTab('challenges')"
                        id="tab-challenges"
                        class="profile-tab ${activeTab === 'challenges' ? 'active' : ''}"
                        style="flex: 1; padding: 1.25rem; background: none; border: none; cursor: pointer; font-weight: 600; font-size: 1rem; color: ${activeTab === 'challenges' ? 'var(--primary)' : 'var(--text-light)'}; border-bottom: 3px solid ${activeTab === 'challenges' ? 'var(--primary)' : 'transparent'}; transition: all 0.3s;">
                        🎯 Meydan Okumalarım (${userChallenges.length})
                    </button>
                    <button
                        onclick="switchTab('submissions')"
                        id="tab-submissions"
                        class="profile-tab ${activeTab === 'submissions' ? 'active' : ''}"
                        style="flex: 1; padding: 1.25rem; background: none; border: none; cursor: pointer; font-weight: 600; font-size: 1rem; color: ${activeTab === 'submissions' ? 'var(--primary)' : 'var(--text-light)'}; border-bottom: 3px solid ${activeTab === 'submissions' ? 'var(--primary)' : 'transparent'}; transition: all 0.3s;">
                        📸 Gönderilerim (${userSubmissions.length})
                    </button>
                    <button
                        onclick="switchTab('teams')"
                        id="tab-teams"
                        class="profile-tab ${activeTab === 'teams' ? 'active' : ''}"
                        style="flex: 1; padding: 1.25rem; background: none; border: none; cursor: pointer; font-weight: 600; font-size: 1rem; color: ${activeTab === 'teams' ? 'var(--primary)' : 'var(--text-light)'}; border-bottom: 3px solid ${activeTab === 'teams' ? 'var(--primary)' : 'transparent'}; transition: all 0.3s;">
                        👥 Takımlarım (${userTeams.length})
                    </button>
                </div>

                <!-- Tab Content -->
                <div id="tabContent" style="padding: 2rem;">
                    ${activeTab === 'info' ? renderInfoTab() : (activeTab === 'challenges' ? renderChallengesTab() : (activeTab === 'submissions' ? renderSubmissionsTab() : renderTeamsTab()))}
                </div>
            </div>
        </div>
    `;
}

// Genel Bilgiler Tab'ını render et
function renderInfoTab() {
    const user = currentUser;
    return `
        <div style="display: grid; gap: 1.5rem;">
            <div>
                <label style="display: block; color: var(--text-light); font-size: 14px; margin-bottom: 0.5rem; font-weight: 600;">📧 E-posta</label>
                <div style="color: var(--text); font-size: 1.05rem;">${user.email}</div>
            </div>

            <div>
                <label style="display: block; color: var(--text-light); font-size: 14px; margin-bottom: 0.5rem; font-weight: 600;">📅 Kayıt Tarihi</label>
                <div style="color: var(--text); font-size: 1.05rem;">${new Date(user.created_at).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}</div>
            </div>

            <div style="margin-top: 1rem; padding-top: 2rem; border-top: 2px solid var(--border);">
                <button onclick="handleLogout()" class="btn btn-danger" style="width: 100%; padding: 1rem; font-size: 1.05rem;">
                    🚪 Çıkış Yap
                </button>
            </div>
        </div>
    `;
}

// Meydan Okumalarım Tab'ını render et
function renderChallengesTab() {
    if (userChallenges.length === 0) {
        return `
            <div class="empty-state">
                <div class="empty-icon">🎯</div>
                <p style="margin: 1rem 0;">Henüz bir meydan okumaya katılmadınız</p>
                <a href="/challenges" class="btn btn-primary">Meydan Okumalara Göz At</a>
            </div>
        `;
    }

    return `
        <div style="display: grid; gap: 1.5rem;">
            ${userChallenges.map(challenge => renderChallengeCard(challenge)).join('')}
        </div>
    `;
}

// Kullanıcının meydan okuma kartını render et
function renderChallengeCard(challenge) {
    const difficultyClass = `difficulty-${challenge.difficulty}`;

    // Tarih hesaplamaları
    const now = new Date();
    const startDate = new Date(challenge.start_date);
    const endDate = new Date(challenge.end_date);

    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.max(0, Math.ceil((now - startDate) / (1000 * 60 * 60 * 24)));
    const daysRemaining = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
    const progressPercentage = Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100));

    // Durum belirleme
    let statusBadge = '';
    let statusClass = '';
    if (challenge.participation_status === 'tamamlandi') {
        statusBadge = '<span style="padding: 0.5rem 1rem; background: #10b981; color: white; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">✓ Tamamlandı</span>';
        statusClass = 'completed';
    } else if (challenge.participation_status === 'vazgecti') {
        statusBadge = '<span style="padding: 0.5rem 1rem; background: #ef4444; color: white; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">✗ Vazgeçti</span>';
        statusClass = 'abandoned';
    } else if (now > endDate) {
        statusBadge = '<span style="padding: 0.5rem 1rem; background: #6b7280; color: white; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">⏱️ Süresi Doldu</span>';
        statusClass = 'expired';
    } else {
        statusBadge = '<span style="padding: 0.5rem 1rem; background: var(--primary); color: white; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">🔥 Aktif</span>';
        statusClass = 'active';
    }

    return `
        <div onclick="window.location.href='/challenge/${challenge.id}'" style="
            background: var(--card-bg);
            padding: 1.5rem;
            border-radius: 12px;
            border: 2px solid var(--border);
            cursor: pointer;
            transition: all 0.3s;
        " onmouseover="this.style.borderColor='var(--primary)'; this.style.transform='translateX(5px)';"
           onmouseout="this.style.borderColor='var(--border)'; this.style.transform='translateX(0)';">

            <!-- Header -->
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem; gap: 1rem; flex-wrap: wrap;">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; flex-wrap: wrap;">
                        ${challenge.category_icon ? `<span>${challenge.category_icon}</span>` : ''}
                        <span class="challenge-difficulty ${difficultyClass}">${challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}</span>
                        ${statusBadge}
                    </div>
                    <h3 style="margin: 0 0 0.5rem 0; font-size: 1.25rem; color: var(--text);">${challenge.title}</h3>
                    <p style="margin: 0; color: var(--text-light); font-size: 0.9rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                        ${challenge.description}
                    </p>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: var(--secondary);">🏆 ${challenge.points}</div>
                    <div style="font-size: 0.85rem; color: var(--text-light);">puan</div>
                </div>
            </div>

            <!-- Progress -->
            <div style="margin: 1rem 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <span style="font-size: 0.85rem; color: var(--text-light);">İlerleme</span>
                    <span style="font-size: 0.85rem; font-weight: 600; color: var(--primary);">${Math.round(progressPercentage)}%</span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${progressPercentage}%"></div>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-light);">
                    <span>📅 ${formatDate(challenge.start_date)}</span>
                    <span>${daysElapsed}/${totalDays} gün</span>
                    <span>🏁 ${formatDate(challenge.end_date)}</span>
                </div>
            </div>

            <!-- Stats -->
            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid var(--border);">
                <div style="display: flex; gap: 1.5rem;">
                    <span style="color: var(--text-light); font-size: 0.9rem;">👥 ${challenge.participant_count} katılımcı</span>
                    <span style="color: var(--text-light); font-size: 0.9rem;">📆 ${new Date(challenge.joined_at).toLocaleDateString('tr-TR')} tarihinde katıldın</span>
                </div>
                <span style="color: var(--primary); font-weight: 600; font-size: 0.9rem;">Detayları Gör →</span>
            </div>
        </div>
    `;
}

// Kullanıcının challenge'larını yükle
async function loadUserChallenges() {
    try {
        const response = await fetch('/api/auth/my-challenges', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            userChallenges = data.challenges || [];

            // Challenge sayısını güncelle
            const challengeCount = document.getElementById('challengeCount');
            if (challengeCount) {
                challengeCount.textContent = userChallenges.length;
            }
        }
    } catch (error) {
        console.error('Challenge sayısı yüklenemedi:', error);
    }
}

// Kullanıcının submission'larını yükle
async function loadUserSubmissions() {
    try {
        const response = await fetch('/api/auth/my-submissions', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            userSubmissions = data.submissions || [];
        }
    } catch (error) {
        console.error('Submission sayısı yüklenemedi:', error);
    }
}

// Kullanıcının takımlarını yükle
async function loadUserTeams() {
    try {
        // Kullanıcının katıldığı tüm takım challenge'larını al
        const teamChallenges = userChallenges.filter(c => c.is_team_based);

        // Her takım challenge için takım bilgilerini çek
        const teamPromises = teamChallenges.map(async (challenge) => {
            try {
                const teams = await TeamAPI.getByChallenge(challenge.id);
                // Kullanıcının üye olduğu takımı bul
                const userTeam = teams.teams.find(team =>
                    team.members && team.members.some(member => member.user_id === currentUser.id)
                );
                if (userTeam) {
                    return {
                        ...userTeam,
                        challenge_title: challenge.title,
                        challenge_id: challenge.id,
                        challenge_icon: challenge.category_icon
                    };
                }
                return null;
            } catch (error) {
                console.error(`Takım bilgisi yüklenemedi (challenge ${challenge.id}):`, error);
                return null;
            }
        });

        const teams = await Promise.all(teamPromises);
        userTeams = teams.filter(t => t !== null);

    } catch (error) {
        console.error('Takım sayısı yüklenemedi:', error);
        userTeams = [];
    }
}

// Gönderilerim Tab'ını render et
function renderSubmissionsTab() {
    if (userSubmissions.length === 0) {
        return `
            <div class="empty-state">
                <div class="empty-icon">📸</div>
                <p style="margin: 1rem 0;">Henüz gönderi yok</p>
                <a href="/challenges" class="btn btn-primary">Meydan Okumalara Katıl</a>
            </div>
        `;
    }

    return `
        <div style="display: grid; gap: 1.5rem;">
            ${userSubmissions.map(submission => renderSubmissionCard(submission)).join('')}
        </div>
    `;
}

// Submission kartını render et
function renderSubmissionCard(s) {
    const statusBadge = {
        'beklemede': '<span style="padding: 0.5rem 1rem; background: #f59e0b; color: white; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">⏳ Onay Bekliyor</span>',
        'onaylandi': '<span style="padding: 0.5rem 1rem; background: #10b981; color: white; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">✓ Onaylandı</span>',
        'reddedildi': '<span style="padding: 0.5rem 1rem; background: #ef4444; color: white; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">✗ Reddedildi</span>'
    };

    const isVideo = s.media_type === 'video' || (s.media_url && (s.media_url.includes('.mp4') || s.media_url.includes('video')));

    return `
        <div style="
            background: var(--card-bg);
            padding: 1.5rem;
            border-radius: 12px;
            border: 2px solid var(--border);
            transition: all 0.3s;
            display: grid;
            grid-template-columns: ${s.media_url ? '200px 1fr auto' : '1fr auto'};
            gap: 1.5rem;
            align-items: center;
        " onmouseover="this.style.borderColor='var(--primary)'; this.style.transform='translateX(5px)';"
           onmouseout="this.style.borderColor='var(--border)'; this.style.transform='translateX(0)';">

            <!-- Thumbnail/Preview -->
            ${s.media_url ? (isVideo ? `
                <div style="position: relative; width: 200px; height: 150px;">
                    <video style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px; background: #000;">
                        <source src="${s.media_url}" type="video/mp4">
                    </video>
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 3rem; opacity: 0.8; pointer-events: none;">▶️</div>
                </div>
            ` : `
                <img src="${s.media_url}" alt="Submission" style="width: 200px; height: 150px; object-fit: cover; border-radius: 8px;">
            `) : ''}

            <!-- Content -->
            <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; flex-wrap: wrap;">
                    ${s.category_icon ? `<span>${s.category_icon}</span>` : ''}
                    <strong style="color: var(--text); font-size: 1.1rem;">${s.challenge_title}</strong>
                    ${statusBadge[s.status]}
                </div>

                ${s.location ? `
                    <div style="margin-bottom: 0.5rem; color: var(--text); font-size: 0.95rem;">
                        📍 <strong>${s.location}</strong>
                    </div>
                ` : ''}

                <p style="color: var(--text-light); margin-bottom: 0.75rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                    ${s.content || ''}
                </p>

                <div style="display: flex; gap: 1.5rem; font-size: 0.9rem; color: var(--text-light);">
                    <span>❤️ ${s.likes_count || 0} beğeni</span>
                    <span>💬 ${s.comments_count || 0} yorum</span>
                    <span>📅 ${new Date(s.created_at).toLocaleDateString('tr-TR')}</span>
                </div>
            </div>

            <!-- Actions -->
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                <a href="/challenge/${s.challenge_id}" class="btn btn-primary" style="padding: 0.75rem 1.5rem; text-decoration: none; text-align: center; white-space: nowrap;">
                    👁️ Görüntüle
                </a>
                <button onclick="deleteSubmission(${s.id})" class="btn btn-danger" style="padding: 0.75rem 1.5rem; white-space: nowrap;">
                    🗑️ Sil
                </button>
            </div>
        </div>
    `;
}

// Submission sil
async function deleteSubmission(submissionId) {
    if (!confirm('Bu gönderiyi silmek istediğinizden emin misiniz?')) {
        return;
    }

    try {
        const response = await fetch(`/api/submissions/${submissionId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Gönderi silinemedi');
        }

        showSuccess('Gönderi başarıyla silindi');

        // Listeyi yenile
        await loadUserSubmissions();
        renderProfile();

    } catch (error) {
        showError(error.message || 'Gönderi silinirken bir hata oluştu');
    }
}

// Takımlarım Tab'ını render et
function renderTeamsTab() {
    if (userTeams.length === 0) {
        return `
            <div class="empty-state">
                <div class="empty-icon">👥</div>
                <p style="margin: 1rem 0;">Henüz bir takıma katılmadınız</p>
                <a href="/challenges?team=team" class="btn btn-primary">Takım Meydan Okumalarına Göz At</a>
            </div>
        `;
    }

    return `
        <div style="display: grid; gap: 1.5rem;">
            ${userTeams.map(team => renderTeamCard(team)).join('')}
        </div>
    `;
}

// Takım kartını render et
function renderTeamCard(team) {
    const isCaptain = team.captain_id === currentUser.id;
    const memberCount = team.members.length;

    return `
        <div style="
            background: var(--card-bg);
            padding: 1.5rem;
            border-radius: 12px;
            border: 2px solid ${isCaptain ? 'var(--primary)' : 'var(--border)'};
            transition: all 0.3s;
        " onmouseover="this.style.borderColor='var(--primary)'; this.style.transform='translateX(5px)';"
           onmouseout="this.style.borderColor='${isCaptain ? 'var(--primary)' : 'var(--border)'}'; this.style.transform='translateX(0)';">

            <!-- Header -->
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem; gap: 1rem;">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; flex-wrap: wrap;">
                        ${team.challenge_icon ? `<span style="font-size: 1.5rem;">${team.challenge_icon}</span>` : ''}
                        <h3 style="margin: 0; font-size: 1.25rem; color: var(--text);">${team.name}</h3>
                        ${isCaptain ? '<span style="padding: 0.25rem 0.75rem; background: var(--primary); color: white; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">👑 Kaptan</span>' : ''}
                    </div>
                    <p style="margin: 0.5rem 0; color: var(--text-light); font-size: 0.9rem;">
                        ${team.challenge_title}
                    </p>
                </div>
            </div>

            <!-- Takım Üyeleri -->
            <div style="margin: 1rem 0; padding: 1rem; background: rgba(99, 102, 241, 0.05); border-radius: 8px;">
                <div style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 0.5rem;">Takım Üyeleri (${memberCount})</div>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                    ${team.members.map(member => `
                        <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; background: var(--card-bg); border-radius: 8px; border: 1px solid var(--border);">
                            ${member.avatar_url
                                ? `<img src="${member.avatar_url}" alt="${member.username}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;">`
                                : `<div style="width: 24px; height: 24px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">${member.username.charAt(0).toUpperCase()}</div>`
                            }
                            <span style="font-size: 0.85rem; color: var(--text);">
                                ${member.username}
                                ${member.user_id === team.captain_id ? ' 👑' : ''}
                            </span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Actions -->
            <div style="display: flex; gap: 1rem; padding-top: 1rem; border-top: 1px solid var(--border);">
                <a href="/challenge/${team.challenge_id}" class="btn btn-primary" style="flex: 1; text-align: center; text-decoration: none;">
                    🎯 Challenge'a Git
                </a>
                ${!isCaptain ? `
                    <button onclick="leaveTeamFromProfile(${team.id}, ${team.challenge_id})" class="btn btn-danger" style="flex: 1;">
                        🚪 Takımdan Ayrıl
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

// Profil sayfasından takımdan ayrıl
async function leaveTeamFromProfile(teamId, challengeId) {
    if (!confirm('Takımdan ayrılmak istediğinize emin misiniz?')) {
        return;
    }

    try {
        await TeamAPI.leave(teamId);
        showSuccess('Takımdan ayrıldınız');

        // Takım listesini ve challenge listesini yenile
        await loadUserChallenges();
        await loadUserTeams();
        renderProfile();

    } catch (error) {
        showError(error.message || 'Takımdan ayrılırken bir hata oluştu');
    }
}

// Tab değiştir
function switchTab(tab) {
    activeTab = tab;
    renderProfile();
}

// Sayfa yüklendiğinde
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadProfile);
} else {
    loadProfile();
}
