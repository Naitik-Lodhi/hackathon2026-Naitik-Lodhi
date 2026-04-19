import { Request, Response } from 'express';
import { query } from '../db/db';
import { ApiResponse } from '../types';
import { processAllTickets, isAgentActive, scheduleAgentRun } from '../services/ticketService';
import { seedTicketsFromData } from '../db/seedTickets';
import { importDataset, loadDefaultDataset } from '../services/dataImportService';

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

        const result = await query(`INSERT INTO tickets (content, priority, status, data_source) VALUES ($1, $2, 'queued', 'manual') RETURNING *`, [content, priority]);
        scheduleAgentRun(0);
        res.status(201).json({ success: true, data: result.rows[0], message: 'Ticket accepted and queued for automatic processing.' });
    } catch (err: any) {
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
}

export const seedData = async (req: Request, res: Response) => {
  try {
    const hasBody = req.body && Object.keys(req.body).length > 0;
    const dataset = hasBody ? req.body : loadDefaultDataset();
    const summary = hasBody
      ? await importDataset(dataset, req.body.source || 'upload')
      : await seedTicketsFromData();
    scheduleAgentRun(0);
    res.json({ success: true, data: summary, message: `Loaded ${summary.tickets} tickets from ${summary.source}. Processing started automatically.` } as ApiResponse<any>);
  } catch (err: any) {
    console.error('Seed validation/import failed', err);
    res.status(400).json({ success: false, error: { code: 'INVALID_IMPORT', message: err.message } });
  }
};

export const importExternalData = async (req: Request, res: Response) => {
  try {
    const { source = 'api', data } = req.body ?? {};
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Request requires { source, data } with data as an object.' } });
    }

    const summary = await importDataset(data, source);
    scheduleAgentRun(0);
    res.json({ success: true, data: summary, message: `Imported ${summary.tickets} tickets from ${summary.source}. Processing started automatically.` } as ApiResponse<any>);
  } catch (err: any) {
    console.error('External import failed', err);
    res.status(400).json({ success: false, error: { code: 'INVALID_IMPORT', message: err.message } });
  }
};

export const getSystemStatus = async (req: Request, res: Response) => {
  try {
    const ticketStats = await query(`
      SELECT
        COALESCE(data_source, 'manual') AS data_source,
        COALESCE(llm_status, 'not_run') AS llm_status,
        fallback_used,
        COUNT(*)::int AS count
      FROM tickets
      GROUP BY data_source, llm_status, fallback_used
      ORDER BY data_source, llm_status, fallback_used
    `);
    res.json({
      success: true,
      data: {
        agent_active: isAgentActive(),
        llm_configured: process.env.USE_LLM === 'true',
        provider: process.env.LLM_PROVIDER || 'gemini',
        stats: ticketStats.rows,
      },
    } as ApiResponse<any>);
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
};

export const resetDatabase = async (req: Request, res: Response) => {
    try {
        await query(`TRUNCATE tickets, ticket_runs, audit_logs, support_data_records RESTART IDENTITY CASCADE`);
        res.json({ success: true, message: 'Database reset successful' });
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
