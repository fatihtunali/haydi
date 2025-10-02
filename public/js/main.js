// Ana sayfa için JavaScript

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', async () => {
    await loadFeed();
    await loadTeamChallenges(); // Takım challenge'larını yükle
    await loadCategories();
    await loadFeaturedChallenges();
    await loadStats();
});

// Instagram-style feed yükle
async function loadFeed() {
    const feedContainer = document.getElementById('feedContainer');
    if (!feedContainer) return;

    showLoading(feedContainer);

    try {
        const data = await SubmissionAPI.getFeed({ limit: 12 });
        const submissions = data.submissions || [];

        if (submissions.length === 0) {
            showEmptyState(feedContainer, '📸', 'Henüz gönderi yok');
            return;
        }

        feedContainer.innerHTML = submissions.map(s => renderSubmission(s, true)).join('');

    } catch (error) {
        console.error('Feed yükleme hatası:', error);
        feedContainer.innerHTML = `<p>Gönderiler yüklenirken bir hata oluştu</p>`;
    }
}

// Takım challenge'larını yükle
async function loadTeamChallenges() {
    const teamChallenges = document.getElementById('teamChallenges');
    if (!teamChallenges) return;

    showLoading(teamChallenges);

    try {
        const data = await ChallengeAPI.getAll({ status: 'aktif', limit: 6 });
        const challenges = data.challenges.filter(c => c.is_team_based);

        if (challenges.length === 0) {
            showEmptyState(teamChallenges, '👥', 'Henüz takım meydan okuması yok');
            return;
        }

        teamChallenges.innerHTML = challenges.map(challenge =>
            createChallengeCard(challenge)
        ).join('');

    } catch (error) {
        console.error('Takım challenge yükleme hatası:', error);
        teamChallenges.innerHTML = `<p>Takım meydan okumaları yüklenemedi</p>`;
    }
}

// Kategorileri yükle
async function loadCategories() {
    const categoriesGrid = document.getElementById('categoriesGrid');
    if (!categoriesGrid) return;

    showLoading(categoriesGrid);

    try {
        const data = await ChallengeAPI.getCategories();
        const categories = data.categories;

        if (categories.length === 0) {
            showEmptyState(categoriesGrid, '📁', 'Henüz kategori yok');
            return;
        }

        categoriesGrid.innerHTML = categories.map(cat => `
            <a href="/challenges?category=${cat.slug}" style="display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 1.25rem 1.75rem; background: var(--card-bg); border-radius: 16px; text-decoration: none; transition: all 0.3s; border: 2px solid var(--border); min-width: 140px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);" onmouseover="this.style.borderColor='var(--primary)'; this.style.transform='translateY(-4px)'" onmouseout="this.style.borderColor='var(--border)'; this.style.transform='translateY(0)'">
                <div style="font-size: 3rem; line-height: 1;">${cat.icon}</div>
                <div style="font-weight: 600; color: var(--text); font-size: 0.95rem; text-align: center;">${cat.name}</div>
            </a>
        `).join('');

    } catch (error) {
        console.error('Kategori yükleme hatası:', error);
        categoriesGrid.innerHTML = `<p>Kategoriler yüklenemedi</p>`;
    }
}

// Öne çıkan challenge'ları yükle
async function loadFeaturedChallenges() {
    const featuredChallenges = document.getElementById('featuredChallenges');
    if (!featuredChallenges) return;

    showLoading(featuredChallenges);

    try {
        const data = await ChallengeAPI.getAll({ status: 'aktif', limit: 8 });
        const challenges = data.challenges;

        if (challenges.length === 0) {
            showEmptyState(featuredChallenges, '🎯', 'Henüz aktif meydan okuma yok');
            return;
        }

        featuredChallenges.innerHTML = challenges.map(challenge =>
            createChallengeCard(challenge)
        ).join('');

    } catch (error) {
        console.error('Challenge yükleme hatası:', error);
        featuredChallenges.innerHTML = `<p>Meydan okumalar yüklenemedi</p>`;
    }
}

// Challenge kartı oluştur (Liste formatı)
function createChallengeCard(challenge) {
    const difficultyClass = `difficulty-${challenge.difficulty}`;
    const participantCount = challenge.participant_count || 0;

    // Tarih hesaplamaları
    const now = new Date();
    const startDate = new Date(challenge.start_date);
    const endDate = new Date(challenge.end_date);

    const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

    // Durum kontrolü
    let countdownClass = 'active';
    let countdownText = '';
    if (now < startDate) {
        countdownClass = 'upcoming';
        const daysUntilStart = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
        countdownText = `${daysUntilStart} gün sonra`;
    } else if (now > endDate) {
        countdownClass = 'ended';
        countdownText = 'Sona erdi';
    } else {
        countdownText = `${daysRemaining} gün kaldı`;
    }

    return `
        <div onclick="goToChallenge(${challenge.id})" style="display: grid; grid-template-columns: auto 1fr auto; gap: 1.5rem; align-items: center; padding: 1.5rem; background: var(--card-bg); border-radius: 12px; cursor: pointer; transition: all 0.3s; border: 2px solid transparent; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">

            <!-- Sol: Kategori İkonu -->
            <div style="display: flex; align-items: center; justify-content: center; width: 60px; height: 60px; background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(16, 185, 129, 0.1)); border-radius: 12px; font-size: 2rem;">
                ${challenge.category_icon || '🎯'}
            </div>

            <!-- Orta: Başlık ve Detaylar -->
            <div style="display: flex; flex-direction: column; gap: 0.5rem; min-width: 0;">
                <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
                    <h3 style="margin: 0; font-size: 1.125rem; font-weight: 800; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 25%, #ec4899 50%, #f59e0b 75%, #10b981 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
                        ${challenge.title}
                    </h3>
                    <span class="challenge-difficulty ${difficultyClass}" style="padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">
                        ${challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
                    </span>
                </div>
                <p style="margin: 0; color: var(--text-light); font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                    ${challenge.description}
                </p>
                <div style="display: flex; align-items: center; gap: 1.5rem; margin-top: 0.25rem; font-size: 0.85rem;">
                    ${challenge.category_name ? `
                        <span style="color: var(--text-light); display: flex; align-items: center; gap: 0.25rem;">
                            📂 ${challenge.category_name}
                        </span>
                    ` : ''}
                    ${challenge.is_team_based ? `
                        <span style="padding: 0.25rem 0.75rem; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 12px; color: #6366f1; font-weight: 600; font-size: 0.75rem; display: flex; align-items: center; gap: 0.25rem;">
                            👥 Takım (${challenge.min_team_size}-${challenge.max_team_size} kişi)
                        </span>
                    ` : `
                        <span style="padding: 0.25rem 0.75rem; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; color: #10b981; font-weight: 600; font-size: 0.75rem; display: flex; align-items: center; gap: 0.25rem;">
                            👤 Solo
                        </span>
                    `}
                    <span style="color: var(--text-light); display: flex; align-items: center; gap: 0.25rem;">
                        👥 ${participantCount} katılımcı
                    </span>
                </div>
                ${challenge.is_team_based ? `
                    <div style="margin-top: 0.5rem; padding: 0.5rem 0.75rem; background: rgba(99, 102, 241, 0.05); border-left: 3px solid #6366f1; border-radius: 4px;">
                        <p style="margin: 0; font-size: 0.8rem; color: #6366f1;">
                            💡 <strong>Takım Challenge:</strong> Katılın, takım kurun veya bir takıma katılın!
                        </p>
                    </div>
                ` : ''}
            </div>

            <!-- Sağ: Puan ve Süre -->
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.75rem; min-width: 120px;">
                <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(16, 185, 129, 0.15)); border-radius: 20px;">
                    <span style="font-size: 1.25rem;">🏆</span>
                    <span style="font-weight: 700; color: var(--primary); font-size: 1.125rem;">${challenge.points}</span>
                    <span style="font-size: 0.75rem; color: var(--text-light);">puan</span>
                </div>
                <span class="countdown ${countdownClass}" style="font-size: 0.85rem; color: var(--text-light); display: flex; align-items: center; gap: 0.25rem;">
                    ⏰ ${countdownText}
                </span>
            </div>

        </div>
    `;
}

// Challenge sayfasına git
function goToChallenge(id) {
    window.location.href = `/challenge/${id}`;
}

// İstatistikleri yükle
async function loadStats() {
    try {
        const data = await ChallengeAPI.getStats();
        const stats = data.stats;

        // Aktif meydan okumalar
        const activeChallengesEl = document.getElementById('activeChallenges');
        if (activeChallengesEl) {
            activeChallengesEl.textContent = stats.active_challenges;
        }

        // Toplam kullanıcılar
        const totalUsersEl = document.getElementById('totalUsers');
        if (totalUsersEl) {
            totalUsersEl.textContent = stats.total_users + '+';
        }

        // Toplam gönderiler
        const totalSubmissionsEl = document.getElementById('totalSubmissions');
        if (totalSubmissionsEl) {
            totalSubmissionsEl.textContent = stats.total_submissions + '+';
        }

        // Toplam dağıtılan puanlar
        const totalPointsEl = document.getElementById('totalPoints');
        if (totalPointsEl) {
            totalPointsEl.textContent = stats.total_points_distributed + '+';
        }

    } catch (error) {
        console.error('İstatistik yükleme hatası:', error);
    }
}
