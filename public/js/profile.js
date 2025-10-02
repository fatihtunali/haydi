// Profile sayfası

let currentUser = null;
let userChallenges = [];
let userSubmissions = [];
let userTeams = [];
let myChallenges = []; // Kullanıcının oluşturduğu challenge'lar
let userBadges = []; // Kullanıcının badge'leri
let followStats = null; // Takipçi/takip edilen sayıları
let activeTab = 'info'; // 'info', 'challenges', 'submissions', 'teams', 'created-challenges'
let isOwnProfile = true; // Kendi profilimizi mi yoksa başka birinin profilini mi görüntülüyoruz?
let viewingUserId = null; // Görüntülediğimiz kullanıcı ID'si

// Global refresh fonksiyonu - diğer sayfalarda takım değişikliklerinden sonra çağrılabilir
window.refreshProfileTeams = async function() {
    if (!currentUser) return; // Profil sayfası yüklü değilse işlem yapma

    await loadUserChallenges();
    await loadUserTeams();

    // Eğer teams tab'ındaysak render'ı güncelle
    if (activeTab === 'teams') {
        renderProfile();
    }
};

async function loadProfile() {
    const profileContent = document.getElementById('profileContent');

    // window.viewingUserId varsa onu kullan, yoksa kendi profilimizi yükle
    viewingUserId = window.viewingUserId || null;

    // Başka kullanıcının profilini görüntülüyorsak login kontrolü yapma
    if (!viewingUserId && !isLoggedIn()) {
        window.location.href = '/login';
        return;
    }

    try {
        showLoading(profileContent);

        // Kendi profilimizi mi yoksa başka birinin profilini mi görüntülüyoruz?
        if (viewingUserId) {
            // Başka kullanıcının profilini yükle
            isOwnProfile = false;
            const data = await AuthAPI.getUserById(viewingUserId);
            currentUser = data.user;
        } else {
            // Kendi profilimizi yükle
            isOwnProfile = true;
            const data = await AuthAPI.getProfile();
            currentUser = data.user;
        }

        // Kullanıcının challenge'larını, submission'larını ve takımlarını yükle (render'dan ÖNCE)
        await loadUserChallenges();
        await loadUserSubmissions();
        await loadUserTeams();

        // Sadece kendi profilimizde oluşturduğumuz challenge'ları göster
        if (isOwnProfile) {
            await loadMyChallenges();
        }

        await loadUserBadges();
        await loadFollowStats();

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
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                            <h1 style="margin: 0; font-size: 2rem;">
                                ${user.full_name || user.username}
                            </h1>
                            ${isOwnProfile ? `
                                <button onclick="openEditProfileModal()" style="padding: 0.4rem 0.8rem; background: rgba(255,255,255,0.2); color: white; border: 2px solid rgba(255,255,255,0.4); border-radius: 8px; font-weight: 600; font-size: 0.85rem; cursor: pointer; backdrop-filter: blur(10px); transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.3)';" onmouseout="this.style.background='rgba(255,255,255,0.2)';">
                                    ✏️ Düzenle
                                </button>
                            ` : ''}
                        </div>
                        <p style="margin: 0 0 1rem 0; opacity: 0.9; font-size: 1.1rem;">@${user.username}</p>
                        ${user.bio ? `<p style="margin: 0; opacity: 0.9;">${user.bio}</p>` : (isOwnProfile ? '<p style="margin: 0; opacity: 0.7; font-style: italic;">Bio eklemek için profili düzenle</p>' : '<p style="margin: 0; opacity: 0.7; font-style: italic;">Henüz bio eklenmemiş</p>')}
                    </div>

                    <!-- İstatistikler -->
                    <div style="display: flex; gap: 1.5rem; flex-wrap: wrap;">
                        <div style="text-align: center; background: rgba(255,255,255,0.2); padding: 1rem 1.25rem; border-radius: 12px; backdrop-filter: blur(10px);">
                            <div style="font-size: 24px; font-weight: bold;">${user.points || 0}</div>
                            <div style="font-size: 13px; opacity: 0.9;">Puan</div>
                        </div>
                        <div style="text-align: center; background: rgba(255,255,255,0.2); padding: 1rem 1.25rem; border-radius: 12px; backdrop-filter: blur(10px);">
                            <div style="font-size: 24px; font-weight: bold;" id="challengeCount">0</div>
                            <div style="font-size: 13px; opacity: 0.9;">Challenge</div>
                        </div>
                        <div style="text-align: center; background: rgba(255,255,255,0.2); padding: 1rem 1.25rem; border-radius: 12px; backdrop-filter: blur(10px); cursor: pointer; transition: all 0.2s;" onclick="openFollowersModal()" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                            <div style="font-size: 24px; font-weight: bold;">${followStats ? followStats.follower_count : 0}</div>
                            <div style="font-size: 13px; opacity: 0.9;">Takipçi</div>
                        </div>
                        <div style="text-align: center; background: rgba(255,255,255,0.2); padding: 1rem 1.25rem; border-radius: 12px; backdrop-filter: blur(10px); cursor: pointer; transition: all 0.2s;" onclick="openFollowingModal()" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                            <div style="font-size: 24px; font-weight: bold;">${followStats ? followStats.following_count : 0}</div>
                            <div style="font-size: 13px; opacity: 0.9;">Takip</div>
                        </div>
                        <div style="text-align: center; background: rgba(255,255,255,0.2); padding: 1rem 1.25rem; border-radius: 12px; backdrop-filter: blur(10px);">
                            <div style="font-size: 24px; font-weight: bold;">${userBadges.filter(b => b.earned).length}</div>
                            <div style="font-size: 13px; opacity: 0.9;">Rozet</div>
                        </div>
                    </div>

                    <!-- Takip Et Butonu (Başka birinin profilindeyse) -->
                    ${!isOwnProfile && isLoggedIn() ? `
                        <div style="margin-top: 2rem; width: 100%;">
                            <button id="followButton" onclick="toggleFollow()" style="width: 100%; padding: 1rem 2rem; background: ${followStats && followStats.is_following ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #10b981, #059669)'}; color: white; border: none; border-radius: 12px; font-weight: 700; font-size: 1.1rem; cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 15px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; gap: 0.75rem;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(0,0,0,0.3)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.2)';">
                                <span style="font-size: 1.5rem;">${followStats && followStats.is_following ? '❌' : '➕'}</span>
                                <span>${followStats && followStats.is_following ? 'Takibi Bırak' : 'Takip Et'}</span>
                            </button>
                        </div>
                    ` : ''}
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
                        🎯 ${isOwnProfile ? 'Meydan Okumalarım' : 'Meydan Okumaları'} (${userChallenges.length})
                    </button>
                    <button
                        onclick="switchTab('submissions')"
                        id="tab-submissions"
                        class="profile-tab ${activeTab === 'submissions' ? 'active' : ''}"
                        style="flex: 1; padding: 1.25rem; background: none; border: none; cursor: pointer; font-weight: 600; font-size: 1rem; color: ${activeTab === 'submissions' ? 'var(--primary)' : 'var(--text-light)'}; border-bottom: 3px solid ${activeTab === 'submissions' ? 'var(--primary)' : 'transparent'}; transition: all 0.3s;">
                        📸 ${isOwnProfile ? 'Gönderilerim' : 'Gönderileri'} (${userSubmissions.length})
                    </button>
                    <button
                        onclick="switchTab('teams')"
                        id="tab-teams"
                        class="profile-tab ${activeTab === 'teams' ? 'active' : ''}"
                        style="flex: 1; padding: 1.25rem; background: none; border: none; cursor: pointer; font-weight: 600; font-size: 1rem; color: ${activeTab === 'teams' ? 'var(--primary)' : 'var(--text-light)'}; border-bottom: 3px solid ${activeTab === 'teams' ? 'var(--primary)' : 'transparent'}; transition: all 0.3s;">
                        👥 Takımlar (${userTeams.length})
                    </button>
                    ${isOwnProfile ? `
                        <button
                            onclick="switchTab('created-challenges')"
                            id="tab-created-challenges"
                            class="profile-tab ${activeTab === 'created-challenges' ? 'active' : ''}"
                            style="flex: 1; padding: 1.25rem; background: none; border: none; cursor: pointer; font-weight: 600; font-size: 1rem; color: ${activeTab === 'created-challenges' ? 'var(--primary)' : 'var(--text-light)'}; border-bottom: 3px solid ${activeTab === 'created-challenges' ? 'var(--primary)' : 'transparent'}; transition: all 0.3s;">
                            ✏️ Oluşturduklarım (${myChallenges.length})
                        </button>
                    ` : ''}
                </div>

                <!-- Tab Content -->
                <div id="tabContent" style="padding: 2rem;">
                    ${activeTab === 'info' ? renderInfoTab() : (activeTab === 'challenges' ? renderChallengesTab() : (activeTab === 'submissions' ? renderSubmissionsTab() : (activeTab === 'teams' ? renderTeamsTab() : renderCreatedChallengesTab())))}
                </div>
            </div>
        </div>
    `;
}

// Genel Bilgiler Tab'ını render et
function renderInfoTab() {
    const user = currentUser;
    const earnedBadges = userBadges.filter(b => b.earned);
    const unearnedBadges = userBadges.filter(b => !b.earned);

    return `
        <div style="display: grid; gap: 1.5rem;">
            ${isOwnProfile ? `
                <div>
                    <label style="display: block; color: var(--text-light); font-size: 14px; margin-bottom: 0.5rem; font-weight: 600;">📧 E-posta</label>
                    <div style="color: var(--text); font-size: 1.05rem;">${user.email}</div>
                </div>
            ` : ''}

            <div>
                <label style="display: block; color: var(--text-light); font-size: 14px; margin-bottom: 0.5rem; font-weight: 600;">📅 ${isOwnProfile ? 'Kayıt Tarihi' : 'Üye Olma Tarihi'}</label>
                <div style="color: var(--text); font-size: 1.05rem;">${new Date(user.created_at).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}</div>
            </div>

            <!-- Rozetler Bölümü -->
            <div style="margin-top: 1rem; padding-top: 2rem; border-top: 2px solid var(--border);">
                <label style="display: block; color: var(--text); font-size: 18px; margin-bottom: 1rem; font-weight: 600;">🏆 Rozetlerim (${earnedBadges.length}/${userBadges.length})</label>

                ${earnedBadges.length > 0 ? `
                    <div style="margin-bottom: 1.5rem;">
                        <div style="font-size: 14px; color: var(--text-light); margin-bottom: 0.75rem; font-weight: 600;">✅ Kazanılan Rozetler</div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 1rem;">
                            ${earnedBadges.map(badge => renderBadgeCard(badge, true)).join('')}
                        </div>
                    </div>
                ` : `
                    <div style="padding: 2rem; text-align: center; background: rgba(99, 102, 241, 0.05); border-radius: 12px; margin-bottom: 1.5rem;">
                        <div style="font-size: 3rem; margin-bottom: 0.5rem;">🏆</div>
                        <p style="color: var(--text-light); margin: 0;">Henüz rozet kazanmadınız. Challenge'lara katılın ve rozetler kazanın!</p>
                    </div>
                `}

                ${unearnedBadges.length > 0 ? `
                    <div>
                        <div style="font-size: 14px; color: var(--text-light); margin-bottom: 0.75rem; font-weight: 600;">🔒 Kazanılmamış Rozetler</div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 1rem;">
                            ${unearnedBadges.map(badge => renderBadgeCard(badge, false)).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>

            ${isOwnProfile ? `
                <div style="margin-top: 1rem; padding-top: 2rem; border-top: 2px solid var(--border);">
                    <button onclick="handleLogout()" class="btn btn-danger" style="width: 100%; padding: 1rem; font-size: 1.05rem;">
                        🚪 Çıkış Yap
                    </button>
                </div>
            ` : ''}
        </div>
    `;
}

// Meydan Okumalarım Tab'ını render et
function renderChallengesTab() {
    if (userChallenges.length === 0) {
        return `
            <div class="empty-state">
                <div class="empty-icon">🎯</div>
                <p style="margin: 1rem 0;">${isOwnProfile ? 'Henüz bir meydan okumaya katılmadınız' : 'Bu kullanıcı henüz bir meydan okumaya katılmamış'}</p>
                ${isOwnProfile ? '<a href="/challenges" class="btn btn-primary">Meydan Okumalara Göz At</a>' : ''}
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
                <p style="margin: 1rem 0;">${isOwnProfile ? 'Henüz gönderi yok' : 'Bu kullanıcının henüz gönderisi yok'}</p>
                ${isOwnProfile ? '<a href="/challenges" class="btn btn-primary">Meydan Okumalara Katıl</a>' : ''}
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
                <p style="margin: 1rem 0;">${isOwnProfile ? 'Henüz bir takıma katılmadınız' : 'Bu kullanıcı henüz bir takımda değil'}</p>
                ${isOwnProfile ? '<a href="/challenges?team=team" class="btn btn-primary">Takım Meydan Okumalarına Göz At</a>' : ''}
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
                ${isCaptain ? `
                    <button onclick="deleteTeamFromProfile(${team.id})" class="btn btn-danger" style="flex: 1;">
                        🗑️ Takımı Sil
                    </button>
                ` : `
                    <button onclick="leaveTeamFromProfile(${team.id}, ${team.challenge_id})" class="btn btn-danger" style="flex: 1;">
                        🚪 Takımdan Ayrıl
                    </button>
                `}
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

// Profil sayfasından takımı sil (kaptan için)
async function deleteTeamFromProfile(teamId) {
    if (!confirm('⚠️ Takımı silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz ve tüm takım üyeleri çıkarılacaktır.')) {
        return;
    }

    try {
        await TeamAPI.delete(teamId);
        showSuccess('Takım silindi');

        // Takım listesini ve challenge listesini yenile
        await loadUserChallenges();
        await loadUserTeams();
        renderProfile();

    } catch (error) {
        showError(error.message || 'Takım silinirken bir hata oluştu');
    }
}

// Kullanıcının oluşturduğu challenge'ları yükle
async function loadMyChallenges() {
    try {
        const data = await ChallengeAPI.getMyChallenges();
        myChallenges = data.challenges || [];
    } catch (error) {
        console.error('Oluşturulan challenge\'lar yüklenemedi:', error);
        myChallenges = [];
    }
}

// Oluşturduklarım Tab'ını render et
function renderCreatedChallengesTab() {
    if (myChallenges.length === 0) {
        return `
            <div class="empty-state">
                <div class="empty-icon">✏️</div>
                <p style="margin: 1rem 0;">Henüz bir challenge oluşturmadınız</p>
                <a href="/create-challenge" class="btn btn-primary">🎯 Challenge Oluştur</a>
            </div>
        `;
    }

    return `
        <div style="display: grid; gap: 1.5rem;">
            ${myChallenges.map(challenge => renderCreatedChallengeCard(challenge)).join('')}
        </div>
    `;
}

// Oluşturulan challenge kartını render et
function renderCreatedChallengeCard(challenge) {
    const statusColors = {
        'taslak': { bg: 'rgba(107, 114, 128, 0.1)', border: '#6b7280', text: '#6b7280', icon: '📝', label: 'Taslak' },
        'beklemede': { bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b', text: '#f59e0b', icon: '⏳', label: 'Onay Bekliyor' },
        'aktif': { bg: 'rgba(16, 185, 129, 0.1)', border: '#10b981', text: '#10b981', icon: '✅', label: 'Aktif' },
        'bitti': { bg: 'rgba(107, 114, 128, 0.1)', border: '#6b7280', text: '#6b7280', icon: '🏁', label: 'Bitti' },
        'iptal': { bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444', text: '#ef4444', icon: '❌', label: 'İptal' }
    };

    const status = statusColors[challenge.status] || statusColors['taslak'];
    const difficultyClass = `difficulty-${challenge.difficulty}`;

    return `
        <div style="
            background: var(--card-bg);
            padding: 1.5rem;
            border-radius: 12px;
            border: 2px solid ${status.border};
            transition: all 0.3s;
        " onmouseover="this.style.transform='translateX(5px)';"
           onmouseout="this.style.transform='translateX(0)';">

            <!-- Header -->
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem; gap: 1rem; flex-wrap: wrap;">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; flex-wrap: wrap;">
                        ${challenge.category_icon ? `<span style="font-size: 1.5rem;">${challenge.category_icon}</span>` : ''}
                        <span class="challenge-difficulty ${difficultyClass}">${challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}</span>
                        <span style="padding: 0.5rem 1rem; background: ${status.bg}; border: 2px solid ${status.border}; color: ${status.text}; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">
                            ${status.icon} ${status.label}
                        </span>
                    </div>
                    <h3 style="margin: 0 0 0.5rem 0; font-size: 1.25rem; color: var(--text);">${challenge.title}</h3>
                    <p style="margin: 0; color: var(--text-light); font-size: 0.9rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                        ${challenge.description}
                    </p>
                </div>
            </div>

            <!-- Stats -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem; margin: 1rem 0; padding: 1rem; background: rgba(99, 102, 241, 0.05); border-radius: 8px;">
                <div style="text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: var(--secondary);">🏆 ${challenge.points}</div>
                    <div style="font-size: 0.85rem; color: var(--text-light);">Puan</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: var(--primary);">👥 ${challenge.participant_count || 0}</div>
                    <div style="font-size: 0.85rem; color: var(--text-light);">Katılımcı</div>
                </div>
                ${challenge.is_team_based ? `
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: var(--primary);">🎭 ${challenge.min_team_size}-${challenge.max_team_size}</div>
                        <div style="font-size: 0.85rem; color: var(--text-light);">Takım</div>
                    </div>
                ` : ''}
            </div>

            <!-- Dates -->
            <div style="display: flex; justify-content: space-between; margin: 1rem 0; font-size: 0.9rem; color: var(--text-light);">
                <span>📅 ${formatDate(challenge.start_date)}</span>
                <span>→</span>
                <span>🏁 ${formatDate(challenge.end_date)}</span>
            </div>

            <!-- Actions -->
            <div style="display: flex; gap: 1rem; padding-top: 1rem; border-top: 1px solid var(--border);">
                ${challenge.status === 'taslak' || challenge.status === 'beklemede' ? `
                    <a href="/edit-challenge/${challenge.id}" class="btn btn-primary" style="flex: 1; text-align: center; text-decoration: none;">
                        ✏️ Düzenle
                    </a>
                ` : `
                    <a href="/challenge/${challenge.id}" class="btn btn-primary" style="flex: 1; text-align: center; text-decoration: none;">
                        👁️ Görüntüle
                    </a>
                `}
                ${challenge.status === 'aktif' || challenge.status === 'bitti' ? '' : `
                    <button onclick="deleteCreatedChallenge(${challenge.id})" class="btn btn-danger" style="flex: 1;">
                        🗑️ Sil
                    </button>
                `}
            </div>
        </div>
    `;
}

// Oluşturulan challenge'ı sil
async function deleteCreatedChallenge(challengeId) {
    if (!confirm('⚠️ Bu challenge\'ı silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz.')) {
        return;
    }

    try {
        await ChallengeAPI.delete(challengeId);
        showSuccess('Challenge başarıyla silindi');

        // Listeyi yenile
        await loadMyChallenges();
        renderProfile();

    } catch (error) {
        showError(error.message || 'Challenge silinirken bir hata oluştu');
    }
}

// Tab değiştir
function switchTab(tab) {
    activeTab = tab;
    renderProfile();
}

// Profil düzenleme modalını aç
function openEditProfileModal() {
    const user = currentUser;

    // Modal HTML
    const modalHTML = `
        <div id="editProfileModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem;">
            <div style="background: var(--card-bg); border-radius: 16px; padding: 2rem; max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h2 style="margin: 0; color: var(--text);">✏️ Profili Düzenle</h2>
                    <button onclick="closeEditProfileModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-light);">×</button>
                </div>

                <form id="editProfileForm" style="display: grid; gap: 1.5rem;">
                    <!-- Avatar -->
                    <div style="text-align: center;">
                        <div style="position: relative; display: inline-block;">
                            ${user.avatar_url
                                ? `<img id="avatarPreview" src="${user.avatar_url}" alt="Avatar" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 4px solid var(--border);">`
                                : `<div id="avatarPreview" style="width: 120px; height: 120px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-size: 48px; font-weight: bold; border: 4px solid var(--border);">${user.username.charAt(0).toUpperCase()}</div>`
                            }
                            <label for="avatarInput" style="position: absolute; bottom: 0; right: 0; background: var(--primary); color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 3px solid var(--card-bg); font-size: 1.2rem;">
                                📷
                            </label>
                            <input type="file" id="avatarInput" accept="image/*" style="display: none;" onchange="handleAvatarChange(event)">
                        </div>
                        <p style="margin: 0.5rem 0 0 0; font-size: 0.85rem; color: var(--text-light);">Avatar değiştirmek için tıkla (Max 5MB)</p>
                    </div>

                    <!-- İsim -->
                    <div>
                        <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: var(--text);">İsim</label>
                        <input type="text" id="fullNameInput" value="${user.full_name || ''}" placeholder="İsminiz" maxlength="100" style="width: 100%; padding: 0.75rem; border: 2px solid var(--border); border-radius: 8px; font-size: 1rem; background: var(--bg); color: var(--text);">
                    </div>

                    <!-- Bio -->
                    <div>
                        <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: var(--text);">Bio</label>
                        <textarea id="bioInput" placeholder="Kendinizden bahsedin..." maxlength="500" rows="4" style="width: 100%; padding: 0.75rem; border: 2px solid var(--border); border-radius: 8px; font-size: 1rem; background: var(--bg); color: var(--text); resize: vertical;">${user.bio || ''}</textarea>
                        <p style="margin: 0.25rem 0 0 0; font-size: 0.85rem; color: var(--text-light); text-align: right;"><span id="bioCounter">${(user.bio || '').length}</span>/500</p>
                    </div>

                    <!-- Butonlar -->
                    <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                        <button type="button" onclick="closeEditProfileModal()" class="btn btn-secondary" style="flex: 1;">İptal</button>
                        <button type="submit" class="btn btn-primary" style="flex: 1;">💾 Kaydet</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Modal'ı ekle
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Bio counter
    document.getElementById('bioInput').addEventListener('input', (e) => {
        document.getElementById('bioCounter').textContent = e.target.value.length;
    });

    // Form submit
    document.getElementById('editProfileForm').addEventListener('submit', handleProfileUpdate);
}

// Modal'ı kapat
function closeEditProfileModal() {
    const modal = document.getElementById('editProfileModal');
    if (modal) {
        modal.remove();
    }
}

// Avatar değişikliği
let selectedAvatarFile = null;
function handleAvatarChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Dosya kontrolü
    if (!file.type.startsWith('image/')) {
        showError('Sadece resim dosyaları yüklenebilir');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showError('Avatar boyutu en fazla 5MB olabilir');
        return;
    }

    selectedAvatarFile = file;

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById('avatarPreview');
        if (preview.tagName === 'IMG') {
            preview.src = e.target.result;
        } else {
            // Div ise img'e çevir
            const img = document.createElement('img');
            img.id = 'avatarPreview';
            img.src = e.target.result;
            img.style.cssText = 'width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 4px solid var(--border);';
            preview.replaceWith(img);
        }
    };
    reader.readAsDataURL(file);
}

// Profil güncelleme
async function handleProfileUpdate(e) {
    e.preventDefault();

    const fullName = document.getElementById('fullNameInput').value.trim();
    const bio = document.getElementById('bioInput').value.trim();

    try {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Kaydediliyor...';

        // Önce profil bilgilerini güncelle
        const data = await AuthAPI.updateProfile({ full_name: fullName, bio });
        currentUser = data.user;

        // Avatar değiştiyse onu da güncelle
        if (selectedAvatarFile) {
            const formData = new FormData();
            formData.append('avatar', selectedAvatarFile);
            const avatarData = await AuthAPI.updateAvatar(formData);
            currentUser = avatarData.user;
        }

        // LocalStorage'ı güncelle
        const storedUser = JSON.parse(localStorage.getItem('user'));
        storedUser.full_name = currentUser.full_name;
        storedUser.bio = currentUser.bio;
        storedUser.avatar_url = currentUser.avatar_url;
        localStorage.setItem('user', JSON.stringify(storedUser));

        showSuccess('Profil güncellendi!');
        closeEditProfileModal();
        renderProfile();

        // Header'ı güncelle
        if (window.updateAuthButtons) {
            window.updateAuthButtons();
        }

        selectedAvatarFile = null;

    } catch (error) {
        showError(error.message || 'Profil güncellenirken bir hata oluştu');
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = '💾 Kaydet';
    }
}

// Kullanıcının badge'lerini yükle
async function loadUserBadges() {
    try {
        const data = await BadgeAPI.getAllBadges();
        userBadges = data.badges || [];
    } catch (error) {
        console.error('Badge\'ler yüklenemedi:', error);
        userBadges = [];
    }
}

// Takipçi/takip edilen sayılarını yükle
async function loadFollowStats() {
    try {
        // Görüntülenen kullanıcının ID'sini kullan
        const userId = viewingUserId || currentUser.id;
        const data = await FollowAPI.getStats(userId);
        followStats = data;
    } catch (error) {
        console.error('Follow stats yüklenemedi:', error);
        followStats = { follower_count: 0, following_count: 0, is_following: false, is_follower: false };
    }
}

// Badge kartını render et
function renderBadgeCard(badge, isEarned) {
    const rarityColors = {
        'common': '#6b7280',
        'rare': '#3b82f6',
        'epic': '#a855f7',
        'legendary': '#f59e0b'
    };

    const rarityLabels = {
        'common': 'Yaygın',
        'rare': 'Nadir',
        'epic': 'Epik',
        'legendary': 'Efsanevi'
    };

    const rarityColor = rarityColors[badge.rarity] || rarityColors.common;
    const rarityLabel = rarityLabels[badge.rarity] || rarityLabels.common;

    return `
        <div style="
            background: ${isEarned ? 'var(--card-bg)' : 'rgba(107, 114, 128, 0.1)'};
            border: 2px solid ${isEarned ? rarityColor : 'var(--border)'};
            border-radius: 12px;
            padding: 1rem;
            text-align: center;
            transition: all 0.3s;
            position: relative;
            ${isEarned ? 'cursor: pointer;' : ''}
            ${!isEarned ? 'opacity: 0.5;' : ''}
        "
        ${isEarned ? `onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 8px 20px rgba(0,0,0,0.15)';"
                     onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';"` : ''}
        title="${badge.description} ${!isEarned ? '- Henüz kazanılmadı' : ''}">

            ${!isEarned ? '<div style="position: absolute; top: 0.5rem; right: 0.5rem; font-size: 1rem;">🔒</div>' : ''}

            <div style="font-size: 3rem; margin-bottom: 0.5rem; ${!isEarned ? 'filter: grayscale(100%);' : ''}">${badge.icon}</div>

            <div style="font-weight: 600; font-size: 0.9rem; color: ${isEarned ? 'var(--text)' : 'var(--text-light)'}; margin-bottom: 0.25rem;">
                ${badge.name}
            </div>

            <div style="font-size: 0.75rem; color: ${rarityColor}; font-weight: 600; margin-bottom: 0.5rem;">
                ${rarityLabel}
            </div>

            <div style="font-size: 0.75rem; color: var(--text-light); line-height: 1.3;">
                ${badge.description}
            </div>

            ${isEarned && badge.earned_at ? `
                <div style="font-size: 0.7rem; color: var(--text-light); margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid var(--border);">
                    📅 ${new Date(badge.earned_at).toLocaleDateString('tr-TR')}
                </div>
            ` : ''}
        </div>
    `;
}

// Basit notification göster
function showNotification(message, type = 'info') {
    // Basit bir alert kullanıyoruz, daha sonra toast yapılabilir
    if (type === 'error') {
        alert('❌ ' + message);
    } else {
        alert('✅ ' + message);
    }
}

// Takip et/bırak butonu
async function toggleFollow() {
    if (!isLoggedIn()) {
        window.location.href = '/login';
        return;
    }

    if (!viewingUserId) return;

    const button = document.getElementById('followButton');
    if (!button) return;

    try {
        // Butonu devre dışı bırak
        button.disabled = true;
        button.style.opacity = '0.6';
        button.style.cursor = 'not-allowed';

        if (followStats.is_following) {
            // Takibi bırak
            await FollowAPI.unfollow(viewingUserId);
            followStats.is_following = false;
            followStats.follower_count--;
            showNotification('Takip bırakıldı', 'success');
        } else {
            // Takip et
            await FollowAPI.follow(viewingUserId);
            followStats.is_following = true;
            followStats.follower_count++;
            showNotification('Takip edildi', 'success');
        }

        // Profili yeniden render et
        renderProfile();

    } catch (error) {
        console.error('Takip işlemi hatası:', error);
        showNotification(error.message || 'Bir hata oluştu', 'error');

        // Butonu tekrar aktif et
        button.disabled = false;
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
    }
}

// Modal state
let followModalState = {
    type: null,
    userId: null,
    offset: 0,
    limit: 50,
    hasMore: true,
    isLoading: false,
    searchQuery: ''
};

// Takipçiler modalını aç
async function openFollowersModal() {
    const userId = viewingUserId || currentUser.id;
    followModalState = { type: 'followers', userId, offset: 0, limit: 50, hasMore: true, isLoading: false, searchQuery: '' };

    const modal = createFollowModal('Takipçiler', userId, 'followers');
    document.body.appendChild(modal);

    await loadFollowList(userId, 'followers', true);
    setupInfiniteScroll('followers');
}

// Takip edilenler modalını aç
async function openFollowingModal() {
    const userId = viewingUserId || currentUser.id;
    followModalState = { type: 'following', userId, offset: 0, limit: 50, hasMore: true, isLoading: false, searchQuery: '' };

    const modal = createFollowModal('Takip Edilenler', userId, 'following');
    document.body.appendChild(modal);

    await loadFollowList(userId, 'following', true);
    setupInfiniteScroll('following');
}

// Modal oluştur
function createFollowModal(title, userId, type) {
    const modal = document.createElement('div');
    modal.id = `${type}-modal`;
    modal.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 9999; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.2s;" onclick="closeFollowModal('${type}')">
            <div style="background: var(--card-bg); border-radius: 16px; width: 90%; max-width: 500px; max-height: 80vh; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.3); display: flex; flex-direction: column;" onclick="event.stopPropagation()">
                <!-- Header -->
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 2px solid var(--border);">
                    <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700;">${title}</h3>
                    <button onclick="closeFollowModal('${type}')" style="background: none; border: none; font-size: 1.75rem; cursor: pointer; color: var(--text-light); padding: 0; line-height: 1; transition: color 0.2s;" onmouseover="this.style.color='var(--text)'" onmouseout="this.style.color='var(--text-light)'">×</button>
                </div>

                <!-- Search Box -->
                <div style="padding: 1rem 1.5rem; border-bottom: 1px solid var(--border);">
                    <input
                        type="text"
                        id="${type}-search"
                        placeholder="🔍 Ara..."
                        onkeyup="handleFollowSearch('${type}', this.value)"
                        style="width: 100%; padding: 0.75rem 1rem; border: 2px solid var(--border); border-radius: 8px; background: var(--bg); color: var(--text); font-size: 0.95rem; outline: none; transition: border-color 0.2s;"
                        onfocus="this.style.borderColor='var(--primary)'"
                        onblur="this.style.borderColor='var(--border)'"
                    >
                </div>

                <!-- List Container -->
                <div id="${type}-list" style="padding: 1rem; flex: 1; overflow-y: auto;">
                    <div style="text-align: center; padding: 2rem; color: var(--text-light);">
                        <div class="loading-spinner" style="margin: 0 auto 1rem;"></div>
                        <p>Yükleniyor...</p>
                    </div>
                </div>

                <!-- Loading indicator for infinite scroll -->
                <div id="${type}-loading" style="display: none; text-align: center; padding: 1rem; color: var(--text-light);">
                    <div class="loading-spinner" style="margin: 0 auto;"></div>
                </div>
            </div>
        </div>
    `;

    return modal;
}

// Modalı kapat
function closeFollowModal(type) {
    const modal = document.getElementById(`${type}-modal`);
    if (modal) {
        modal.remove();
    }
}

// Takip listesini yükle
async function loadFollowList(userId, type, clear = false) {
    const listContainer = document.getElementById(`${type}-list`);
    const loadingIndicator = document.getElementById(`${type}-loading`);

    if (followModalState.isLoading || (!clear && !followModalState.hasMore)) return;

    followModalState.isLoading = true;

    if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
    }

    try {
        const params = {
            limit: followModalState.limit,
            offset: clear ? 0 : followModalState.offset
        };

        if (followModalState.searchQuery) {
            params.search = followModalState.searchQuery;
        }

        const data = type === 'followers'
            ? await FollowAPI.getFollowers(userId, params)
            : await FollowAPI.getFollowing(userId, params);

        const users = data[type] || [];

        // Update state
        if (clear) {
            followModalState.offset = users.length;
        } else {
            followModalState.offset += users.length;
        }
        followModalState.hasMore = users.length === followModalState.limit;

        if (clear || followModalState.offset === users.length) {
            if (users.length === 0) {
                listContainer.innerHTML = `
                    <div style="text-align: center; padding: 3rem; color: var(--text-light);">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">${followModalState.searchQuery ? '🔍' : (type === 'followers' ? '👥' : '👤')}</div>
                        <p>${followModalState.searchQuery ? 'Sonuç bulunamadı' : (type === 'followers' ? 'Henüz takipçi yok' : 'Henüz kimseyi takip etmiyor')}</p>
                    </div>
                `;
                return;
            }
            listContainer.innerHTML = '';
        }

        // Render users
        users.forEach(u => {
            const userEl = document.createElement('div');
            userEl.style.cssText = 'display: flex; align-items: center; gap: 1rem; padding: 0.75rem; border-radius: 12px; transition: background 0.2s; margin-bottom: 0.5rem;';
            userEl.onmouseover = () => userEl.style.background = 'var(--bg)';
            userEl.onmouseout = () => userEl.style.background = 'transparent';

            userEl.innerHTML = `
                <a href="/profile/${u.id}" style="display: flex; align-items: center; gap: 1rem; flex: 1; text-decoration: none; color: inherit;">
                    ${u.avatar_url
                        ? `<img src="${u.avatar_url}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;">`
                        : `<div style="width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--secondary)); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 1.25rem;">${u.username.charAt(0).toUpperCase()}</div>`
                    }
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: 600; font-size: 0.95rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${u.full_name || u.username}</div>
                        <div style="color: var(--text-light); font-size: 0.85rem;">@${u.username}</div>
                    </div>
                </a>
                ${u.id !== getCurrentUserId() && isLoggedIn() ? `
                    <button
                        id="follow-btn-${u.id}"
                        onclick="toggleFollowInModal(${u.id}, ${u.is_following})"
                        style="padding: 0.5rem 1.25rem; background: ${u.is_following ? 'transparent' : 'var(--primary)'}; border: ${u.is_following ? '1px solid var(--primary)' : 'none'}; border-radius: 8px; color: ${u.is_following ? 'var(--primary)' : 'white'}; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; white-space: nowrap;">
                        ${u.is_following ? 'Takip Ediliyor' : 'Takip Et'}
                    </button>
                ` : ''}
            `;

            listContainer.appendChild(userEl);
        });

    } catch (error) {
        console.error('Takip listesi yükleme hatası:', error);
        if (clear) {
            listContainer.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-light);">
                    <p>❌ Liste yüklenirken hata oluştu</p>
                </div>
            `;
        }
    } finally {
        followModalState.isLoading = false;
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    }
}

// Arama handler
let searchTimeout;
function handleFollowSearch(type, query) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
        followModalState.searchQuery = query.trim();
        followModalState.offset = 0;
        followModalState.hasMore = true;
        await loadFollowList(followModalState.userId, type, true);
    }, 300); // 300ms debounce
}

// Infinite scroll setup
function setupInfiniteScroll(type) {
    const listContainer = document.getElementById(`${type}-list`);
    if (!listContainer) return;

    listContainer.addEventListener('scroll', async () => {
        const { scrollTop, scrollHeight, clientHeight } = listContainer;
        const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

        // Load more when 80% scrolled
        if (scrollPercentage > 0.8 && followModalState.hasMore && !followModalState.isLoading) {
            await loadFollowList(followModalState.userId, type, false);
        }
    });
}

// Modal içinde takip et/bırak
async function toggleFollowInModal(userId, isFollowing) {
    const button = document.getElementById(`follow-btn-${userId}`);
    if (!button) return;

    try {
        button.disabled = true;
        button.style.opacity = '0.6';

        if (isFollowing) {
            await FollowAPI.unfollow(userId);
            button.textContent = 'Takip Et';
            button.style.background = 'var(--primary)';
            button.style.border = 'none';
            button.style.color = 'white';
            button.onclick = () => toggleFollowInModal(userId, false);
        } else {
            await FollowAPI.follow(userId);
            button.textContent = 'Takip Ediliyor';
            button.style.background = 'transparent';
            button.style.border = '1px solid var(--primary)';
            button.style.color = 'var(--primary)';
            button.onclick = () => toggleFollowInModal(userId, true);
        }

        button.disabled = false;
        button.style.opacity = '1';

        // Stats'ı güncelle
        await loadFollowStats();
        renderProfile();

    } catch (error) {
        console.error('Takip işlemi hatası:', error);
        alert('Bir hata oluştu');
        button.disabled = false;
        button.style.opacity = '1';
    }
}

// Sayfa yüklendiğinde
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadProfile);
} else {
    loadProfile();
}
