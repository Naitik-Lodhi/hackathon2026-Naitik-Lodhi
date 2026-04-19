import { processTicket } from './agentEngine';
import { getClient } from '../db/db';
import { tools } from '../tools/mockTools';

jest.mock('../db/db');
jest.mock('../tools/mockTools', () => ({
    tools: {
        get_customer: jest.fn(),
        get_order: jest.fn(),
        search_knowledge_base: jest.fn(),
        check_refund_eligibility: jest.fn(),
        issue_refund: jest.fn(),
        send_reply: jest.fn(),
        escalate: jest.fn()
    }
}));

describe('agentEngine', () => {
    let mockClient: any;

    beforeEach(() => {
        mockClient = {
            query: jest.fn(),
            release: jest.fn()
        };
        (getClient as jest.Mock).mockResolvedValue(mockClient);
        jest.clearAllMocks();
    });

    it('should run refund logic when classification is refund and is eligible', async () => {
        (tools.get_customer as jest.Mock).mockResolvedValue({});
        (tools.get_order as jest.Mock).mockResolvedValue({});
        (tools.search_knowledge_base as jest.Mock).mockResolvedValue({});
        (tools.check_refund_eligibility as jest.Mock).mockResolvedValue({ eligible: true });
        (tools.issue_refund as jest.Mock).mockResolvedValue({});
        (tools.send_reply as jest.Mock).mockResolvedValue({});

        await processTicket({ id: 't1', content: 'refund my order #123', status: 'queued', priority: 1 });

        // Should call 6 tools (+ finalize DB logic)
        expect(tools.get_customer).toHaveBeenCalled();
        expect(tools.check_refund_eligibility).toHaveBeenCalledWith('order-123');
        expect(tools.issue_refund).toHaveBeenCalled();
        expect(tools.send_reply).toHaveBeenCalled();
        
        // Final status should be resolved
        expect(mockClient.query).toHaveBeenCalledWith(
            expect.stringContaining('UPDATE tickets SET status = $1'),
            ['resolved', 't1']
        );
    });

    it('should escalate if tool chain fails continuously', async () => {
        // Force permanent failure
        (tools.get_customer as jest.Mock).mockRejectedValue(new Error('Fatal error'));

        await processTicket({ id: 't2', content: 'general question', status: 'queued', priority: 1 });

        // Should call escalate
        expect(tools.escalate).toHaveBeenCalled();
        
        // Final status should be escalated
        expect(mockClient.query).toHaveBeenCalledWith(
            expect.stringContaining('UPDATE tickets SET status = $1'),
            ['escalated', 't2']
        );
    });
});
