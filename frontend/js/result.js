document.addEventListener('DOMContentLoaded', () => {
    // --- STATE ---
    let state = {
        sessionId: null,
        propertyRef: null,
    };

    // --- DOM ELEMENTS ---
    const bookVisitBtn = document.getElementById('book-visit-btn');
    const noThanksBtn = document.getElementById('no-thanks-btn');

    // --- EVENT HANDLERS ---
    const handleBookVisit = () => {
        // In a real app, this might involve another API call to register the intent.
        // For MVP, we redirect directly to the calendar.
        // The calendar URL should have context about the user/property if possible.
        alert('Stai per essere reindirizzato al calendario per prenotare la tua visita.');
        window.location.href = 'https://cal.com/larte-di-abitare'; // Placeholder URL
    };

    const handleNoThanks = () => {
        window.location.href = '/feedback.html';
    };

    // --- INITIALIZATION ---
    const init = () => {
        state.sessionId = sessionStorage.getItem('sessionId');
        state.propertyRef = sessionStorage.getItem('propertyRef');

        if (!state.sessionId || !state.propertyRef) {
            window.location.href = '/index.html';
            return;
        }

        bookVisitBtn.addEventListener('click', handleBookVisit);
        noThanksBtn.addEventListener('click', handleNoThanks);
    };

    init();
});
