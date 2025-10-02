// Challenge Form (Create & Edit)

const isEditMode = window.location.pathname.includes('/edit-challenge');
const challengeId = isEditMode ? document.body.dataset.challengeId : null;

document.addEventListener('DOMContentLoaded', async () => {
    // Login kontrolü
    if (!isLoggedIn()) {
        window.location.href = '/login';
        return;
    }

    await loadCategories();
    setupTeamCheckbox();

    if (isEditMode) {
        await loadChallenge();
    }

    setupFormHandlers();
});

// Kategorileri yükle
async function loadCategories() {
    try {
        const data = await ChallengeAPI.getCategories();
        const select = document.getElementById('category_id');

        if (select && data.categories) {
            select.innerHTML = '<option value="">Kategori seçin</option>' +
                data.categories.map(cat => `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`).join('');
        }
    } catch (error) {
        console.error('Kategori yükleme hatası:', error);
    }
}

// Team checkbox handler
function setupTeamCheckbox() {
    const checkbox = document.getElementById('is_team_based');
    const teamFields = document.getElementById('teamSizeFields');

    if (checkbox && teamFields) {
        checkbox.addEventListener('change', () => {
            teamFields.style.display = checkbox.checked ? 'block' : 'none';
        });
    }
}

// Challenge yükle (edit mode)
async function loadChallenge() {
    const loadingState = document.getElementById('loadingState');
    const form = document.getElementById('challengeForm');

    try {
        const data = await ChallengeAPI.getById(challengeId);
        const challenge = data.challenge;

        // Status badge
        const statusBadge = document.getElementById('statusBadge');
        const statusColors = {
            'taslak': { bg: 'rgba(107, 114, 128, 0.1)', border: '#6b7280', text: '#6b7280', label: '📝 Taslak' },
            'beklemede': { bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b', text: '#f59e0b', label: '⏳ Onay Bekliyor' },
            'aktif': { bg: 'rgba(16, 185, 129, 0.1)', border: '#10b981', text: '#10b981', label: '✅ Aktif' },
            'bitti': { bg: 'rgba(107, 114, 128, 0.1)', border: '#6b7280', text: '#6b7280', label: '🏁 Bitti' }
        };

        const status = statusColors[challenge.status] || statusColors['taslak'];
        statusBadge.innerHTML = `
            <div style="background: ${status.bg}; border: 2px solid ${status.border}; color: ${status.text}; padding: 0.75rem; border-radius: 8px; font-weight: 600;">
                ${status.label}
            </div>
        `;

        // Form alanlarını doldur
        document.getElementById('title').value = challenge.title || '';
        document.getElementById('description').value = challenge.description || '';
        document.getElementById('category_id').value = challenge.category_id || '';
        document.getElementById('difficulty').value = challenge.difficulty || 'orta';
        document.getElementById('points').value = challenge.points || 100;
        document.getElementById('max_participants').value = challenge.max_participants || '';
        document.getElementById('rules').value = challenge.rules || '';
        document.getElementById('prize_description').value = challenge.prize_description || '';

        // Tarihleri formatla (YYYY-MM-DD)
        if (challenge.start_date) {
            document.getElementById('start_date').value = challenge.start_date.split('T')[0];
        }
        if (challenge.end_date) {
            document.getElementById('end_date').value = challenge.end_date.split('T')[0];
        }

        // Takım ayarları
        const isTeamBased = document.getElementById('is_team_based');
        isTeamBased.checked = !!challenge.is_team_based;

        if (challenge.is_team_based) {
            document.getElementById('teamSizeFields').style.display = 'block';
            document.getElementById('min_team_size').value = challenge.min_team_size || 2;
            document.getElementById('max_team_size').value = challenge.max_team_size || 5;
        }

        // Buton görünürlüğü
        const submitBtn = document.getElementById('submitForApprovalBtn');
        const deleteBtn = document.getElementById('deleteBtn');

        // Sadece taslak ise onaya gönder butonu göster
        if (challenge.status !== 'taslak') {
            submitBtn.style.display = 'none';
        }

        // Aktif veya bitti ise sil butonu gizle
        if (challenge.status === 'aktif' || challenge.status === 'bitti') {
            deleteBtn.style.display = 'none';
        }

        // Aktif veya bitti ise formu disable yap
        if (challenge.status === 'aktif' || challenge.status === 'bitti') {
            Array.from(form.elements).forEach(el => {
                if (el.tagName !== 'BUTTON') {
                    el.disabled = true;
                }
            });
            form.querySelector('button[type="submit"]').disabled = true;
        }

        loadingState.style.display = 'none';
        form.style.display = 'block';

    } catch (error) {
        console.error('Challenge yükleme hatası:', error);
        showError('Challenge yüklenemedi');
        setTimeout(() => window.location.href = '/profile', 2000);
    }
}

// Form handlers
function setupFormHandlers() {
    const form = document.getElementById('challengeForm');

    // Form submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = getFormData();

        try {
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = '⏳ Kaydediliyor...';

            if (isEditMode) {
                await ChallengeAPI.update(challengeId, formData);
                showSuccess('Challenge güncellendi!');
            } else {
                const result = await ChallengeAPI.create(formData);
                showSuccess('Challenge taslak olarak kaydedildi!');
                setTimeout(() => window.location.href = '/profile', 1500);
            }

            submitBtn.disabled = false;
            submitBtn.textContent = isEditMode ? '💾 Güncelle' : '💾 Taslak Olarak Kaydet';

        } catch (error) {
            showError(error.message || 'Bir hata oluştu');
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = isEditMode ? '💾 Güncelle' : '💾 Taslak Olarak Kaydet';
        }
    });

    // Delete button (edit mode)
    if (isEditMode) {
        const deleteBtn = document.getElementById('deleteBtn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', async () => {
                if (!confirm('Challenge\'ı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
                    return;
                }

                try {
                    await ChallengeAPI.delete(challengeId);
                    showSuccess('Challenge silindi');
                    setTimeout(() => window.location.href = '/profile', 1500);
                } catch (error) {
                    showError(error.message || 'Silme hatası');
                }
            });
        }

        // Submit for approval button
        const submitForApprovalBtn = document.getElementById('submitForApprovalBtn');
        if (submitForApprovalBtn) {
            submitForApprovalBtn.addEventListener('click', async () => {
                if (!confirm('Challenge\'ı onaya göndermek istediğinize emin misiniz?\n\nOnaya gönderildikten sonra sadece düzenleyebilirsiniz.')) {
                    return;
                }

                try {
                    submitForApprovalBtn.disabled = true;
                    submitForApprovalBtn.textContent = '⏳ Gönderiliyor...';

                    await ChallengeAPI.submit(challengeId);
                    showSuccess('Challenge onay için gönderildi! Admin onayından sonra aktif olacak.');
                    setTimeout(() => window.location.href = '/profile', 2000);

                } catch (error) {
                    showError(error.message || 'Gönderme hatası');
                    submitForApprovalBtn.disabled = false;
                    submitForApprovalBtn.textContent = '📤 Onaya Gönder';
                }
            });
        }
    }
}

// Form verilerini topla
function getFormData() {
    const isTeamBased = document.getElementById('is_team_based').checked;

    const formData = {
        title: document.getElementById('title').value.trim(),
        description: document.getElementById('description').value.trim(),
        category_id: document.getElementById('category_id').value || null,
        difficulty: document.getElementById('difficulty').value,
        points: parseInt(document.getElementById('points').value) || 100,
        start_date: document.getElementById('start_date').value,
        end_date: document.getElementById('end_date').value,
        max_participants: parseInt(document.getElementById('max_participants').value) || null,
        rules: document.getElementById('rules').value.trim() || null,
        prize_description: document.getElementById('prize_description').value.trim() || null,
        is_team_based: isTeamBased
    };

    if (isTeamBased) {
        formData.min_team_size = parseInt(document.getElementById('min_team_size').value) || 2;
        formData.max_team_size = parseInt(document.getElementById('max_team_size').value) || 5;
    }

    return formData;
}
