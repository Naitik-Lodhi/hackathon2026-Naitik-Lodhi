import React from 'react';
import type { AuditLog, Ticket } from '../types';
import { AuditStep } from './AuditStep';

interface AuditTimelineProps {
  logs: AuditLog[];
  selectedTicket: Ticket | null;
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({ logs, selectedTicket }) => {
  if (!selectedTicket) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
        <p>Select a ticket to view the autonomous reasoning chain.</p>
      </div>
    );
  }

  return (
    <div className="scroll-area" style={{ height: '100%' }}>
      <div style={{ padding: '0 0.5rem' }}>
        <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Ticket #{selectedTicket.id.substring(0, 8)}</h2>
            <span className={`badge`} style={{ backgroundColor: `var(--${selectedTicket.status})`, color: 'white' }}>
              {selectedTicket.status}
            </span>
          </div>
          <p style={{ marginTop: '0.75rem', fontSize: '1rem', color: 'var(--text)' }}>
            "{selectedTicket.content}"
          </p>
        </div>

        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '1rem' }}>
          Autonomous Audit Trail
        </h3>

        {logs.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
            Awaiting processing logs...
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {logs.sort((a, b) => a.step - b.step).map((log) => (
              <AuditStep key={log.id} log={log} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
