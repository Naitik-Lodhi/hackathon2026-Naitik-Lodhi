import { Router } from 'express';
import { 
    getTickets, 
    getTicket, 
    getTicketAudit, 
    seedMockData, 
    triggerAgent, 
    getCurrentProcessingTicket,
    createTicket,
    resetDatabase
} from '../controllers/ticketController';

const router = Router();

router.get('/', getTickets);
router.post('/tickets', createTicket);
router.post('/reset', resetDatabase);
router.post('/seed', seedMockData);
router.post('/trigger', triggerAgent);
router.get('/current', getCurrentProcessingTicket);
router.get('/:id', getTicket);
router.get('/:id/audit', getTicketAudit);

export default router;
