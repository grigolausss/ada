document.addEventListener('DOMContentLoaded', async () => {
    const loadingContainer = document.getElementById('loading-container');
    const resultContainer = document.getElementById('result-container');
    const visitStage = document.getElementById('visit-stage');
    const callStage = document.getElementById('call-stage');
    const nurtureStage = document.getElementById('nurture-stage');
    const bookVisitBtn = document.getElementById('book-visit-btn');

    const api = {
        getScore: () => fetch('/api/score', { method: 'POST' }).then(res => res.json())
    };

    try {
        const result = await api.getScore();
        loadingContainer.style.display = 'none';
        resultContainer.style.display = 'block';

        if (result.stage === 'visit') {
            visitStage.style.display = 'block';
        } else if (result.stage === 'call') {
            callStage.style.display = 'block';
        } else {
            nurtureStage.style.display = 'block';
        }

    } catch (e) {
        loadingContainer.innerHTML = '<h1>Errore</h1><p>Impossibile calcolare il risultato. Riprova più tardi.</p>';
    }

    bookVisitBtn.addEventListener('click', () => {
        // In a real app, you would fetch lead/property info to populate the link
        const ref = sessionStorage.getItem('propertyRef') || 'UNKNOWN';
        window.location.href = `https://cal.com/larte-di-abitare?ref=${ref}`;
    });
});
