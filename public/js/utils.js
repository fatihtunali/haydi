// Utility fonksiyonları

// Tarih formatla
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Bugün';
    if (days === 1) return 'Dün';
    if (days < 7) return `${days} gün önce`;
    if (days < 30) return `${Math.floor(days / 7)} hafta önce`;

    return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Tarih aralığı formatla
function formatDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start > now) {
        return `${formatDate(startDate)} başlıyor`;
    } else if (end < now) {
        return 'Sona erdi';
    } else {
        const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
        return `${daysLeft} gün kaldı`;
    }
}

// Loading göster
function showLoading(element) {
    element.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <p>Yükleniyor...</p>
        </div>
    `;
}

// Empty state göster
function showEmptyState(element, icon, message) {
    element.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">${icon}</div>
            <p>${message}</p>
        </div>
    `;
}

// Error göster
function showError(message) {
    alert(message); // Daha sonra toast notification yapılabilir
}

// Success göster
function showSuccess(message) {
    alert(message);
}

// Sayı formatla (1000 -> 1K)
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Token kontrolü
function isLoggedIn() {
    return !!localStorage.getItem('token');
}

// Kullanıcı bilgisini al
function getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Kullanıcı ID'sini al
function getCurrentUserId() {
    const user = getUser();
    return user ? user.id : null;
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
}

// URL'den query parameter al
function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Time ago formatter
function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    const intervals = {
        yıl: 31536000,
        ay: 2592000,
        hafta: 604800,
        gün: 86400,
        saat: 3600,
        dakika: 60
    };

    for (const [name, secondsInInterval] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInInterval);
        if (interval >= 1) {
            return `${interval} ${name} önce`;
        }
    }

    return 'Az önce';
}

// Submission kartını render et
function renderSubmission(s, showChallengeBadge = false) {
    const displayName = s.full_name || s.username;
    const timeAgo = formatTimeAgo(new Date(s.created_at));
    const isVideo = s.media_type === 'video' || (s.media_url && (s.media_url.includes('.mp4') || s.media_url.includes('video')));

    return `
        <div style="background: var(--card-bg); border-radius: 12px; overflow: hidden; margin-bottom: 1.5rem; box-shadow: 0 2px 10px rgba(0,0,0,0.05); border: 2px solid var(--border); transition: all 0.3s;"
             onmouseover="this.style.borderColor='var(--primary)'"
             onmouseout="this.style.borderColor='var(--border)'">

            <!-- Media (Image or Video) -->
            ${s.media_url ? (isVideo ? `
                <video controls style="width: 100%; max-height: 500px; background: #000;">
                    <source src="${s.media_url}" type="video/mp4">
                    Tarayıcınız video oynatmayı desteklemiyor.
                </video>
            ` : `
                <img src="${s.media_url}" alt="Submission" style="width: 100%; height: 400px; object-fit: cover;">
            `) : ''}

            <!-- Content -->
            <div style="padding: 1.5rem;">
                <!-- User Info -->
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                    ${s.avatar_url
                        ? `<img src="${s.avatar_url}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">`
                        : `<div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--secondary)); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">${s.username.charAt(0).toUpperCase()}</div>`
                    }
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: var(--text);">${displayName}</div>
                        <div style="font-size: 0.85rem; color: var(--text-light);">${timeAgo}</div>
                    </div>
                    ${showChallengeBadge && s.challenge_title ? `
                        <a href="/challenge/${s.challenge_id}" style="text-decoration: none;">
                            <span class="challenge-category" style="font-size: 0.85rem; padding: 0.4rem 0.8rem;">
                                🎯 ${s.challenge_title}
                            </span>
                        </a>
                    ` : ''}
                </div>

                <!-- Location -->
                ${s.location ? `
                    <div style="margin-bottom: 1rem; color: var(--text); font-size: 0.95rem;">
                        📍 <strong>${s.location}</strong>
                    </div>
                ` : ''}

                <!-- Content -->
                <p style="color: var(--text); line-height: 1.6; margin-bottom: 1rem; white-space: pre-wrap;">${s.content || ''}</p>

                <!-- Actions -->
                <div style="display: flex; gap: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border);">
                    <button onclick="toggleSubmissionLike(${s.id})" id="like-btn-${s.id}" style="display: flex; align-items: center; gap: 0.5rem; background: none; border: none; cursor: pointer; color: ${s.is_liked_by_user ? '#ef4444' : 'var(--text-light)'}; font-weight: 600; transition: all 0.3s;">
                        ${s.is_liked_by_user ? '❤️' : '🤍'} <span id="like-count-${s.id}">${s.likes_count || 0}</span>
                    </button>
                    <button onclick="showComments(${s.id})" style="display: flex; align-items: center; gap: 0.5rem; background: none; border: none; cursor: pointer; color: var(--text-light); font-weight: 600; transition: all 0.3s;">
                        💬 ${s.comments_count || 0}
                    </button>
                </div>

                <!-- Comments Container -->
                <div id="comments-${s.id}" style="display: none; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border);"></div>
            </div>
        </div>
    `;
}

// Beğeni toggle
async function toggleSubmissionLike(submissionId) {
    if (!isLoggedIn()) {
        showError('Beğenmek için giriş yapmalısınız');
        return;
    }

    try {
        const data = await SubmissionAPI.toggleLike(submissionId);

        // UI güncelle
        const likeBtn = document.getElementById(`like-btn-${submissionId}`);
        const likeCount = document.getElementById(`like-count-${submissionId}`);

        if (data.liked) {
            likeBtn.style.color = '#ef4444';
            likeBtn.innerHTML = `❤️ <span id="like-count-${submissionId}">${parseInt(likeCount.textContent) + 1}</span>`;
        } else {
            likeBtn.style.color = 'var(--text-light)';
            likeBtn.innerHTML = `🤍 <span id="like-count-${submissionId}">${parseInt(likeCount.textContent) - 1}</span>`;
        }

    } catch (error) {
        showError(error.message || 'Beğeni işlemi başarısız');
    }
}

// Yorumları göster
async function showComments(submissionId) {
    const commentsContainer = document.getElementById(`comments-${submissionId}`);

    if (commentsContainer.style.display === 'block') {
        commentsContainer.style.display = 'none';
        return;
    }

    try {
        const data = await SubmissionAPI.getComments(submissionId);
        const comments = data.comments || [];

        commentsContainer.innerHTML = `
            <!-- Comment List -->
            <div id="comment-list-${submissionId}" style="margin-bottom: 1rem;">
                ${comments.length === 0
                    ? '<p style="color: var(--text-light); font-size: 0.9rem; text-align: center;">Henüz yorum yok</p>'
                    : comments.map(c => `
                        <div style="margin-bottom: 1rem; padding: 0.75rem; background: var(--bg); border-radius: 8px;">
                            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                                ${c.avatar_url
                                    ? `<img src="${c.avatar_url}" style="width: 30px; height: 30px; border-radius: 50%;">`
                                    : `<div style="width: 30px; height: 30px; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center; color: white; font-size: 0.8rem; font-weight: bold;">${c.username.charAt(0).toUpperCase()}</div>`
                                }
                                <div>
                                    <div style="font-weight: 600; font-size: 0.9rem; color: var(--text);">${c.username}</div>
                                    <div style="font-size: 0.8rem; color: var(--text-light);">${formatTimeAgo(new Date(c.created_at))}</div>
                                </div>
                            </div>
                            <p style="margin: 0; color: var(--text); font-size: 0.9rem;">${c.content}</p>
                        </div>
                    `).join('')
                }
            </div>

            <!-- Add Comment Form -->
            ${isLoggedIn() ? `
                <form onsubmit="handleAddComment(event, ${submissionId})" style="display: flex; gap: 0.5rem;">
                    <input type="text" id="comment-input-${submissionId}" placeholder="Yorum yaz..." required style="flex: 1; padding: 0.75rem; border: 2px solid var(--border); border-radius: 8px; background: var(--bg);">
                    <button type="submit" class="btn btn-primary" style="padding: 0.75rem 1.5rem;">Gönder</button>
                </form>
            ` : '<p style="text-align: center; color: var(--text-light); font-size: 0.9rem;">Yorum yapmak için giriş yapın</p>'}
        `;

        commentsContainer.style.display = 'block';

    } catch (error) {
        console.error('Yorum yükleme hatası:', error);
        commentsContainer.innerHTML = '<p style="color: var(--text-light);">Yorumlar yüklenirken hata oluştu</p>';
        commentsContainer.style.display = 'block';
    }
}

// Yorum ekle
async function handleAddComment(event, submissionId) {
    event.preventDefault();

    const input = document.getElementById(`comment-input-${submissionId}`);
    const content = input.value.trim();

    if (!content) return;

    try {
        await SubmissionAPI.addComment(submissionId, content);
        input.value = '';

        // Yorumları yenile
        await showComments(submissionId);

    } catch (error) {
        showError(error.message || 'Yorum eklenirken hata oluştu');
    }
}
