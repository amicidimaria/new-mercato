// netlify/functions/post-bid.js

import fetch from 'node-fetch';

const {
    AIRTABLE_API_KEY,
    AIRTABLE_BASE_ID,
    AIRTABLE_TABLE_NAME,
    TEAM_PASSWORDS_JSON
} = process.env;

export const handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { squadra, nome, offerta, password } = JSON.parse(event.body);

        const teamPasswords = JSON.parse(TEAM_PASSWORDS_JSON);

        if (!teamPasswords[squadra] || teamPasswords[squadra] !== password) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Password errata per la squadra selezionata!' })
            };
        }
        
        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`;
        
        const dataToSend = {
            fields: {
                squadra,
                nome,
                offerta: Number(offerta)
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataToSend)
        });

        if (!response.ok) {
            console.error('Errore da Airtable:', await response.text());
            throw new Error('Errore durante la registrazione dell\'offerta su Airtable.');
        }

        const responseData = await response.json();

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ success: true, record: responseData })
        };

    } catch (error) {
        console.error('Errore nella funzione post-bid:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: error.message || 'Errore interno del server.' })
        };
    }
};

