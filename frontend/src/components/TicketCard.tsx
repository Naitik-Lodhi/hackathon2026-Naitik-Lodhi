import React from 'react';
import type { Ticket } from '../types';

interface TicketCardProps {
  ticket: Ticket;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export const TicketCard: React.FC<TicketCardProps> = ({ ticket, isSelected, onSelect }) => {
  return (
    <div 
      className={`card interactive ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(ticket.id)}
      style={{ marginBottom: '0.75rem' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
          #{ticket.id.substring(0, 8)}
        </span>
        <span className="badge" style={{ backgroundColor: `var(--${ticket.status})`, color: 'white' }}>
          {ticket.status}
        </span>
      </div>
      <p style={{ 
        fontSize: '0.875rem', 
        color: 'var(--text)', 
        display: '-webkit-box', 
        WebkitLineClamp: 2, 
        WebkitBoxOrient: 'vertical', 
        overflow: 'hidden' 
      }}>
        {ticket.content}
      </p>
      <div style={{ marginTop: '0.75rem', fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
        <span>Priority: {ticket.priority}</span>
        <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  );
};
