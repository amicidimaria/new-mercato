// NESSUN IMPORT NECESSARIO: 'fetch' è già disponibile nell'ambiente Netlify (Node.js 18+)

// Funzione per accedere in modo sicuro alle variabili d'ambiente
const getEnvVar = (name) => {
    const value = process.env[name];
    if (!value) {
        console.error(`ERRORE CRITICO: La variabile d'ambiente "${name}" non è stata trovata.`);
    }
    return value;
};

export const handler = async (event) => {
    try {
        console.log("Funzione 'post-bid' invocata.");

        if (event.httpMethod !== 'POST') {
            return { statusCode: 405, body: 'Method Not Allowed' };
        }

        // Recuperiamo le variabili d'ambiente
        const AIRTABLE_API_KEY = getEnvVar('AIRTABLE_API_KEY');
        const AIRTABLE_BASE_ID = getEnvVar('AIRTABLE_BASE_ID');
        const AIRTABLE_TABLE_NAME = getEnvVar('AIRTABLE_TABLE_NAME');
        const TEAM_PASSWORDS_JSON = getEnvVar('TEAM_PASSWORDS_JSON');
        
        if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_NAME || !TEAM_PASSWORDS_JSON) {
             return {
                statusCode: 500,
                body: JSON.stringify({ error: "Configurazione del server incompleta." }),
            };
        }

        const { squadra, nome, offerta, password } = JSON.parse(event.body);
        const TEAM_PASSWORDS = JSON.parse(TEAM_PASSWORDS_JSON);

        if (TEAM_PASSWORDS[squadra] !== password) {
            console.log(`Password errata per la squadra ${squadra}.`);
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Password errata' }),
            };
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
        return {
            statusCode: 200,
            body: JSON.stringify(responseData),
        };

    } catch (error) {
        console.error("ERRORE NON GESTITO in 'post-bid':", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Errore interno del server.", details: error.message }),
        };
    }
};

