document.addEventListener('DOMContentLoaded', () => {
    // --- STATE ---
    let state = {
        sessionId: null,
        token: null,
        allProperties: [],
        selectedProperty: null,
        privacyConsent: false,
    };

    // --- DOM ELEMENTS ---
    const propertyRefInput = document.getElementById('property-ref');
    const suggestionsContainer = document.getElementById('suggestions');
    const propertyPreview = document.getElementById('property-preview');
    const previewTitle = document.getElementById('preview-title');
    const previewDetails = document.getElementById('preview-details');
    const privacyCheckbox = document.getElementById('privacy');
    const continueBtn = document.getElementById('continue-btn');
    const propertyForm = document.getElementById('property-form');

    // --- API HELPERS ---
    const api = {
        getProperties: () => fetch('/api/properties').then(res => res.json()),
    };

    // --- UI LOGIC ---
    const updateButtonState = () => {
        if (state.selectedProperty && state.privacyConsent) {
            continueBtn.disabled = false;
        } else {
            continueBtn.disabled = true;
        }
    };

    const renderSuggestions = (properties) => {
        if (properties.length === 0) {
            suggestionsContainer.innerHTML = '';
            return;
        }
        const ul = document.createElement('ul');
        properties.forEach(prop => {
            const li = document.createElement('li');
            li.textContent = `${prop.ref} - ${prop.titolo}`;
            li.dataset.ref = prop.ref;
            li.addEventListener('click', () => handleSuggestionClick(prop));
            ul.appendChild(li);
        });
        suggestionsContainer.innerHTML = '';
        suggestionsContainer.appendChild(ul);
    };

    const displayPropertyPreview = (prop) => {
        state.selectedProperty = prop;
        propertyPreview.style.display = 'block';
        previewTitle.textContent = prop.titolo;
        previewDetails.textContent = `Zona: ${prop.zona} | MQ: ${prop.mq} | Prezzo: ${prop.prezzo_range}`;
        updateButtonState();
    };

    // --- EVENT HANDLERS ---
    const handleRefInput = (e) => {
        const query = e.target.value.toLowerCase();
        if (query.length < 2) {
            suggestionsContainer.innerHTML = '';
            return;
        }
        const filtered = state.allProperties.filter(prop =>
            prop.ref.toLowerCase().includes(query) ||
            prop.titolo.toLowerCase().includes(query)
        );
        renderSuggestions(filtered);
    };

    const handleSuggestionClick = (prop) => {
        propertyRefInput.value = prop.ref;
        suggestionsContainer.innerHTML = '';
        displayPropertyPreview(prop);
    };

    const handlePrivacyChange = (e) => {
        state.privacyConsent = e.target.checked;
        updateButtonState();
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (!state.selectedProperty || !state.privacyConsent) return;

        sessionStorage.setItem('propertyRef', state.selectedProperty.ref);
        window.location.href = '/qualify.html';
    };

    // --- INITIALIZATION ---
    const init = async () => {
        state.sessionId = sessionStorage.getItem('sessionId');
        state.token = sessionStorage.getItem('token');

        if (!state.sessionId || !state.token) {
            window.location.href = '/index.html'; // Redirect if no session
            return;
        }

        try {
            state.allProperties = await api.getProperties();
        } catch (err) {
            console.error('Failed to fetch properties', err);
            // Handle error display
        }

        propertyRefInput.addEventListener('input', handleRefInput);
        privacyCheckbox.addEventListener('change', handlePrivacyChange);
        propertyForm.addEventListener('submit', handleFormSubmit);
    };

    init();
});
