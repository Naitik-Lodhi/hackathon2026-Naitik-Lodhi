const API_BASE_URL = 'http://localhost:3001/api';

export const apiClient = {
  getTickets: async () => {
    const res = await fetch(`${API_BASE_URL}/tickets`);
    return res.json();
  },
  getCurrentProcessing: async () => {
    const res = await fetch(`${API_BASE_URL}/tickets/current`);
    return res.json();
  },
  getTicket: async (id: string) => {
    const res = await fetch(`${API_BASE_URL}/tickets/${id}`);
    return res.json();
  },
  getTicketAudit: async (id: string) => {
    const res = await fetch(`${API_BASE_URL}/tickets/${id}/audit`);
    return res.json();
  },
  seedData: async () => {
    const res = await fetch(`${API_BASE_URL}/tickets/seed`, { method: 'POST' });
    return res.json();
  },
  triggerAgent: async () => {
    const res = await fetch(`${API_BASE_URL}/tickets/trigger`, { method: 'POST' });
    return res.json();
  }
};
