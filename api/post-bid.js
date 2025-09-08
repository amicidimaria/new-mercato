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
        if (req.method !== 'POST') {
            return res.status(405).send('Method Not Allowed');
        }

        const AIRTABLE_API_KEY = getEnvVar('AIRTABLE_API_KEY');
        const AIRTABLE_BASE_ID = getEnvVar('AIRTABLE_BASE_ID');
        const AIRTABLE_TABLE_NAME = getEnvVar('AIRTABLE_TABLE_NAME');
        const TEAM_PASSWORDS_JSON = getEnvVar('TEAM_PASSWORDS_JSON');
        
        if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_NAME || !TEAM_PASSWORDS_JSON) {
             return res.status(500).json({ error: "Configurazione del server incompleta." });
        }

        // Il corpo della richiesta è già parsato da Vercel in req.body
        const { squadra, nome, offerta, password } = req.body;
        const TEAM_PASSWORDS = JSON.parse(TEAM_PASSWORDS_JSON);

        if (TEAM_PASSWORDS[squadra] !== password) {
            return res.status(401).json({ error: 'Password errata' });
        }
        
        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`;
        const dataToSend = {
            records: [{
                fields: { squadra, nome, offerta: Number(offerta) }
            }]
        };

        const airtableResponse = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSend),
        });

        if (!airtableResponse.ok) {
            const errorBody = await airtableResponse.text();
            console.error('Errore da Airtable:', errorBody);
            throw new Error('Errore durante la comunicazione con Airtable.');
        }

        const responseData = await airtableResponse.json();
        res.status(200).json(responseData);

    } catch (error) {
        console.error("ERRORE NON GESTITO in 'post-bid':", error);
        res.status(500).json({ error: "Errore interno del server.", details: error.message });
    }
};
