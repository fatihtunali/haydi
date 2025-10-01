// Register Form Handler
document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');

    if (!registerForm) return;

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const full_name = document.getElementById('full_name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const password_confirm = document.getElementById('password_confirm').value;
        const errorMessage = document.getElementById('errorMessage');

        // Şifre kontrolü
        if (password !== password_confirm) {
            errorMessage.textContent = 'Şifreler eşleşmiyor';
            errorMessage.style.display = 'block';
            return;
        }

        try {
            const data = await AuthAPI.register({
                username,
                full_name,
                email,
                password
            });

            // Token ve user bilgisini kaydet
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Ana sayfaya yönlendir
            showSuccess('Kayıt başarılı! Yönlendiriliyorsunuz...');
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
