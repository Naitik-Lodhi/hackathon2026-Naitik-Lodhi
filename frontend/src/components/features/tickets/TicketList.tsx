import React from 'react';
import type { Ticket } from '../../../types';
import { TicketCard } from './TicketCard';
import { BaseSpinner } from '../../ui/BaseSpinner';

export const TicketList = ({ tickets, loading }: { tickets: Ticket[], loading: boolean }) => {
    if (loading) {
        return (
            <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
                <BaseSpinner />
            </div>
        );
    }

    if (tickets.length === 0) {
        return <div className="placeholder-text">No tickets found. Seed the database to get started.</div>;
    }

    return (
        <div className="grid">
            {tickets.map(t => <TicketCard key={t.id} ticket={t} />)}
        </div>
    );
};
