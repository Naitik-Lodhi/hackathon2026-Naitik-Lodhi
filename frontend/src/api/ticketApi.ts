import { type ApiResponse, type AuditLog, type Ticket } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const ticketApi = {
  async getTickets(): Promise<ApiResponse<Ticket[]>> {
    const res = await fetch(`${BASE_URL}`);
    return res.json();
  },

  async getCurrentTicket(): Promise<ApiResponse<Ticket | null>> {
    const res = await fetch(`${BASE_URL}/current`);
    return res.json();
  },

  async getTicketById(id: string): Promise<ApiResponse<Ticket>> {
    const res = await fetch(`${BASE_URL}/${id}`);
    return res.json();
  },

  async getTicketAudit(id: string): Promise<ApiResponse<AuditLog[]>> {
    const res = await fetch(`${BASE_URL}/${id}/audit`);
    return res.json();
  },

  async triggerProcessing(): Promise<ApiResponse<any>> {
    const res = await fetch(`${BASE_URL}/trigger`, { method: 'POST' });
    return res.json();
  },

  async seedTickets(dataset?: any): Promise<ApiResponse<any>> {
    const res = await fetch(`${BASE_URL}/seed`, {
      method: 'POST',
      headers: dataset ? { 'Content-Type': 'application/json' } : undefined,
      body: dataset ? JSON.stringify(dataset) : undefined,
    });
    return res.json();
  },

  async importData(source: string, data: any): Promise<ApiResponse<any>> {
    const res = await fetch(`${BASE_URL}/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, data }),
    });
    return res.json();
  },

  async getSystemStatus(): Promise<ApiResponse<any>> {
    const res = await fetch(`${BASE_URL}/status`);
    return res.json();
  },
};
