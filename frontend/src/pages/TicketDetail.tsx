import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { type Ticket, type AuditLog } from '../types';
import { AuditTimeline } from '../components/features/audit/AuditTimeline';
import { ArrowLeft } from 'lucide-react';
import { BaseSpinner } from '../components/ui/BaseSpinner';

export const TicketDetail = () => {
    const { id } = useParams<{ id: string }>();
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async (silent = false) => {
        if (!id) return;
        if (!silent) setLoading(true);
        try {
            const ticketRes = await apiClient.getTicket(id);
            const logsRes = await apiClient.getTicketAudit(id);
            if (ticketRes.success) setTicket(ticketRes.data);
            if (logsRes.success) setLogs(logsRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Poll for real-time audit updates while viewing
        const interval = setInterval(() => fetchData(true), 3000);
        return () => clearInterval(interval);
    }, [id]);

    if (loading) {
        return <div className="container" style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}><BaseSpinner /></div>;
    }

    if (!ticket) {
        return (
            <div className="container">
                <div className="placeholder-text">Ticket not found.</div>
                <Link to="/" className="button" style={{ display: 'inline-block', margin: '0 auto' }}>Go Back</Link>
            </div>
        )
    }

    return (
        <div className="container">
            <div className="header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link to="/" className="button" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', padding: '0.5rem' }}>
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="title">Ticket #{ticket.id.split('-')[0]}</h1>
                    <div className={`badge ${ticket.status}`}>
                        {ticket.status}
                    </div>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <div className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                    Received at {new Date(ticket.created_at).toLocaleString()} | Priority: {ticket.priority}
                </div>
                <div style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
                    {ticket.content}
                </div>
            </div>

            <h2 className="title" style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Audit Timeline</h2>
            <p className="text-muted" style={{ marginBottom: '1rem' }}>
                This timeline traces exactly how the AI agent reasoned about and executed tools for this ticket.
            </p>
            
            <AuditTimeline logs={logs} loading={loading} />
        </div>
    );
};
