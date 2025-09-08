// NESSUN IMPORT NECESSARIO: 'fetch' è già disponibile nell'ambiente Vercel (Node.js 18+)

const getEnvVar = (name) => {
    const value = process.env[name];
    if (!value) {
        console.error(`ERRORE CRITICO: La variabile d'ambiente "${name}" non è stata trovata.`);
    }
    return value;
};

// Vercel richiede che la funzione esportata si chiami 'default'
export default async function handler(req, res) {
    try {
        const AIRTABLE_API_KEY = getEnvVar('AIRTABLE_API_KEY');
        const AIRTABLE_BASE_ID = getEnvVar('AIRTABLE_BASE_ID');
        const AIRTABLE_TABLE_NAME = getEnvVar('AIRTABLE_TABLE_NAME');

        if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_NAME) {
            return res.status(500).json({ error: "Configurazione del server incompleta." });
        }

        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}?sort[0][field]=data&sort[0][direction]=desc`;

        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
        });

        if (!response.ok) {
            console.error("Errore da Airtable:", await response.text());
            throw new Error(`Errore di rete: ${response.statusText}`);
        }

        const data = await response.json();
        // Invia i dati con status 200
        res.status(200).json(data.records);

    } catch (error) {
        console.error("ERRORE NON GESTITO in 'get-auctions':", error);
        res.status(500).json({ error: "Impossibile recuperare le aste." });
    }
};
