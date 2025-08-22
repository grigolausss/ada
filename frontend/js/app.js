document.addEventListener('DOMContentLoaded', () => {
    // --- STATE ---
    let state = {
        token: null,
        sessionId: null,
        phone: null,
    };

    // --- DOM ELEMENTS ---
    const phoneStep = document.getElementById('phone-step');
    const otpStep = document.getElementById('otp-step');
    const phoneForm = document.getElementById('phone-form');
    const otpForm = document.getElementById('otp-form');
    const phoneInput = document.getElementById('phone');
    const otpInput = document.getElementById('otp');
    const displayPhone = document.getElementById('display-phone');
    const phoneError = document.getElementById('phone-error');
    const otpError = document.getElementById('otp-error');

    // --- API HELPERS ---
    const API_BASE_URL = '/api';

    const api = {
        startSession: (phone, token) => {
            return fetch(`${API_BASE_URL}/session/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, token }),
            }).then(res => res.json());
        },
        verifyOtp: (sessionId, otp) => {
            return fetch(`${API_BASE_URL}/session/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, otp }),
            }).then(res => res.json());
        }
    };

    // --- UI LOGIC ---
    const showOtpStep = () => {
        phoneStep.style.display = 'none';
        otpStep.style.display = 'block';
        displayPhone.textContent = state.phone;
        otpInput.focus();
    };

    const showError = (el, message) => {
        el.textContent = message;
    };

    // --- EVENT HANDLERS ---
    const handlePhoneSubmit = async (e) => {
        e.preventDefault();
        showError(phoneError, '');
        const phone = phoneInput.value.trim();
        if (!phone) {
            showError(phoneError, 'Il numero di telefono è obbligatorio.');
            return;
        }

        state.phone = phone;

        try {
            const data = await api.startSession(phone, state.token);
            if (data.sessionId) {
                state.sessionId = data.sessionId;
                // Store session info for next pages
                sessionStorage.setItem('sessionId', data.sessionId);
                sessionStorage.setItem('token', state.token);
                showOtpStep();
            } else {
                showError(phoneError, data.message || 'Si è verificato un errore.');
            }
        } catch (err) {
            showError(phoneError, 'Errore di comunicazione con il server.');
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        showError(otpError, '');
        const otp = otpInput.value.trim();
        if (!otp || otp.length !== 6) {
            showError(otpError, 'Il codice OTP deve essere di 6 cifre.');
            return;
        }

        try {
            const data = await api.verifyOtp(state.sessionId, otp);
            if (data.success) {
                // On success, move to the next step
                window.location.href = '/select-property.html';
            } else {
                showError(otpError, data.message || 'Codice non valido. Riprova.');
            }
        } catch (err) {
            showError(otpError, 'Errore di comunicazione con il server.');
        }
    };

    // --- INITIALIZATION ---
    const init = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('t');

        if (!token) {
            document.querySelector('.container').innerHTML = '<h1>Accesso non valido</h1><p>Il link utilizzato non è corretto o è scaduto.</p>';
            return;
        }

        state.token = token;
        phoneForm.addEventListener('submit', handlePhoneSubmit);
        otpForm.addEventListener('submit', handleOtpSubmit);
    };

    init();
});
