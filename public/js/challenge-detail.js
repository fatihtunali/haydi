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

    const detailContainer = document.getElementById('challengeDetail');
    detailContainer.innerHTML = `
        <div style="background: var(--card-bg); padding: 2rem; border-radius: 12px; box-shadow: var(--shadow);">
            <!-- Header -->
            <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
                ${c.category_name ? `
                    <span class="challenge-category">
                        ${c.category_icon} ${c.category_name}
                    </span>
                ` : ''}
                <span class="challenge-difficulty ${difficultyClass}">
                    ${c.difficulty.charAt(0).toUpperCase() + c.difficulty.slice(1)}
                </span>
                <span class="challenge-category">
                    👥 ${c.participant_count || 0} katılımcı
                </span>
                <span class="challenge-category">
                    🏆 ${c.points} puan
                </span>
            </div>

            <!-- Title -->
            <h1 style="font-size: 2rem; margin-bottom: 1rem;">${c.title}</h1>

            <!-- Creator -->
            <p style="color: var(--text-light); margin-bottom: 1.5rem;">
                ${c.creator_username} tarafından oluşturuldu
            </p>

            <!-- Description -->
            <div style="margin-bottom: 2rem;">
                <h3 style="margin-bottom: 0.5rem;">Açıklama</h3>
                <p style="white-space: pre-wrap;">${c.description}</p>
            </div>

            <!-- Rules -->
            ${c.rules ? `
                <div style="margin-bottom: 2rem;">
                    <h3 style="margin-bottom: 0.5rem;">Kurallar</h3>
                    <p style="white-space: pre-wrap;">${c.rules}</p>
                </div>
            ` : ''}

            <!-- Prize -->
            ${c.prize_description ? `
                <div style="margin-bottom: 2rem;">
                    <h3 style="margin-bottom: 0.5rem;">🎁 Ödül</h3>
                    <p style="white-space: pre-wrap;">${c.prize_description}</p>
                </div>
            ` : ''}

            <!-- Dates -->
            <div style="margin-bottom: 2rem; padding: 1rem; background: var(--bg); border-radius: 8px;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    <div>
                        <strong>Başlangıç:</strong><br>
                        ${formatDate(c.start_date)}
                    </div>
                    <div>
                        <strong>Bitiş:</strong><br>
                        ${formatDate(c.end_date)}
                    </div>
                    <div>
                        <strong>Durum:</strong><br>
                        ${formatDateRange(c.start_date, c.end_date)}
                    </div>
                </div>
            </div>

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
