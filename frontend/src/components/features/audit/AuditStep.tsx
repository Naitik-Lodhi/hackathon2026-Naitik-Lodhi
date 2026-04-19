import React from 'react';
import type { AuditLog } from '../../../types';

export const AuditStep = ({ log }: { log: AuditLog }) => {
    return (
        <div className="timeline-step">
            <div className={`timeline-dot ${log.status}`}>
                {log.status === 'success' ? '✓' : '✖'}
            </div>
            <div className="timeline-content">
                <div className="timeline-header">
                    <span style={{ color: 'var(--accent)' }}>{log.tool_name}</span>
                    <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>
                        Step {log.step} (Attempt {log.attempt}) &mdash; {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                    <div className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>INPUT</div>
                    <div className="json-viewer">{log.input}</div>
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                    <div className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>OUTPUT</div>
                    <div className={"json-viewer " + (log.status === 'failure' ? 'error-text' : '')} 
                         style={log.status === 'failure' ? { color: 'var(--status-escalated)'} : {}}>
                        {log.output}
                    </div>
                </div>
                {log.decision && (
                    <div style={{ marginTop: '0.75rem', padding: '0.5rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderLeft: '3px solid var(--accent)', borderRadius: '0 4px 4px 0' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Agent Decision:</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{log.decision}</div>
                    </div>
                )}
            </div>
        </div>
    );
};
