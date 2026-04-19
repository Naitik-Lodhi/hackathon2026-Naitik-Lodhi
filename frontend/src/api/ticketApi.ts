import { type ApiResponse, type AuditLog, type Ticket } from '../types';

// Normalize BASE_URL by removing any trailing slashes
const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '');

if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  console.warn("⚠️ VITE_API_URL is missing in production! API calls will likely fail or return HTML.");
}

console.log("API Base URL (normalized):", BASE_URL);

/**
 * Utility to construct safe URLs without double slashes
 */
const getUrl = (endpoint: string) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  // If we just want the base, return it
  if (endpoint === '' || endpoint === '/') return BASE_URL;
  return `${BASE_URL}${cleanEndpoint}`;
};

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
      message: `Server returned non-JSON response (${res.status}). Full URL: ${res.url}`
    }
  };
};

export const ticketApi = {
  async getTickets(): Promise<ApiResponse<Ticket[]>> {
    const res = await fetch(getUrl(''));
    return handleResponse(res);
  },

  async getCurrentTicket(): Promise<ApiResponse<Ticket | null>> {
    const res = await fetch(getUrl('/current'));
    return handleResponse(res);
  },

  async getTicketById(id: string): Promise<ApiResponse<Ticket>> {
    const res = await fetch(getUrl(`/${id}`));
    return handleResponse(res);
  },

  async getTicketAudit(id: string): Promise<ApiResponse<AuditLog[]>> {
    const res = await fetch(getUrl(`/${id}/audit`));
    return handleResponse(res);
  },

  async triggerProcessing(): Promise<ApiResponse<any>> {
    const res = await fetch(getUrl('/trigger'), { method: 'POST' });
    return handleResponse(res);
  },

  async seedTickets(dataset?: any): Promise<ApiResponse<any>> {
    const res = await fetch(getUrl('/seed'), {
      method: 'POST',
      headers: dataset ? { 'Content-Type': 'application/json' } : undefined,
      body: dataset ? JSON.stringify(dataset) : undefined,
    });
    return handleResponse(res);
  },

  async importData(source: string, data: any): Promise<ApiResponse<any>> {
    const res = await fetch(getUrl('/import'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, data }),
    });
    return handleResponse(res);
  },

  async getSystemStatus(): Promise<ApiResponse<any>> {
    const res = await fetch(getUrl('/status'));
    return handleResponse(res);
  },
};
