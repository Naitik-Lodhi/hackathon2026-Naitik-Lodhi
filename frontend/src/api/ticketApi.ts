import { type ApiResponse, type AuditLog, type Ticket } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  console.warn("⚠️ VITE_API_URL is missing in production! API calls will likely fail or return HTML.");
}

console.log("API Base URL:", BASE_URL);

const handleResponse = async (res: Response) => {
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }
  
  const text = await res.text();
  console.error("Non-JSON response received:", text.substring(0, 200));
  
  return {
    success: false,
    error: {
      code: 'INVALID_RESPONSE',
      message: `Server returned non-JSON response (${res.status}). Please check if API URL is correct.`
    }
  };
};

export const ticketApi = {
  async getTickets(): Promise<ApiResponse<Ticket[]>> {
    const res = await fetch(`${BASE_URL}`);
    return handleResponse(res);
  },

  async getCurrentTicket(): Promise<ApiResponse<Ticket | null>> {
    const res = await fetch(`${BASE_URL}/current`);
    return handleResponse(res);
  },

  async getTicketById(id: string): Promise<ApiResponse<Ticket>> {
    const res = await fetch(`${BASE_URL}/${id}`);
    return handleResponse(res);
  },

  async getTicketAudit(id: string): Promise<ApiResponse<AuditLog[]>> {
    const res = await fetch(`${BASE_URL}/${id}/audit`);
    return handleResponse(res);
  },

  async triggerProcessing(): Promise<ApiResponse<any>> {
    const res = await fetch(`${BASE_URL}/trigger`, { method: 'POST' });
    return handleResponse(res);
  },

  async seedTickets(dataset?: any): Promise<ApiResponse<any>> {
    const res = await fetch(`${BASE_URL}/seed`, {
      method: 'POST',
      headers: dataset ? { 'Content-Type': 'application/json' } : undefined,
      body: dataset ? JSON.stringify(dataset) : undefined,
    });
    return handleResponse(res);
  },

  async importData(source: string, data: any): Promise<ApiResponse<any>> {
    const res = await fetch(`${BASE_URL}/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, data }),
    });
    return handleResponse(res);
  },

  async getSystemStatus(): Promise<ApiResponse<any>> {
    const res = await fetch(`${BASE_URL}/status`);
    return handleResponse(res);
  },
};
