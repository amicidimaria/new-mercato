// netlify/functions/get-auctions.js

// Sintassi moderna per importare 'node-fetch'
import fetch from 'node-fetch';

const {
    AIRTABLE_API_KEY,
    AIRTABLE_BASE_ID,
    AIRTABLE_TABLE_NAME
} = process.env;

// Sintassi moderna per esportare la funzione handler
export const handler = async (event, context) => {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}?sort[0][field]=data&sort[0][direction]=desc`;

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`
            }
        });

        if (!response.ok) {
            return {
                statusCode: response.status,
                body: JSON.stringify({ message: response.statusText })
            };
        }

        const data = await response.json();

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(data)
        };
    } catch (error) {
        console.error('Errore nella funzione get-auctions:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Errore interno del server.' })
        };
    }
};

