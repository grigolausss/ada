console.log('plan.js script executing...');
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed.');
    // --- STATE ---
    let state = {
        sessionId: null,
        propertyRef: null,
    };

    // --- DOM ELEMENTS ---
    const confirmationModal = document.getElementById('confirmation-modal');
    const confirmBtn = document.getElementById('confirm-btn');
    const mainContent = document.getElementById('main-content');
    const viewerContainer = document.getElementById('viewer-container');
    const watermarkOverlay = document.getElementById('watermark-overlay');
    const decisionBtn = document.getElementById('decision-btn');

    // --- API HELPERS ---
    const api = {
        getSessionDetails: (sessionId) => fetch(`/api/session/details/${sessionId}`).then(res => res.json()),
        getProperty: (ref) => fetch(`/api/properties/${ref}`).then(res => res.json()),
        logPlanView: (sessionId, propertyRef) => {
            return fetch('/api/plan-views', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, propertyRef }),
            });
        }
    };

    // --- LOGIC ---
    const generateWatermark = (text) => {
        // Create a grid of watermark text
        for (let i = 0; i < 30; i++) {
            const span = document.createElement('span');
            span.className = 'watermark-text';
            span.textContent = text;
            watermarkOverlay.appendChild(span);
        }
    };

    const initializeViewer = async () => {
        console.log('Initializing viewer...');
        try {
            // 1. Log the view event
            await api.logPlanView(state.sessionId, state.propertyRef);
            console.log('Plan view logged.');

            // 2. Fetch data for watermark and plan
            const [sessionDetails, propertyDetails] = await Promise.all([
                api.getSessionDetails(state.sessionId),
                api.getProperty(state.propertyRef)
            ]);
            console.log('API responses received:', { sessionDetails, propertyDetails });

            if (!sessionDetails.phone || sessionDetails.phone === 'N/A' || !propertyDetails.url_planimetria) {
                console.error('Validation failed:', { sessionDetails, propertyDetails });
                throw new Error('Could not retrieve required data.');
            }

            // 3. Generate watermark
            console.log('Generating watermark...');
            const timestamp = new Date().toLocaleString('it-IT');
            const watermarkText = `${sessionDetails.phone}\n${sessionDetails.ip}\n${timestamp}`;
            generateWatermark(watermarkText);

            // 4. Show the main content
            mainContent.style.display = 'block';

            // 5. Initialize OpenSeadragon (can fail gracefully)
            try {
                const viewer = OpenSeadragon({
                    id: "openseadragon-viewer",
                    prefixUrl: "https://cdn.jsdelivr.net/npm/openseadragon@3.1.0/build/openseadragon/images/",
                    tileSources: {
                        type: 'image',
                        url: propertyDetails.url_planimetria
                    },
                    showNavigator: true,
                    constrainDuringPan: true,
                });
            } catch (osdError) {
                console.error("OpenSeadragon failed to initialize:", osdError);
                document.getElementById('openseadragon-viewer').innerHTML = '<p style="color:red;">Anteprima planimetria non disponibile.</p>';
            }

        } catch (err) {
            console.error('Failed to fetch data for viewer:', err);
            mainContent.innerHTML = '<p>Impossibile caricare i dati per la planimetria. Riprova più tardi.</p>';
            mainContent.style.display = 'block';
        }
    };


    // --- EVENT HANDLERS ---
    const handleConfirm = () => {
        confirmationModal.style.display = 'none';
        initializeViewer();
    };

    // --- INITIALIZATION ---
    const init = () => {
        state.sessionId = sessionStorage.getItem('sessionId');
        state.propertyRef = sessionStorage.getItem('propertyRef');

        if (!state.sessionId || !state.propertyRef) {
            window.location.href = '/index.html';
            return;
        }

        confirmBtn.addEventListener('click', handleConfirm);
        decisionBtn.addEventListener('click', () => {
            window.location.href = '/result.html';
        });
    };

    init();
});
