// Bildirim sistemi

let notificationDropdownOpen = false;
let notificationPollingInterval = null;

// Bildirim dropdown'ını aç/kapat
function toggleNotifications() {
    const existing = document.getElementById('notificationDropdown');

    if (existing) {
        existing.remove();
        notificationDropdownOpen = false;
        return;
    }

    notificationDropdownOpen = true;
    loadNotifications();
}

// Bildirimleri yükle ve göster
async function loadNotifications() {
    try {
        const data = await NotificationAPI.getAll(10, 0);
        showNotificationDropdown(data.notifications);
    } catch (error) {
        console.error('Bildirimler yüklenemedi:', error);
        showError('Bildirimler yüklenemedi');
    }
}

// Bildirim dropdown UI
function showNotificationDropdown(notifications) {
    const dropdown = document.createElement('div');
    dropdown.id = 'notificationDropdown';
    dropdown.style.cssText = `
        position: fixed;
        top: 60px;
        right: 20px;
        width: 380px;
        max-height: 500px;
        background: var(--card-bg);
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.15);
        z-index: 1000;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    `;

    dropdown.innerHTML = `
        <div style="padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: var(--bg);">
            <h3 style="margin: 0; font-size: 1rem; color: var(--text);">🔔 Bildirimler</h3>
            <div style="display: flex; gap: 0.5rem;">
                ${notifications.length > 0 ? '<button onclick="markAllNotificationsAsRead()" style="padding: 0.35rem 0.6rem; background: var(--primary); color: white; border: none; border-radius: 6px; font-size: 0.75rem; cursor: pointer; font-weight: 600;">Tümünü Okundu İşaretle</button>' : ''}
                <button onclick="toggleNotifications()" style="background: none; border: none; font-size: 1.3rem; cursor: pointer; color: var(--text-light); padding: 0;">×</button>
            </div>
        </div>
        <div id="notificationList" style="flex: 1; overflow-y: auto; max-height: 400px;">
            ${notifications.length === 0
                ? '<div style="padding: 3rem 2rem; text-align: center; color: var(--text-light);"><div style="font-size: 3rem; margin-bottom: 1rem;">🔕</div><p>Henüz bildiriminiz yok</p></div>'
                : notifications.map(n => renderNotification(n)).join('')
            }
        </div>
    `;

    document.body.appendChild(dropdown);

    // Dışarıya tıklanınca kapat
    setTimeout(() => {
        document.addEventListener('click', handleOutsideClick);
    }, 10);
}

// Dışarıya tıklanınca kapat
function handleOutsideClick(e) {
    const dropdown = document.getElementById('notificationDropdown');
    const notifButton = e.target.closest('button[onclick="toggleNotifications()"]');

    if (dropdown && !dropdown.contains(e.target) && !notifButton) {
        dropdown.remove();
        notificationDropdownOpen = false;
        document.removeEventListener('click', handleOutsideClick);
    }
}

// Bildirim kartı render
function renderNotification(notification) {
    const isRead = notification.is_read;
    const time = formatRelativeTime(new Date(notification.created_at));

    return `
        <div onclick="handleNotificationClick(${notification.id}, '${notification.link || ''}')" style="
            padding: 1rem 1.25rem;
            border-bottom: 1px solid var(--border);
            cursor: pointer;
            transition: background 0.2s;
            background: ${isRead ? 'transparent' : 'rgba(99, 102, 241, 0.05)'};
            position: relative;
        " onmouseover="this.style.background='rgba(0,0,0,0.02)';" onmouseout="this.style.background='${isRead ? 'transparent' : 'rgba(99, 102, 241, 0.05)'}';">
            ${!isRead ? '<div style="position: absolute; left: 0.5rem; top: 50%; transform: translateY(-50%); width: 8px; height: 8px; background: var(--primary); border-radius: 50%;"></div>' : ''}
            <div style="font-weight: 600; font-size: 0.9rem; color: var(--text); margin-bottom: 0.25rem;">
                ${notification.title}
            </div>
            <div style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 0.5rem; line-height: 1.4;">
                ${notification.message}
            </div>
            <div style="font-size: 0.75rem; color: var(--text-light);">
                ${time}
            </div>
        </div>
    `;
}

// Bildirime tıklanınca
async function handleNotificationClick(id, link) {
    try {
        await NotificationAPI.markAsRead(id);

        // Badge'i güncelle
        updateNotificationBadge();

        // Dropdown'ı kapat
        toggleNotifications();

        // Link'e git
        if (link) {
            window.location.href = link;
        }
    } catch (error) {
        console.error('Bildirim işaretleme hatası:', error);
    }
}

// Tüm bildirimleri okundu işaretle
async function markAllNotificationsAsRead() {
    try {
        await NotificationAPI.markAllAsRead();
        updateNotificationBadge();

        // Dropdown'ı yenile
        toggleNotifications();
        setTimeout(() => toggleNotifications(), 100);

    } catch (error) {
        console.error('Tüm bildirimleri işaretleme hatası:', error);
        showError('Bildirimler işaretlenemedi');
    }
}

// Bildirim badge'ini güncelle
async function updateNotificationBadge() {
    if (!isLoggedIn()) return;

    try {
        const data = await NotificationAPI.getUnreadCount();
        const badge = document.getElementById('notificationBadge');

        if (badge) {
            if (data.count > 0) {
                badge.textContent = data.count > 99 ? '99+' : data.count;
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Bildirim sayısı güncellenemedi:', error);
    }
}

// Relative time formatter
function formatRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    return date.toLocaleDateString('tr-TR');
}

// Bildirim polling başlat (her 30 saniyede bir)
function startNotificationPolling() {
    if (!isLoggedIn()) return;

    // İlk güncelleme
    updateNotificationBadge();

    // 30 saniyede bir güncelle
    notificationPollingInterval = setInterval(() => {
        updateNotificationBadge();
    }, 30000);
}

// Polling'i durdur
function stopNotificationPolling() {
    if (notificationPollingInterval) {
        clearInterval(notificationPollingInterval);
        notificationPollingInterval = null;
    }
}

// Sayfa yüklendiğinde polling başlat
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startNotificationPolling);
} else {
    startNotificationPolling();
}

// Sayfa kapatılırken polling durdur
window.addEventListener('beforeunload', stopNotificationPolling);

// Global fonksiyonlar
window.toggleNotifications = toggleNotifications;
window.handleNotificationClick = handleNotificationClick;
window.markAllNotificationsAsRead = markAllNotificationsAsRead;
window.updateNotificationBadge = updateNotificationBadge;
