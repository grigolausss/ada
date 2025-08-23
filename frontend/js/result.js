document.addEventListener('DOMContentLoaded', async () => {
    const loadingContainer = document.getElementById('loading-container');
    const resultContainer = document.getElementById('result-container');
    const visitStage = document.getElementById('visit-stage');
    const callStage = document.getElementById('call-stage');
    const nurtureStage = document.getElementById('nurture-stage');
    const bookVisitBtn = document.getElementById('book-visit-btn');

    try {
        const response = await fetch('/api/score', { method: 'POST' });
        const result = await response.json();

        loadingContainer.style.display = 'none';
        resultContainer.style.display = 'block';

        if (result.stage === 'visit') visitStage.style.display = 'block';
        else if (result.stage === 'call') callStage.style.display = 'block';
        else nurtureStage.style.display = 'block';

    } catch (e) {
        loadingContainer.innerHTML = '<h1>Errore</h1><p>Impossibile calcolare il risultato.</p>';
    }

    bookVisitBtn.addEventListener('click', () => {
        const ref = sessionStorage.getItem('propertyRef') || 'UNKNOWN';
        window.location.href = `https://cal.com/larte-di-abitare?ref=${ref}`;
    });
});
