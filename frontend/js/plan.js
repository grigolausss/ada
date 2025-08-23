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
        logDuration: (duration) => fetch('/api/plan-view-duration', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ duration })
        })
    };

    const drawWatermark = (data) => {
        const { nome, cognome, email } = data.lead;
        const ref = sessionStorage.getItem('propertyRef');
        const timestamp = new Date().toLocaleString('it-IT');
        const text = `${nome} ${cognome} · ${email} · ${ref} · ${timestamp}`;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.font = '16px Arial';
        ctx.rotate(-20 * Math.PI / 180);

        for (let y = -100; y < canvas.height * 1.5; y += 100) {
            for (let x = -100; x < canvas.width * 1.5; x += 300) {
                ctx.fillText(text, x, y);
            }
        }
        ctx.rotate(20 * Math.PI / 180); // Reset rotation
    };

    const initializeCanvas = async () => {
        try {
            const [planRes, meRes] = await Promise.all([api.getPlanData(), api.getMe()]);
            if (!planRes.ok || !meRes.ok) throw new Error('Failed to load initial data');

            const planData = await planRes.json();
            const leadData = await meRes.json();

            // Here we should verify planData.token, but for this MVP we'll just use the URL
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = planData.url;
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                drawWatermark({ lead: leadData });
                viewStartTime = Date.now();
                mainContent.style.display = 'block';
            };
            img.onerror = () => { throw new Error('Image could not be loaded.'); };

        } catch (err) {
            console.error('Canvas initialization failed:', err);
            mainContent.innerHTML = `<p>Impossibile caricare la planimetria. Causa: ${err.message}</p>`;
            mainContent.style.display = 'block';
        }
    };

    confirmBtn.addEventListener('click', () => {
        confirmationModal.style.display = 'none';
        initializeCanvas();
    });

    const logAndNavigate = () => {
        if (viewStartTime) {
            const duration = Math.round((Date.now() - viewStartTime) / 1000);
            api.logDuration(duration); // Fire and forget
        }
        window.location.href = '/result.html';
    };

    decisionBtn.addEventListener('click', logAndNavigate);
    // Also log duration if user navigates away
    window.addEventListener('beforeunload', () => {
        if (viewStartTime) {
            const duration = Math.round((Date.now() - viewStartTime) / 1000);
            navigator.sendBeacon('/api/plan-view-duration', JSON.stringify({ duration }));
        }
    });

    // We no longer need a complex init, just check for the propertyRef in sessionStorage
    if (!sessionStorage.getItem('propertyRef')) {
       // In a real app, you'd check the cookie, but for this flow, we assume state
       // window.location.href = '/';
    }
});
