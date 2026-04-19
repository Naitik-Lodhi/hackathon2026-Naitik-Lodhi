import React from 'react';
import type { Ticket } from '../types';

interface ProcessingStatusProps {
  currentTicket: Ticket | null;
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ currentTicket }) => {
  const isProcessing = !!currentTicket;

  return (
    <div className={`processing-banner ${isProcessing ? 'active' : ''}`}>
      <div style={{ 
        width: '12px', 
        height: '12px', 
        borderRadius: '50%', 
        backgroundColor: isProcessing ? 'var(--primary)' : 'var(--text-muted)',
        animation: isProcessing ? 'pulse 1.5s infinite' : 'none'
      }} />
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isProcessing ? 'var(--primary)' : 'var(--text-muted)' }}>
          {isProcessing ? 'AGENT ACTIVE' : 'AGENT IDLE'}
        </span>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
          {isProcessing 
            ? `Processing Ticket #${currentTicket.id.substring(0, 8)}` 
            : 'Static Monitoring Mode'}
        </h3>
      </div>
      {isProcessing && (
        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '400px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          "{currentTicket.content}"
        </div>
      )}
      
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
