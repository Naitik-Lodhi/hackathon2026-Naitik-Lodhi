import { query } from '../db/db';
import { processTicket as agentProcessTicket } from '../agent/agentEngine';

let isAgentRunning = false;
let rerunRequested = false;
let queueTimer: NodeJS.Timeout | null = null;

export const isAgentActive = () => isAgentRunning;

export const processAllTickets = async (concurrencyLimit = 3) => {
  if (isAgentRunning) {
    console.log('Agent is already running. Queued another pass.');
    rerunRequested = true;
    return false;
  }

  try {
    isAgentRunning = true;
    rerunRequested = false;

    const res = await query(`SELECT * FROM tickets WHERE status = 'queued' ORDER BY priority DESC LIMIT 30`);
    const tickets = res.rows;

    if (tickets.length === 0) {
      console.log('No queued tickets found to process.');
      isAgentRunning = false;
      if (rerunRequested) scheduleAgentRun(250);
      return true;
    }

    console.log('Starting autonomous processing run...');
    console.log(`Pulled ${tickets.length} tickets. Batch size: ${concurrencyLimit}.`);

    const chunks = [];
    for (let i = 0; i < tickets.length; i += concurrencyLimit) {
      chunks.push(tickets.slice(i, i + concurrencyLimit));
    }

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`Processing batch ${i + 1}/${chunks.length} (${chunk.length} tickets).`);

      await Promise.all(chunk.map(async (ticket: any) => {
        try {
          console.log(`Processing ticket ${ticket.id.substring(0, 8)}.`);
          await agentProcessTicket(ticket);
          console.log(`Finished ticket ${ticket.id.substring(0, 8)}.`);
        } catch (err) {
          console.error(`Failed ticket ${ticket.id.substring(0, 8)}.`, err);
        }
      }));
    }

    console.log('Autonomous run finished.');
    isAgentRunning = false;
    if (rerunRequested) scheduleAgentRun(250);
    return true;
  } catch (error) {
    console.error('Critical failure in processAllTickets:', error);
    isAgentRunning = false;
    if (rerunRequested) scheduleAgentRun(1000);
    throw error;
  }
};

export const scheduleAgentRun = (delayMs = 0) => {
  if (queueTimer) clearTimeout(queueTimer);

  queueTimer = setTimeout(() => {
    queueTimer = null;
    processAllTickets(3).catch(error => console.error(error));
  }, delayMs);
};

export const startAgent = () => {
  scheduleAgentRun(0);

  setInterval(() => {
    scheduleAgentRun(0);
  }, 20000);
};
