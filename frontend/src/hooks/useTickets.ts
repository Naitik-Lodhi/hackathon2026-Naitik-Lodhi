import { useState, useEffect, useCallback } from 'react';
import { type Ticket, type AuditLog } from '../types';
import { ticketApi } from '../api/ticketApi';

export const useTickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    try {
      const [ticketsRes, currentRes] = await Promise.all([
        ticketApi.getTickets(),
        ticketApi.getCurrentTicket(),
      ]);

      if (ticketsRes.success) setTickets(ticketsRes.data);
      if (currentRes.success) setCurrentTicket(currentRes.data);
      
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      // Don't show global error for periodic poll if we have data
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAudit = useCallback(async (id: string) => {
    try {
      const res = await ticketApi.getTicketAudit(id);
      if (res.success) setAuditLogs(res.data);
    } catch (err) {
      console.error('Audit fetch error:', err);
    }
  }, []);

  // Polling loop
  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 3000);
    return () => clearInterval(interval);
  }, [fetchTickets]);

  // Refetch audit when selection changes or periodically if selected ticket is processing
  useEffect(() => {
    if (selectedTicketId) {
      fetchAudit(selectedTicketId);
      const interval = setInterval(() => {
        const selected = tickets.find(t => t.id === selectedTicketId);
        if (selected?.status === 'processing') {
          fetchAudit(selectedTicketId);
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedTicketId, fetchAudit, tickets]);

  return {
    tickets,
    currentTicket,
    selectedTicketId,
    setSelectedTicketId,
    auditLogs,
    loading,
    error,
    refresh: fetchTickets,
  };
};
