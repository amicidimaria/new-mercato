import fetch from 'node-fetch';

// Funzione per accedere in modo sicuro alle variabili d'ambiente e registrare se mancano
const getEnvVar = (name) => {
    const value = process.env[name];
    if (!value) {
        console.error(`ERRORE CRITICO: La variabile d'ambiente "${name}" non è stata trovata o è vuota.`);
    }
    return value;
};

export const handler = async (event) => {
    // Aggiungiamo un blocco try-catch generale per catturare qualsiasi errore imprevisto
    try {
        console.log("Funzione 'post-bid' invocata.");

        // Controlliamo il metodo HTTP
        if (event.httpMethod !== 'POST') {
            console.log("Metodo non valido:", event.httpMethod);
            return { statusCode: 405, body: 'Method Not Allowed' };
        }

        // Recuperiamo le variabili d'ambiente in modo sicuro
        const AIRTABLE_API_KEY = getEnvVar('AIRTABLE_API_KEY');
        const AIRTABLE_BASE_ID = getEnvVar('AIRTABLE_BASE_ID');
        const AIRTABLE_TABLE_NAME = getEnvVar('AIRTABLE_TABLE_NAME');
        const TEAM_PASSWORDS_JSON = getEnvVar('TEAM_PASSWORDS_JSON');
        
        // Se una qualsiasi variabile manca, fermiamo l'esecuzione
        if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_NAME || !TEAM_PASSWORDS_JSON) {
             return {
                statusCode: 500,
                body: JSON.stringify({ error: "Configurazione del server incompleta. Controllare le variabili d'ambiente nei log." }),
            };
        }

        const { squadra, nome, offerta, password } = JSON.parse(event.body);
        console.log(`Ricevuta offerta: Squadra=${squadra}, Giocatore=${nome}, Offerta=${offerta}`);

        const TEAM_PASSWORDS = JSON.parse(TEAM_PASSWORDS_JSON);

        if (TEAM_PASSWORDS[squadra] !== password) {
            console.log(`Password errata per la squadra ${squadra}.`);
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Password errata' }),
            };
        }
        
        console.log("Password corretta. Procedo con l'invio ad Airtable.");

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
            console.error('Errore da Airtable:', airtableResponse.status, airtableResponse.statusText);
            console.error('Dettagli errore Airtable:', errorBody);
            throw new Error('Errore durante la comunicazione con Airtable.');
        }

        console.log("Offerta inviata con successo ad Airtable.");
        const responseData = await airtableResponse.json();

        return {
            statusCode: 200,
            body: JSON.stringify(responseData),
        };

    } catch (error) {
        // Questo catturerà qualsiasi errore, dal parsing JSON ai fallimenti del fetch
        console.error("ERRORE NON GESTITO nella funzione 'post-bid':", error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Si è verificato un errore interno nel server.",
                details: error.message
            }),
        };
    }
};

