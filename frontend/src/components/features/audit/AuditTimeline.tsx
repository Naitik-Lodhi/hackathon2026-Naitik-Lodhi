import React from 'react';
import type { AuditLog } from '../../../types';
import { AuditStep } from './AuditStep';
import { BaseSpinner } from '../../ui/BaseSpinner';

export const AuditTimeline = ({ logs, loading }: { logs: AuditLog[], loading: boolean }) => {
    if (loading) {
        return (
            <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
                <BaseSpinner />
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="placeholder-text">
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏱️</div>
                <div>Awaiting processing...</div>
            </div>
        );
    }

    return (
        <div className="timeline">
            {logs.map(log => <AuditStep key={log.id} log={log} />)}
        </div>
    );
};
