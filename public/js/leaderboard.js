// Leaderboard sayfası

let currentType = 'global'; // 'global', 'challenge', 'teams'
let currentPeriod = 'all'; // 'all', 'weekly', 'monthly'
let selectedChallengeId = null;
let challenges = [];

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', async () => {
    await loadChallenges();
    await loadLeaderboard();

    // Kullanıcı giriş yapmışsa kendi sırasını göster
    if (isLoggedIn()) {
        await loadUserRank();
    }
});

// Challenge listesini yükle
async function loadChallenges() {
    try {
        const data = await ChallengeAPI.getAll({ status: 'aktif' });
        challenges = data.challenges || [];

        const challengeSelect = document.getElementById('challengeSelect');
        if (challengeSelect && challenges.length > 0) {
            challengeSelect.innerHTML = '<option value="">Challenge seçin...</option>' +
                challenges.map(c => `<option value="${c.id}">${c.title}</option>`).join('');
        }
    } catch (error) {
        console.error('Challenge listesi yüklenemedi:', error);
    }
}

// Leaderboard type değiştir
function switchLeaderboardType(type) {
    currentType = type;

    // Tab styling
    document.querySelectorAll('.leaderboard-tab').forEach(tab => {
        tab.style.borderBottomColor = 'transparent';
        tab.style.color = 'var(--text-light)';
    });

    const activeTab = document.getElementById(`tab-${type}`);
    if (activeTab) {
        activeTab.style.borderBottomColor = 'var(--primary)';
        activeTab.style.color = 'var(--primary)';
    }

    // Filtreleri göster/gizle
    const filters = document.getElementById('filters');
    const challengeSelector = document.getElementById('challengeSelector');

    if (type === 'global') {
        document.querySelectorAll('.period-btn').forEach(btn => btn.style.display = 'inline-block');
        challengeSelector.style.display = 'none';
    } else {
        document.querySelectorAll('.period-btn').forEach(btn => btn.style.display = 'none');
        challengeSelector.style.display = 'block';
    }

    // Leaderboard'u yükle
    if (type === 'global') {
        loadLeaderboard();
    } else {
        // Challenge/team için challenge seçilmesini bekle
        document.getElementById('leaderboardList').innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-light);">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🎯</div>
                <p>Lütfen yukarıdan bir challenge seçin</p>
            </div>
        `;
        document.getElementById('podium').innerHTML = '';
    }
}

// Period değiştir
function changePeriod(period) {
    currentPeriod = period;

    // Button styling
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.style.background = 'var(--card-bg)';
        btn.style.color = 'var(--text)';
        btn.style.border = '2px solid var(--border)';
    });

    const activeBtn = document.getElementById(`period-${period}`);
    if (activeBtn) {
        activeBtn.style.background = 'var(--primary)';
        activeBtn.style.color = 'white';
        activeBtn.style.border = 'none';
    }

    loadLeaderboard();

    if (isLoggedIn()) {
        loadUserRank();
    }
}

// Challenge seçimi değiştiğinde
function onChallengeChange() {
    const select = document.getElementById('challengeSelect');
    selectedChallengeId = select.value;

    if (selectedChallengeId) {
        loadLeaderboard();
    }
}

// Leaderboard'u yükle
async function loadLeaderboard() {
    const listContainer = document.getElementById('leaderboardList');
    const podiumContainer = document.getElementById('podium');

    try {
        listContainer.innerHTML = '<div style="text-align: center; padding: 3rem; color: var(--text-light);"><div style="font-size: 3rem; margin-bottom: 1rem;">⏳</div><p>Yükleniyor...</p></div>';
        podiumContainer.innerHTML = '';

        let data;

        if (currentType === 'global') {
            data = await LeaderboardAPI.getGlobal(currentPeriod);
        } else if (currentType === 'challenge' && selectedChallengeId) {
            data = await LeaderboardAPI.getChallenge(selectedChallengeId);
        } else if (currentType === 'teams' && selectedChallengeId) {
            data = await LeaderboardAPI.getTeams(selectedChallengeId);
        } else {
            return;
        }

        const leaderboard = data.leaderboard || [];

        if (leaderboard.length === 0) {
            listContainer.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-light);">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📊</div>
                    <p>Henüz veri yok</p>
                </div>
            `;
            return;
        }

        // İlk 3'ü podium'da göster
        const top3 = leaderboard.slice(0, 3);
        const rest = leaderboard.slice(3);

        if (top3.length > 0) {
            podiumContainer.innerHTML = renderPodium(top3);
        }

        if (rest.length > 0) {
            listContainer.innerHTML = rest.map(entry => renderLeaderboardEntry(entry)).join('');
        } else {
            listContainer.innerHTML = '';
        }

    } catch (error) {
        console.error('Leaderboard yükleme hatası:', error);
        listContainer.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-light);">
                <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
                <p>Leaderboard yüklenirken bir hata oluştu</p>
            </div>
        `;
    }
}

// Podium render et
function renderPodium(top3) {
    const medals = ['🥇', '🥈', '🥉'];
    const colors = ['#FFD700', '#C0C0C0', '#CD7F32'];
    const heights = ['180px', '140px', '120px'];

    // Sıralamayı düzenle: 2. - 1. - 3.
    const ordered = top3.length === 3 ? [top3[1], top3[0], top3[2]] :
                    top3.length === 2 ? [top3[1], top3[0]] :
                    [top3[0]];

    return `
        <div style="display: flex; align-items: flex-end; justify-content: center; gap: 1rem; margin-bottom: 3rem; flex-wrap: wrap;">
            ${ordered.map((entry, displayIndex) => {
                // displayIndex: 0 = 2., 1 = 1., 2 = 3.
                const actualRank = displayIndex === 0 ? 1 : (displayIndex === 1 ? 0 : 2);
                const height = heights[actualRank];
                const medal = medals[actualRank];
                const color = colors[actualRank];

                return `
                    <div style="display: flex; flex-direction: column; align-items: center; min-width: 140px;">
                        <div style="margin-bottom: 1rem; text-align: center;">
                            ${entry.avatar_url || entry.captain_avatar
                                ? `<img src="${entry.avatar_url || entry.captain_avatar}" style="width: 80px; height: 80px; border-radius: 50%; border: 4px solid ${color}; object-fit: cover; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">`
                                : `<div style="width: 80px; height: 80px; border-radius: 50%; border: 4px solid ${color}; background: ${color}; color: white; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: bold; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">${(entry.username || entry.team_name || '?').charAt(0).toUpperCase()}</div>`
                            }
                            <div style="font-size: 2.5rem; margin-top: 0.5rem;">${medal}</div>
                            <div style="font-weight: 700; font-size: 1rem; margin-top: 0.5rem; color: var(--text);">${entry.username || entry.team_name}</div>
                            ${entry.captain_username ? `<div style="font-size: 0.75rem; color: var(--text-light);">👑 ${entry.captain_username}</div>` : ''}
                            <div style="font-weight: 600; font-size: 1.125rem; color: ${color}; margin-top: 0.25rem;">${entry.points} puan</div>
                        </div>
                        <div style="width: 140px; height: ${height}; background: linear-gradient(180deg, ${color}22, ${color}44); border-radius: 8px 8px 0 0; border: 2px solid ${color}; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 800; color: ${color};">
                            #${entry.rank}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// Leaderboard entry render et
function renderLeaderboardEntry(entry) {
    const isCurrentUser = isLoggedIn() && (entry.id === getCurrentUserId());

    return `
        <div style="
            background: ${isCurrentUser ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(16, 185, 129, 0.1))' : 'var(--card-bg)'};
            padding: 1.25rem;
            margin-bottom: 1rem;
            border-radius: 12px;
            border: 2px solid ${isCurrentUser ? 'var(--primary)' : 'var(--border)'};
            display: flex;
            align-items: center;
            gap: 1rem;
            transition: all 0.3s;
        " onmouseover="this.style.transform='translateX(5px)'" onmouseout="this.style.transform='translateX(0)'">

            <!-- Rank -->
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--text-light); min-width: 50px; text-align: center;">
                #${entry.rank}
            </div>

            <!-- Avatar -->
            <div>
                ${entry.avatar_url || entry.captain_avatar
                    ? `<img src="${entry.avatar_url || entry.captain_avatar}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid var(--primary);">`
                    : `<div style="width: 50px; height: 50px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; font-weight: bold;">${(entry.username || entry.team_name || '?').charAt(0).toUpperCase()}</div>`
                }
            </div>

            <!-- Info -->
            <div style="flex: 1;">
                <div style="font-weight: 700; font-size: 1rem; color: var(--text); margin-bottom: 0.25rem;">
                    ${entry.username || entry.team_name}
                    ${isCurrentUser ? '<span style="color: var(--primary); font-size: 0.85rem; margin-left: 0.5rem;">👤 Sen</span>' : ''}
                    ${entry.captain_username ? `<span style="font-size: 0.85rem; color: var(--text-light); margin-left: 0.5rem;">👑 ${entry.captain_username}</span>` : ''}
                </div>
                <div style="font-size: 0.85rem; color: var(--text-light);">
                    ${entry.challenges_completed ? `🎯 ${entry.challenges_completed} challenge` : ''}
                    ${entry.total_submissions ? ` • 📸 ${entry.total_submissions} gönderi` : ''}
                    ${entry.member_count ? `👥 ${entry.member_count} üye` : ''}
                </div>
            </div>

            <!-- Points -->
            <div style="text-align: right;">
                <div style="font-size: 1.5rem; font-weight: 800; color: var(--primary);">
                    ${entry.points}
                </div>
                <div style="font-size: 0.75rem; color: var(--text-light);">
                    puan
                </div>
            </div>
        </div>
    `;
}

// Kullanıcının kendi sırasını yükle
async function loadUserRank() {
    if (!isLoggedIn() || currentType !== 'global') return;

    try {
        const data = await LeaderboardAPI.getMyRank(currentPeriod);
        const myRankCard = document.getElementById('myRankCard');

        if (data.rank && data.user) {
            myRankCard.style.display = 'block';
            myRankCard.innerHTML = `
                <div style="
                    background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(16, 185, 129, 0.15));
                    padding: 1.5rem;
                    border-radius: 12px;
                    border: 2px solid var(--primary);
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                ">
                    <div style="font-size: 2rem; font-weight: 800; color: var(--primary);">
                        #${data.rank}
                    </div>
                    <div>
                        ${data.user.avatar_url
                            ? `<img src="${data.user.avatar_url}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 3px solid var(--primary);">`
                            : `<div style="width: 60px; height: 60px; border-radius: 50%; background: var(--primary); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: bold;">${data.user.username.charAt(0).toUpperCase()}</div>`
                        }
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 700; font-size: 1.25rem; color: var(--text); margin-bottom: 0.25rem;">
                            Senin Sıran 🎯
                        </div>
                        <div style="font-size: 0.9rem; color: var(--text-light);">
                            ${data.user.username}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 2rem; font-weight: 800; color: var(--primary);">
                            ${data.user.points}
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text-light);">
                            puan
                        </div>
                    </div>
                </div>
            `;
        } else {
            myRankCard.style.display = 'none';
        }
    } catch (error) {
        console.error('User rank yükleme hatası:', error);
    }
}
