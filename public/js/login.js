// Login Form Handler
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('errorMessage');

        try {
            const data = await AuthAPI.login({ email, password });

            // Token ve user bilgisini kaydet
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Ana sayfaya yönlendir
            showSuccess('Giriş başarılı! Yönlendiriliyorsunuz...');
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);

        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
        }
    });

    // Zaten giriş yapmışsa ana sayfaya yönlendir
    if (isLoggedIn()) {
        window.location.href = '/';
    }
});
