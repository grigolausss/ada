document.addEventListener('DOMContentLoaded', () => {
    const importForm = document.getElementById('import-form');
    const csvDataInput = document.getElementById('csv-data');
    const resultMessage = document.getElementById('result-message');

    const api = {
        importCsv: (csvData) => fetch('/api/staff/import-csv', {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' }, // Send as raw text
            body: csvData
        }).then(res => res.json())
    };

    const showResult = (message, isError = false) => {
        resultMessage.textContent = message;
        resultMessage.className = `result-box ${isError ? 'error' : 'success'}`;
        resultMessage.style.display = 'block';
    };

    importForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const csvData = csvDataInput.value;
        if (!csvData.trim()) {
            showResult('Nessun dato da importare.', true);
            return;
        }

        try {
            const result = await api.importCsv(csvData);
            if (result.success) {
                showResult(`Importazione completata! Creati: ${result.created}, Aggiornati: ${result.updated}.`);
            } else {
                showResult(result.message || 'Errore durante l\'importazione.', true);
            }
        } catch (err) {
            showResult('Errore di comunicazione con il server.', true);
        }
    });
});
