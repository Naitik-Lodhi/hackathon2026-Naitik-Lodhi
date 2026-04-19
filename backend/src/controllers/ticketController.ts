import { Request, Response } from 'express';
import { query } from '../db/db';
import { ApiResponse } from '../types';
import { processAllTickets, isAgentActive } from '../services/ticketService';

export const getTickets = async (req: Request, res: Response) => {
  try {
    const result = await query(`SELECT * FROM tickets ORDER BY created_at DESC`);
    res.json({ success: true, data: result.rows } as ApiResponse<any>);
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

export const getTicket = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(`SELECT * FROM tickets WHERE id = $1`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
    }
    res.json({ success: true, data: result.rows[0] } as ApiResponse<any>);
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

export const getTicketAudit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(`SELECT * FROM audit_logs WHERE ticket_id = $1 ORDER BY step ASC`, [id]);
    res.json({ success: true, data: result.rows } as ApiResponse<any>);
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

export const getCurrentProcessingTicket = async (req: Request, res: Response) => {
  try {
    const result = await query(`SELECT * FROM tickets WHERE status = 'processing' ORDER BY updated_at DESC LIMIT 1`);
    if (result.rows.length === 0) {
      return res.json({ success: true, data: null } as ApiResponse<any>);
    }
    res.json({ success: true, data: result.rows[0] } as ApiResponse<any>);
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

export const createTicket = async (req: Request, res: Response) => {
    try {
        const { content, priority = 2 } = req.body;
        if (!content) {
            return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Content is required' } });
        }

        const result = await query(`INSERT INTO tickets (content, priority, status) VALUES ($1, $2, 'queued') RETURNING *`, [content, priority]);
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err: any) {
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
}

export const seedMockData = async (req: Request, res: Response) => {
  try {
    const templates = [
        "Where is my refund for {id}?",
        "My {product} arrived broken.",
        "Can I change the shipping address for {id}?",
        "How do I apply a discount code to {product}?",
        "The {product} battery life is not as advertised.",
        "I want to escalate {id} to a manager.",
        "Is {product} in stock?",
        "Can you cancel my order {id}?",
        "Lost my tracking number for {id}.",
        "I was double charged for {product}."
    ];

    const products = ["headphones", "smartwatch", "laptop", "phone case", "charger"];
    
    const count = req.body.count || 20;
    
    for (let i = 0; i < count; i++) {
        const priority = Math.floor(Math.random() * 3) + 1;
        const template = templates[Math.floor(Math.random() * templates.length)];
        const product = products[Math.floor(Math.random() * products.length)];
        const id = `order-${Math.floor(Math.random() * 9000) + 1000}`;
        
        const text = template
            .replace('{id}', id)
            .replace('{product}', product) + ` [ID: ${Date.now()}-${i}]`;
            
        await query(`INSERT INTO tickets (content, priority) VALUES ($1, $2)`, [text, priority]);
    }
    
    res.json({ success: true, message: `Seeded ${count} mock tickets` } as ApiResponse<any>);
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

export const resetDatabase = async (req: Request, res: Response) => {
    try {
        await query(`TRUNCATE tickets, audit_logs RESTART IDENTITY CASCADE`);
        res.json({ success: true, message: 'Database reset successful (Tickets and Audit Logs cleared)' });
    } catch (err: any) {
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
}

export const triggerAgent = async (req: Request, res: Response) => {
    try {
        if (isAgentActive()) {
            return res.status(409).json({ 
                success: false, 
                error: { code: 'CONFLICT', message: 'Agent is already running' } 
            });
        }

        processAllTickets(3).catch(e => console.error(e));
        res.json({ success: true, message: 'Agent triggered in background' });
    } catch(err: any) {
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
}
