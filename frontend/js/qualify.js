document.addEventListener('DOMContentLoaded', () => {
    // --- STATE ---
    let state = {
        answers: {},
    };

    // --- DOM ELEMENTS ---
    const qualifyForm = document.getElementById('qualify-form');
    const unlockBtn = document.getElementById('unlock-btn');
    const questionGroups = document.querySelectorAll('.question-group');

    // --- API HELPERS ---
    const api = {
        saveAnswer: (key, value) => {
            return fetch('/api/answers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value }),
            }).then(res => {
                if (!res.ok) throw new Error('Failed to save answer');
                return res.json();
            });
        }
    };

    // --- UI LOGIC ---
    const updateButtonState = () => {
        const requiredAnsweredCount = Object.keys(state.answers).filter(q => q !== 'necessita').length;
        unlockBtn.disabled = requiredAnsweredCount < 4;
    };

    // --- EVENT HANDLERS ---
    const handleOptionClick = async (e, question, isMultiple) => {
        const target = e.target;
        if (!target.classList.contains('option-btn')) return;

        const value = target.dataset.value;
        let answerChanged = false;

        if (isMultiple) {
            target.classList.toggle('selected');
            const selectedValues = Array.from(target.parentElement.querySelectorAll('.selected')).map(el => el.dataset.value);
            state.answers[question] = selectedValues;
            answerChanged = true; // Always save on multi-choice change
        } else {
            if (!target.classList.contains('selected')) {
                target.parentElement.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));
                target.classList.add('selected');
                state.answers[question] = value;
                answerChanged = true;
            }
        }

        if (answerChanged) {
            try {
                await api.saveAnswer(question, state.answers[question]);
                updateButtonState();
            } catch (err) {
                console.error('Error saving answer:', err);
                // Optionally show an error to the user
            }
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        // All answers are saved step-by-step, so we just need to navigate
        window.location.href = '/plan.html';
    };

    // --- INITIALIZATION ---
    questionGroups.forEach(group => {
        const question = group.dataset.question;
        const isMultiple = group.dataset.multiple === 'true';
        group.addEventListener('click', (e) => handleOptionClick(e, question, isMultiple));
    });

    qualifyForm.addEventListener('submit', handleFormSubmit);
});
