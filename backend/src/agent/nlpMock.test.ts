import { classifyTicket, extractEntities } from './nlpMock';

describe('nlpMock', () => {
    describe('classifyTicket', () => {
        it('should classify refund correctly', () => {
            expect(classifyTicket('I want my money back')).toBe('refund');
            expect(classifyTicket('double charged for my order')).toBe('refund');
        });

        it('should classify cancellation correctly', () => {
            expect(classifyTicket('Please cancel this order')).toBe('cancellation');
        });

        it('should classify shipping correctly', () => {
            expect(classifyTicket('where is my package?')).toBe('shipping');
        });

        it('should default to ambiguous if no match', () => {
            expect(classifyTicket('I love this site')).toBe('ambiguous');
        });
    });

    describe('extractEntities', () => {
        it('should extract email if present', () => {
            const res = extractEntities('My email is test@example.com please help');
            expect(res.email).toBe('test@example.com');
        });

        it('should extract order ID if present', () => {
            const res = extractEntities('Order #12345 missing');
            expect(res.order_id).toBe('order-12345');
        });

        it('should provide fallback determinism', () => {
            const res = extractEntities('Hello');
            expect(res.email).toContain('@mock.com');
            expect(res.order_id).toBe('order-5'); // "Hello" is length 5
        });
    });
});
