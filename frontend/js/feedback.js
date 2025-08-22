document.addEventListener('DOMContentLoaded', () => {
    // --- STATE ---
    let state = {
        sessionId: null,
        propertyRef: null,
    };

    // --- DOM ELEMENTS ---
    const feedbackForm = document.getElementById('feedback-form');
    const alternativesContainer = document.getElementById('alternatives');
    const alternativesList = document.getElementById('alternatives-list');

    // --- API HELPERS ---
    const api = {
        saveFeedback: (sessionId, propertyRef, reasons) => {
            return fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, propertyRef, reasons }),
            }).then(res => res.json());
        },
        getProperties: () => fetch('/api/properties').then(res => res.json()),
    };

    // --- LOGIC ---
    const displayAlternatives = async () => {
        try {
            const allProperties = await api.getProperties();
            // Simple logic for MVP: show other properties, excluding the current one
            const alternativeProps = allProperties.filter(p => p.ref !== state.propertyRef);

            if (alternativeProps.length > 0) {
                // Show up to 3 alternatives
                alternativesList.innerHTML = alternativeProps
                    .slice(0, 3)
                    .map(p => `<li><a href="#">${p.titolo} in ${p.zona}</a> (Ref: ${p.ref})</li>`)
                    .join('');
                alternativesContainer.style.display = 'block';
            } else {
                // If no alternatives, maybe just show the main website link clearly
                alternativesList.innerHTML = '<p>Non abbiamo trovato alternative immediate. <a href="https://www.artediabitare.it/" target="_blank">Visita il nostro sito ufficiale</a> per vedere tutte le nostre proposte.</p>';
                 alternativesContainer.style.display = 'block';
            }

        } catch (err) {
            console.error('Failed to fetch alternatives', err);
        }
    };

    // --- EVENT HANDLERS ---
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const selectedReasons = Array.from(feedbackForm.querySelectorAll('input[name="reason"]:checked'))
            .map(el => el.value);

        if (selectedReasons.length === 0) {
            alert('Seleziona almeno un motivo.');
            return;
        }

        try {
            const result = await api.saveFeedback(state.sessionId, state.propertyRef, selectedReasons);
            if (result.success) {
                feedbackForm.style.display = 'none';
                document.querySelector('.container > h1').textContent = "Grazie per il tuo feedback!";
                document.querySelector('.container > p').textContent = "Apprezziamo il tuo tempo. Ecco altre proposte che potrebbero fare al caso tuo.";
                await displayAlternatives();
            } else {
                alert('Errore nel salvataggio del feedback.');
            }
        } catch (err) {
            console.error('Failed to save feedback', err);
            alert('Errore di comunicazione con il server.');
        }
    };

    // --- INITIALIZATION ---
    const init = () => {
        state.sessionId = sessionStorage.getItem('sessionId');
        state.propertyRef = sessionStorage.getItem('propertyRef');

        if (!state.sessionId || !state.propertyRef) {
            window.location.href = '/index.html';
            return;
        }

        feedbackForm.addEventListener('submit', handleFormSubmit);
    };

    init();
});
