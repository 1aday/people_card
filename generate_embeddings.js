import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/embed`;

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getPersonData(id) {
    const response = await fetch(
        `https://qvlppyyxadfueieyccnv.supabase.co/rest/v1/people_cards?id=eq.${id}`,
        {
            headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2bHBweXl4YWRmdWVpZXljY252Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk2NzI1OTgsImV4cCI6MjA1NTI0ODU5OH0.NBqttLwe2kHU3ESsM3iNwFewWwQZF05F0jSQIIi5HME'
            }
        }
    );
    const data = await response.json();
    return data[0];
}

async function generateEmbedding(id, personData) {
    try {
        const response = await fetch(EDGE_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ id, person_data: personData })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`HTTP error! status: ${response.status}, message: ${JSON.stringify(error)}`);
        }

        const result = await response.json();
        console.log(`Response from Edge Function for record ${id}:`, result);

        // Verify the embedding was saved
        const { data, error } = await supabase
            .from('people_cards')
            .select('id, embedding')
            .eq('id', id)
            .single();

        if (error) {
            console.error(`Error verifying embedding for record ${id}:`, error);
        } else {
            console.log(`Verification for record ${id}: embedding ${data.embedding ? 'saved' : 'not saved'}`);
        }

        console.log(`Successfully generated embedding for record ${id}`);
    } catch (error) {
        console.error(`Error generating embedding for record ${id}: ${error.message}`);
        throw error;
    }
}

async function getAllRecordsWithoutEmbeddings() {
    const response = await fetch(
        'https://qvlppyyxadfueieyccnv.supabase.co/rest/v1/people_cards?select=id&embedding=is.null',
        {
            headers: {
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2bHBweXl4YWRmdWVpZXljY252Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk2NzI1OTgsImV4cCI6MjA1NTI0ODU5OH0.NBqttLwe2kHU3ESsM3iNwFewWwQZF05F0jSQIIi5HME'
            }
        }
    );
    return await response.json();
}

async function processBatch(records, batchSize = 5) {
    const total = records.length;
    let processed = 0;
    
    while (processed < total) {
        const batch = records.slice(processed, processed + batchSize);
        console.log(`Processing batch of ${batch.length} records (${processed + 1}-${processed + batch.length} of ${total})`);
        
        await Promise.all(batch.map(async record => {
            const personData = await getPersonData(record.id);
            return generateEmbedding(record.id, personData);
        }));
        processed += batch.length;
        
        if (processed < total) {
            console.log('Waiting before processing next batch...');
            await sleep(1000); // 1 second delay between batches
        }
    }
}

async function main() {
    try {
        console.log('Fetching records without embeddings...');
        const records = await getAllRecordsWithoutEmbeddings();
        console.log(`Found ${records.length} records without embeddings`);
        
        if (records.length === 0) {
            console.log('No records need embeddings. Exiting...');
            return;
        }
        
        await processBatch(records);
        console.log('Finished processing all records');
    } catch (error) {
        console.error('Error in main process:', error);
    }
}

main(); 
