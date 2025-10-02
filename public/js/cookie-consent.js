// Cookie Consent Banner
(function() {
    // Eğer daha önce kabul edilmişse gösterme
    if (localStorage.getItem('cookieConsent') === 'accepted') {
        return;
    }

    // Banner HTML'i oluştur
    const banner = document.createElement('div');
    banner.id = 'cookieConsent';
    banner.style.cssText = `
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: var(--card-bg);
        border-top: 1px solid var(--border);
        padding: 1.5rem;
        z-index: 10000;
        box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
    `;

    banner.innerHTML = `
        <div class="container" style="max-width: 1200px; margin: 0 auto;">
            <div style="display: flex; flex-direction: column; gap: 1rem; align-items: center; justify-content: space-between; text-align: center;">
                <div style="flex: 1;">
                    <p style="margin: 0; color: var(--text); font-size: 0.95rem; line-height: 1.6;">
                        🍪 Bu web sitesi, deneyiminizi geliştirmek için çerezler kullanmaktadır.
                        Çerezleri kabul ederek <a href="/cookies" style="color: var(--primary); text-decoration: underline;">Çerez Politikamızı</a>
                        ve <a href="/privacy-policy" style="color: var(--primary); text-decoration: underline;">Gizlilik Politikamızı</a> kabul etmiş olursunuz.
                    </p>
                </div>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center;">
                    <button onclick="acceptCookies()" style="
                        padding: 0.75rem 2rem;
                        background: var(--primary);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: opacity 0.2s;
                        font-size: 0.9rem;
                    " onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
                        Kabul Et
                    </button>
                    <button onclick="rejectCookies()" style="
                        padding: 0.75rem 2rem;
                        background: transparent;
                        color: var(--text);
                        border: 1px solid var(--border);
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                        font-size: 0.9rem;
                    " onmouseover="this.style.borderColor='var(--primary)'; this.style.color='var(--primary)'" onmouseout="this.style.borderColor='var(--border)'; this.style.color='var(--text)'">
                        Reddet
                    </button>
                    <a href="/cookies" style="
                        padding: 0.75rem 2rem;
                        background: transparent;
                        color: var(--text-light);
                        border: 1px solid var(--border);
                        border-radius: 8px;
                        font-weight: 600;
                        text-decoration: none;
                        transition: all 0.2s;
                        font-size: 0.9rem;
                        display: inline-block;
                    " onmouseover="this.style.borderColor='var(--primary)'; this.style.color='var(--primary)'" onmouseout="this.style.borderColor='var(--border)'; this.style.color='var(--text-light)'">
                        Detaylı Bilgi
                    </a>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(banner);

    // Responsive tasarım için
    if (window.innerWidth < 768) {
        banner.querySelector('.container > div').style.flexDirection = 'column';
        banner.querySelector('.container > div').style.textAlign = 'center';
    }
})();

// Çerezleri kabul et
function acceptCookies() {
    localStorage.setItem('cookieConsent', 'accepted');
    closeCookieBanner();

    // Google Analytics & Ads config'i aktifleştir
    enableTracking();
}

// Google Analytics & Ads tracking'i aktifleştir
function enableTracking() {
    if (typeof gtag === 'function') {
        // Google Ads Conversion Tracking
        gtag('config', 'AW-17618942258');

        // Google Analytics
        gtag('config', 'G-MWJ09WF70N');

        console.log('✅ Google Analytics & Ads tracking aktifleştirildi');
    } else {
        console.warn('⚠️ gtag fonksiyonu bulunamadı');
    }
}

// Çerezleri reddet
function rejectCookies() {
    localStorage.setItem('cookieConsent', 'rejected');
    // Zorunlu olmayan çerezleri temizle
    // Theme dışında her şeyi temizle
    const theme = localStorage.getItem('theme');
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    localStorage.clear();

    // Sadece zorunlu olanları geri koy
    if (token) localStorage.setItem('token', token);
    if (user) localStorage.setItem('user', user);
    if (theme) localStorage.setItem('theme', theme);

    localStorage.setItem('cookieConsent', 'rejected');

    closeCookieBanner();

    alert('⚠️ Çerezleri reddettiniz. Bazı özellikler düzgün çalışmayabilir. Çerezleri kabul etmek için sayfayı yenileyin.');
}

// Banner'ı kapat
function closeCookieBanner() {
    const banner = document.getElementById('cookieConsent');
    if (banner) {
        banner.style.animation = 'slideDown 0.3s ease-out';
        setTimeout(() => banner.remove(), 300);
    }
}

// CSS animasyonu ekle
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            transform: translateY(0);
            opacity: 1;
        }
        to {
            transform: translateY(100%);
            opacity: 0;
        }
    }

    @media (max-width: 768px) {
        #cookieConsent {
            padding: 1rem !important;
        }
        #cookieConsent button,
        #cookieConsent a {
            width: 100% !important;
            text-align: center !important;
        }
    }
`;
document.head.appendChild(style);
