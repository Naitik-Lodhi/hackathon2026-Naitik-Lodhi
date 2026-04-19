import React from 'react';
import type { Ticket } from '../types';

interface ProcessingStatusProps {
  currentTicket: Ticket | null;
  systemStatus?: any;
}

export const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ currentTicket, systemStatus }) => {
  const isProcessing = !!currentTicket;
  const latestStats = systemStatus?.stats ?? [];
  const fallbackCount = latestStats
    .filter((row: any) => row.fallback_used || row.llm_status === 'fallback' || row.llm_status === 'quota_exceeded')
    .reduce((sum: number, row: any) => sum + Number(row.count), 0);
  const activeCount = latestStats
    .filter((row: any) => row.llm_status === 'active')
    .reduce((sum: number, row: any) => sum + Number(row.count), 0);

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
            : `Data-driven mode | LLM active: ${activeCount} | fallback: ${fallbackCount}`}
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
