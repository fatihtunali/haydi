// Challenge Detail Page Handler
let currentChallenge = null;
let isParticipant = false;

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', async () => {
    // Challenge ID'yi data attribute'dan al
    const challengeId = document.body.dataset.challengeId;

    if (!challengeId) {
        window.location.href = '/challenges';
        return;
    }

    await loadChallenge(challengeId);
});

// Challenge detayını yükle
async function loadChallenge(id) {
    const detailContainer = document.getElementById('challengeDetail');
    showLoading(detailContainer);

    try {
        const data = await ChallengeAPI.getById(id);
        currentChallenge = data.challenge;
        isParticipant = data.isParticipant;

        renderChallengeDetail();

    } catch (error) {
        console.error('Challenge yükleme hatası:', error);
        detailContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">❌</div>
                <p>Meydan okuma bulunamadı</p>
                <a href="/challenges" class="btn btn-primary" style="margin-top: 1rem;">
                    Meydan Okumalara Dön
                </a>
            </div>
        `;
    }
}

// Challenge detayını render et
function renderChallengeDetail() {
    const c = currentChallenge;
    const difficultyClass = `difficulty-${c.difficulty}`;

    // Tarih hesaplamaları
    const now = new Date();
    const startDate = new Date(c.start_date);
    const endDate = new Date(c.end_date);

    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.max(0, Math.ceil((now - startDate) / (1000 * 60 * 60 * 24)));
    const daysRemaining = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
    const progressPercentage = Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100));

    // Durum belirleme
    let statusClass = 'active';
    let statusText = '';
    if (now < startDate) {
        statusClass = 'upcoming';
        const daysUntilStart = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
        statusText = `🕐 ${daysUntilStart} gün sonra başlıyor`;
    } else if (now > endDate) {
        statusClass = 'ended';
        statusText = '⏱️ Sona erdi';
    } else {
        statusText = `⏰ ${daysRemaining} gün kaldı`;
    }

    const detailContainer = document.getElementById('challengeDetail');
    detailContainer.innerHTML = `
        <div style="background: var(--card-bg); padding: 2.5rem; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
            <!-- Header Badges -->
            <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; align-items: center;">
                ${c.category_name ? `
                    <span class="challenge-category">
                        ${c.category_icon} ${c.category_name}
                    </span>
                ` : ''}
                <span class="challenge-difficulty ${difficultyClass}">
                    ${c.difficulty.charAt(0).toUpperCase() + c.difficulty.slice(1)}
                </span>
                <span class="stat-badge">
                    👥 ${c.participant_count || 0} katılımcı
                </span>
                <span class="stat-badge">
                    🏆 ${c.points} puan
                </span>
                <span class="countdown ${statusClass}">
                    ${statusText}
                </span>
            </div>

            <!-- Title -->
            <h1 style="font-size: 2.5rem; margin-bottom: 0.5rem; color: var(--text);">${c.title}</h1>

            <!-- Creator -->
            <p style="color: var(--text-light); margin-bottom: 2rem; font-size: 0.95rem;">
                ${c.creator_username} tarafından oluşturuldu
            </p>

            <!-- Progress Section -->
            <div style="background: var(--bg); padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <span style="font-weight: 600; color: var(--text);">Meydan Okuma İlerlemesi</span>
                    <span style="font-weight: 700; color: var(--primary);">${Math.round(progressPercentage)}%</span>
                </div>
                <div class="progress-bar-container" style="height: 10px;">
                    <div class="progress-bar" style="width: ${progressPercentage}%"></div>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 1rem; font-size: 0.875rem; color: var(--text-light);">
                    <span>📅 ${formatDate(c.start_date)}</span>
                    <span>${daysElapsed}/${totalDays} gün</span>
                    <span>🏁 ${formatDate(c.end_date)}</span>
                </div>
            </div>

            <!-- Description -->
            <div style="margin-bottom: 2rem; padding: 1.5rem; background: var(--bg); border-radius: 12px;">
                <h3 style="margin-bottom: 1rem; color: var(--text); font-size: 1.1rem;">📝 Açıklama</h3>
                <p style="white-space: pre-wrap; line-height: 1.7; color: var(--text);">${c.description}</p>
            </div>

            <!-- Rules -->
            ${c.rules ? `
                <div style="margin-bottom: 2rem; padding: 1.5rem; background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(16, 185, 129, 0.05)); border-radius: 12px; border: 2px solid var(--border);">
                    <h3 style="margin-bottom: 1rem; color: var(--text); font-size: 1.1rem;">📋 Kurallar</h3>
                    <p style="white-space: pre-wrap; line-height: 1.7; color: var(--text);">${c.rules}</p>
                </div>
            ` : ''}

            <!-- Prize -->
            ${c.prize_description ? `
                <div style="margin-bottom: 2rem; padding: 1.5rem; background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(239, 68, 68, 0.1)); border-radius: 12px; border: 2px dashed #f59e0b;">
                    <h3 style="margin-bottom: 1rem; color: var(--text); font-size: 1.1rem;">🎁 Ödül</h3>
                    <p style="white-space: pre-wrap; line-height: 1.7; color: var(--text); font-weight: 600;">${c.prize_description}</p>
                </div>
            ` : ''}

            <!-- Join Button -->
            <div id="joinButtonContainer"></div>
        </div>
    `;

    renderJoinButton();
}

// Katılım butonunu render et
function renderJoinButton() {
    const container = document.getElementById('joinButtonContainer');

    if (!isLoggedIn()) {
        container.innerHTML = `
            <a href="/login" class="btn btn-primary" style="width: 100%;">
                Meydan Okumaya Katılmak İçin Giriş Yap
            </a>
        `;
        return;
    }

    if (isParticipant) {
        container.innerHTML = `
            <button class="btn btn-success" disabled style="width: 100%;">
                ✓ Meydan Okumaya Katıldınız
            </button>
        `;
    } else {
        container.innerHTML = `
            <button onclick="joinChallenge()" class="btn btn-primary" style="width: 100%;">
                Meydan Okumaya Katıl
            </button>
        `;
    }
}

// Challenge'a katıl
async function joinChallenge() {
    if (!confirm('Bu meydan okumaya katılmak istediğinizden emin misiniz?')) {
        return;
    }

    try {
        await ChallengeAPI.join(currentChallenge.id);
        isParticipant = true;
        showSuccess('Meydan okumaya başarıyla katıldınız!');
        renderJoinButton();

        // Katılımcı sayısını güncelle
        currentChallenge.participant_count++;
        renderChallengeDetail();

    } catch (error) {
        showError(error.message);
    }
}
