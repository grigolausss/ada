document.addEventListener('DOMContentLoaded', () => {
    const privacyCheckbox = document.getElementById('privacy-checkbox');
    const continueBtn = document.getElementById('continue-btn');
    const errorMsg = document.getElementById('error-message');

    privacyCheckbox.addEventListener('change', () => {
        continueBtn.disabled = !privacyCheckbox.checked;
    });

    continueBtn.addEventListener('click', async () => {
        if (!privacyCheckbox.checked) return;

        try {
            const response = await fetch('/api/consent', { method: 'POST' });
            if (response.ok) {
                window.location.href = '/qualify.html';
            } else {
                const err = await response.json();
                errorMsg.textContent = err.message || 'Errore nell\'invio del consenso.';
                errorMsg.style.display = 'block';
            }
        } catch (e) {
            errorMsg.textContent = 'Errore di comunicazione con il server.';
            errorMsg.style.display = 'block';
        }
    });
});
