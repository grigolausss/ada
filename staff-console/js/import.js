document.addEventListener('DOMContentLoaded', () => {
    const importForm = document.getElementById('import-form');
    const csvDataInput = document.getElementById('csv-data');
    const resultMessage = document.getElementById('result-message');

    importForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const csvData = csvDataInput.value;
        if (!csvData.trim()) return;

        try {
            const response = await fetch('/api/staff/import-csv', {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: csvData
            });
            const result = await response.json();

            resultMessage.style.display = 'block';
            if (result.success) {
                resultMessage.className = 'result-box success';
                resultMessage.textContent = `Importazione completata! Creati: ${result.created}, Aggiornati: ${result.updated}.`;
            } else {
                resultMessage.className = 'result-box error';
                resultMessage.textContent = result.message || 'Errore durante l\'importazione.';
            }
        } catch (err) {
            resultMessage.className = 'result-box error';
            resultMessage.textContent = 'Errore di comunicazione con il server.';
        }
    });
});
