document.addEventListener('DOMContentLoaded', () => {
    let state = { sessionId: null };
    const startStep = document.getElementById('start-step');
    const otpStep = document.getElementById('otp-step');
    const startForm = document.getElementById('start-form');
    const otpForm = document.getElementById('otp-form');
    const emailInput = document.getElementById('email');
    const refInput = document.getElementById('ref');
    const otpInput = document.getElementById('otp');
    const displayEmail = document.getElementById('display-email');
    const errorMsg = document.getElementById('error-message');

    const api = {
        startSession: (data) => fetch('/api/session/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(res => res.json()),
        verifyOtp: (sessionId, code) => fetch('/api/otp/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, code }) }).then(res => res.json()),
    };

    const showOtpStep = (email) => { startStep.style.display = 'none'; otpStep.style.display = 'block'; displayEmail.textContent = email; otpInput.focus(); };
    const showError = (message) => { errorMsg.textContent = message; errorMsg.style.display = 'block'; };

    startForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        showError('');
        const data = { nome: document.getElementById('name').value, cognome: document.getElementById('surname').value, email: emailInput.value, phone: document.getElementById('phone').value, ref: refInput.value };
        try {
            const result = await api.startSession(data);
            if (result.sessionId) {
                state.sessionId = result.sessionId;
                sessionStorage.setItem('propertyRef', data.ref.toUpperCase());
                showOtpStep(data.email);
            } else { showError(result.message || 'Errore.'); }
        } catch (err) { showError('Errore di comunicazione.'); }
    });

    otpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        showError('');
        const code = otpInput.value;
        if (!code || code.length !== 6) return showError('L\'OTP deve essere di 6 cifre.');
        try {
            const result = await api.verifyOtp(state.sessionId, code);
            if (result.success) { window.location.href = '/privacy.html'; }
            else { showError(result.message || 'Codice non valido.'); }
        } catch (err) { showError('Errore di comunicazione.'); }
    });
});
