import { query } from '../db/db';
import { processTicket as agentProcessTicket } from '../agent/agentEngine';

let isAgentRunning = false;

export const isAgentActive = () => isAgentRunning;

export const processAllTickets = async (concurrencyLimit = 3) => {
    if (isAgentRunning) {
        console.log('⚠️ Agent is already running. Skipping trigger.');
        return false;
    }

    try {
        isAgentRunning = true;
        
        // Fetch a larger queue of pending tickets
        const res = await query(`SELECT * FROM tickets WHERE status = 'queued' ORDER BY priority DESC LIMIT 30`);
        const tickets = res.rows;
        
        if (tickets.length === 0) {
            console.log('ℹ️ No queued tickets found to process.');
            isAgentRunning = false;
            return true;
        }
        
        console.log('🚀 Starting autonomous processing run...');
        console.log(`📊 Pulled ${tickets.length} tickets. Batch size: ${concurrencyLimit}.`);
        
        // Split tickets into chunks of size concurrencyLimit
        const chunks = [];
        for (let i = 0; i < tickets.length; i += concurrencyLimit) {
            chunks.push(tickets.slice(i, i + concurrencyLimit));
        }

        // Process each chunk
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            console.log(`📦 Processing Batch ${i + 1}/${chunks.length} (${chunk.length} tickets)...`);
            
            // Execute batch internally in parallel via Promise.all
            await Promise.all(chunk.map(async (t: any) => {
                try {
                    console.log(`🔍 Processing Ticket: ${t.id.substring(0, 8)} | "${t.content.substring(0, 30)}..."`);
                    await agentProcessTicket(t);
                    console.log(`✅ Finished Ticket: ${t.id.substring(0, 8)}`);
                } catch (err) {
                    console.error(`❌ Failed Ticket: ${t.id.substring(0, 8)}`, err);
                }
            }));
        }
        
        console.log('🏁 Entire autonomous run finished.');
        isAgentRunning = false;
        return true;
    } catch (error) {
        console.error('🔥 Critical failure in processAllTickets:', error);
        isAgentRunning = false;
        throw error;
    }
};

// Polling placeholder - currently disabled as per instructions but kept as a utility
export const startAgent = () => {
    setInterval(() => {
        processAllTickets(3).catch(e => console.error(e));
    }, 20000); 
}
