import React from 'react';
import { Link } from 'react-router-dom';
import type { Ticket } from '../../../types';

export const TicketCard = ({ ticket }: { ticket: Ticket }) => {
    return (
        <Link to={`/tickets/${ticket.id}`} className="card">
            <div className="card-header">
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>#{ticket.id.split('-')[0]}</span>
                <span className={`badge ${ticket.status}`}>
                    {ticket.status}
                </span>
            </div>
            <div className="card-body">
                {ticket.content}
            </div>
            <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Priority: {ticket.priority}</span>
                <span>{new Date(ticket.created_at).toLocaleTimeString()}</span>
            </div>
        </Link>
    );
};
