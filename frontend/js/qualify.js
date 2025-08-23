document.addEventListener('DOMContentLoaded', () => {
    let state = { answers: {} };
    const unlockBtn = document.getElementById('unlock-btn');
    const questionGroups = document.querySelectorAll('.question-group');

    const api = {
        saveAnswer: (key, value) => fetch('/api/answers', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, value })
        }).then(res => { if (!res.ok) throw new Error('Failed to save'); })
    };

    const updateButtonState = () => {
        const answeredCount = Object.keys(state.answers).filter(q => q !== 'necessita').length;
        unlockBtn.disabled = answeredCount < 4;
    };

    questionGroups.forEach(group => {
        const question = group.dataset.question;
        const isMultiple = group.dataset.multiple === 'true';
        group.addEventListener('click', async (e) => {
            const target = e.target;
            if (!target.classList.contains('option-btn')) return;
            const value = target.dataset.value;
            let changed = false;
            if (isMultiple) {
                target.classList.toggle('selected');
                state.answers[question] = Array.from(target.parentElement.querySelectorAll('.selected')).map(el => el.dataset.value);
                changed = true;
            } else {
                if (!target.classList.contains('selected')) {
                    target.parentElement.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));
                    target.classList.add('selected');
                    state.answers[question] = value;
                    changed = true;
                }
            }
            if (changed) {
                try {
                    await api.saveAnswer(question, state.answers[question]);
                    updateButtonState();
                } catch (err) { console.error('Error saving answer:', err); }
            }
        });
    });

    document.getElementById('qualify-form').addEventListener('submit', (e) => {
        e.preventDefault();
        window.location.href = '/plan.html';
    });
});
