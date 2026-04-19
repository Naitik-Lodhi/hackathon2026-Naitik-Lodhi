import { type ApiResponse, type AuditLog, type Ticket } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

  async seedTickets(count: number = 10): Promise<ApiResponse<any>> {
    const res = await fetch(`${BASE_URL}/seed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count }),
    });
    return res.json();
  },
};
