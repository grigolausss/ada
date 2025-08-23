document.addEventListener('DOMContentLoaded', () => {
    const privacyCheckbox = document.getElementById('privacy-checkbox');
    const continueBtn = document.getElementById('continue-btn');

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
                alert('Errore nell\'invio del consenso.');
            }
        } catch (e) {
            alert('Errore di comunicazione con il server.');
        }
    });
});
