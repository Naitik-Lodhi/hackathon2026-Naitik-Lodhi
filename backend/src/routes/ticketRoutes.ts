import { Router } from 'express';
import { 
    getTickets, 
    getTicket, 
    getTicketAudit, 
    seedData,
    importExternalData,
    getSystemStatus,
    triggerAgent, 
    getCurrentProcessingTicket,
    createTicket,
    resetDatabase
} from '../controllers/ticketController';

const router = Router();

router.get('/', getTickets);
router.post('/tickets', createTicket);
router.post('/reset', resetDatabase);
router.post('/seed', seedData);
router.post('/import', importExternalData);
router.post('/trigger', triggerAgent);
router.get('/status', getSystemStatus);
router.get('/current', getCurrentProcessingTicket);
router.get('/:id/audit', getTicketAudit);
router.get('/:id', getTicket);

export default router;
