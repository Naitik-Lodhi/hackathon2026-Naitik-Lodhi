import { processAllTickets } from './ticketService';
import { query } from '../db/db';
import { processTicket } from '../agent/agentEngine';

jest.mock('../db/db');
jest.mock('../agent/agentEngine');

describe('ticketService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should chunk tickets and process them concurrently via Promise.all', async () => {
        // Mock 4 tickets, concurrencyLimit = 3
        const mockRows = [
            { id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }
        ];
        (query as jest.Mock).mockResolvedValue({ rows: mockRows });

        await processAllTickets(3);

        expect(query).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM tickets WHERE status = \'queued\''));
        
        // Ensure processTicket was called exactly 4 times
        expect(processTicket).toHaveBeenCalledTimes(4);
    });

    it('should do nothing if no tickets are queued', async () => {
        (query as jest.Mock).mockResolvedValue({ rows: [] });

        await processAllTickets(3);

        expect(processTicket).not.toHaveBeenCalled();
    });
});
