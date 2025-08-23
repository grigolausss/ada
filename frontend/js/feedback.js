document.addEventListener('DOMContentLoaded', () => {
    const feedbackForm = document.getElementById('feedback-form');
    const alternativesContainer = document.getElementById('alternatives');
    const alternativesList = document.getElementById('alternatives-list');

    const api = {
        saveFeedback: (reasons) => fetch('/api/feedback', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reasons })
        }).then(res => res.json()),
        getProperties: () => fetch('/api/properties').then(res => res.json()), // This should be a filtered endpoint
    };

    const displayAlternatives = async () => {
        try {
            const allProperties = await api.getProperties();
            const currentRef = sessionStorage.getItem('propertyRef');
            const alternativeProps = allProperties.filter(p => p.ref !== currentRef);

            if (alternativeProps.length > 0) {
                alternativesList.innerHTML = alternativeProps.slice(0, 3)
                    .map(p => `<li>${p.titolo} (Ref: ${p.ref})</li>`).join('');
            } else {
                alternativesList.innerHTML = '<li>Nessuna alternativa trovata al momento.</li>';
            }
            alternativesContainer.style.display = 'block';
        } catch (err) {
            console.error('Failed to display alternatives:', err);
        }
    };

    feedbackForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const selectedReasons = Array.from(feedbackForm.querySelectorAll('input[name="reason"]:checked')).map(el => el.value);
        if (selectedReasons.length === 0) {
            alert('Seleziona almeno un motivo.');
            return;
        }

        try {
            await api.saveFeedback(selectedReasons);
            feedbackForm.style.display = 'none';
            document.querySelector('.container > h1').textContent = "Grazie per il tuo feedback!";
            await displayAlternatives();
        } catch (err) {
            alert('Errore nel salvataggio del feedback.');
        }
    });
});
