import React from 'react';
import { type Ticket } from '../../../types';
import { BaseSpinner } from '../../ui/BaseSpinner';

export const ProcessingStatus = ({ currentTicket }: { currentTicket: Ticket | null }) => {
    if (!currentTicket) {
        return null;
    }

    return (
        <div className="active-ticket-box">
            <BaseSpinner />
            <div style={{ flex: 1 }}>
                <h3 className="title" style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>Agent is working...</h3>
                <p className="text-muted" style={{ fontSize: '0.9rem' }}>
                    <strong>ID #{currentTicket.id.split('-')[0]}</strong> &mdash; {currentTicket.content}
                </p>
            </div>
            <div className="badge processing">
                Processing
            </div>
        </div>
    );
};
