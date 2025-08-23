document.addEventListener('DOMContentLoaded', () => {
    const loginStep = document.getElementById('login-step');
    const otpStep = document.getElementById('otp-step');
    const loginForm = document.getElementById('login-form');
    const otpForm = document.getElementById('otp-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const otpInput = document.getElementById('otp');
    const errorMsg = document.getElementById('error-message');
    let currentUserId = null;

    const api = {
        login: (email, password) => fetch('/api/staff/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) }).then(res => res.json()),
        verifyOtp: (userId, code) => fetch('/api/staff/otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, code }) }).then(res => res.json())
    };

    const showError = (message) => { errorMsg.textContent = message; errorMsg.style.display = 'block'; };

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        showError('');
        try {
            const result = await api.login(emailInput.value, passwordInput.value);
            if (result.success) {
                currentUserId = result.userId;
                loginStep.style.display = 'none';
                otpStep.style.display = 'block';
                otpInput.focus();
            } else { showError(result.message || 'Login fallito.'); }
        } catch (err) { showError('Errore di comunicazione.'); }
    });

    otpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        showError('');
        try {
            const result = await api.verifyOtp(currentUserId, otpInput.value);
            if (result.success) { window.location.href = '/staff-console/dashboard.html'; }
            else { showError(result.message || 'Verifica OTP fallita.'); }
        } catch (err) { showError('Errore di comunicazione.'); }
    });
});
