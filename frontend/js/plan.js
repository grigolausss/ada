document.addEventListener('DOMContentLoaded', () => {
    const confirmationModal = document.getElementById('confirmation-modal');
    const confirmBtn = document.getElementById('confirm-btn');
    const mainContent = document.getElementById('main-content');
    const decisionBtn = document.getElementById('decision-btn');
    const canvas = document.getElementById('plan-canvas');
    const ctx = canvas.getContext('2d');
    let viewStartTime;

    const api = {
        getPlanData: () => fetch(`/api/property/${sessionStorage.getItem('propertyRef')}/plan`),
        getMe: () => fetch('/api/me'),
        logDuration: (duration) => fetch('/api/plan-view-duration', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ duration }) })
    };

    const drawWatermark = (data) => {
        const { nome, cognome, email } = data;
        const ref = sessionStorage.getItem('propertyRef');
        const text = `${nome} ${cognome} · ${email} · ${ref} · ${new Date().toLocaleString('it-IT')}`;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.font = '14px Arial';
        ctx.rotate(-20 * Math.PI / 180);
        for (let y = -50; y < canvas.height * 1.5; y += 80) {
            for (let x = -200; x < canvas.width * 1.5; x += 400) {
                ctx.fillText(text, x, y);
            }
        }
        ctx.rotate(20 * Math.PI / 180);
    };

    const initializeCanvas = async () => {
        try {
            const [planRes, meRes] = await Promise.all([api.getPlanData(), api.getMe()]);
            if (!planRes.ok || !meRes.ok) throw new Error('Failed to load initial data');
            const planData = await planRes.json();
            const leadData = await meRes.json();

            // In a real app, we'd verify planData.token against planData.url

            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = planData.url;
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                drawWatermark(leadData);
                viewStartTime = Date.now();
                mainContent.style.display = 'block';
            };
            img.onerror = () => { throw new Error('Image could not be loaded.'); };
        } catch (err) {
            mainContent.innerHTML = `<p>Impossibile caricare la planimetria.</p>`;
            mainContent.style.display = 'block';
        }
    };

    const logAndNavigate = () => {
        if (viewStartTime) {
            const duration = Math.round((Date.now() - viewStartTime) / 1000);
            navigator.sendBeacon('/api/plan-view-duration', JSON.stringify({ duration }));
        }
        window.location.href = '/result.html';
    };

    confirmBtn.addEventListener('click', () => {
        confirmationModal.style.display = 'none';
        initializeCanvas();
    });
    decisionBtn.addEventListener('click', logAndNavigate);
});
