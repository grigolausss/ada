document.addEventListener('DOMContentLoaded', () => {
    // --- STATE ---
    let state = {
        sessionId: null,
        propertyRef: null,
        answers: {},
        answeredCount: 0,
    };

    // --- DOM ELEMENTS ---
    const qualifyForm = document.getElementById('qualify-form');
    const unlockBtn = document.getElementById('unlock-btn');
    const questionGroups = document.querySelectorAll('.question-group');

    // --- API HELPERS ---
    const api = {
        saveAnswers: (sessionId, propertyRef, answers) => {
            return fetch('/api/answers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, propertyRef, answers }),
            }).then(res => res.json());
        }
    };

    // --- UI LOGIC ---
    const updateButtonState = () => {
        // The "necessita" question is optional, so we don't count it towards the total
        const requiredAnsweredCount = Object.keys(state.answers).filter(q => q !== 'necessita').length;
        if (requiredAnsweredCount >= 4) {
            unlockBtn.disabled = false;
        } else {
            unlockBtn.disabled = true;
        }
    };

    // --- EVENT HANDLERS ---
    const handleOptionClick = (e, question, isMultiple) => {
        const target = e.target;
        if (!target.classList.contains('option-btn')) return;

        const value = target.dataset.value;
        const parent = target.parentElement;

        if (isMultiple) {
            target.classList.toggle('selected');
            const selectedValues = Array.from(parent.querySelectorAll('.selected')).map(el => el.dataset.value);
            state.answers[question] = selectedValues;
        } else {
            // Deselect sibling
            parent.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));
            target.classList.add('selected');
            state.answers[question] = value;
        }

        updateButtonState();
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            const result = await api.saveAnswers(state.sessionId, state.propertyRef, state.answers);
            if (result.success) {
                window.location.href = '/plan.html';
            } else {
                alert('Si è verificato un errore nel salvataggio delle risposte.');
            }
        } catch (err) {
            console.error('Failed to save answers', err);
            alert('Errore di comunicazione con il server.');
        }
    };

    // --- INITIALIZATION ---
    const init = () => {
        state.sessionId = sessionStorage.getItem('sessionId');
        state.propertyRef = sessionStorage.getItem('propertyRef');

        if (!state.sessionId || !state.propertyRef) {
            window.location.href = '/index.html'; // Redirect if no session/property
            return;
        }

        questionGroups.forEach(group => {
            const question = group.dataset.question;
            const isMultiple = group.dataset.multiple === 'true';
            group.addEventListener('click', (e) => handleOptionClick(e, question, isMultiple));
        });

        qualifyForm.addEventListener('submit', handleFormSubmit);
    };

    init();
});
