import React, { useState } from 'react';
import { useTickets } from '../hooks/useTickets';
import { ticketApi } from '../api/ticketApi';
import { ProcessingStatus } from '../components/ProcessingStatus';
import { TicketCard } from '../components/TicketCard';
import { AuditTimeline } from '../components/AuditTimeline';

export const Dashboard: React.FC = () => {
  const { 
    tickets, 
    currentTicket, 
    selectedTicketId, 
    setSelectedTicketId, 
    auditLogs, 
    loading, 
    refresh 
  } = useTickets();

  const [isSeeding, setIsSeeding] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      await ticketApi.seedTickets(10);
      refresh();
    } catch (err) {
      alert('Failed to seed tickets');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleTrigger = async () => {
    setIsTriggering(true);
    try {
      const res = await ticketApi.triggerProcessing();
      if (!res.success) alert(res.message || 'Already running');
      refresh();
    } catch (err) {
      alert('Failed to trigger agent');
    } finally {
      setIsTriggering(false);
    }
  };

  const selectedTicket = tickets.find(t => t.id === selectedTicketId) || null;

  return (
    <div className="dashboard-container">
      <header className="header">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
            ShopWave Agent <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>| Admin Console</span>
          </h1>
        </div>
        <div className="header-actions">
          <button 
            className="btn-outline" 
            onClick={handleSeed} 
            disabled={isSeeding}
          >
            {isSeeding ? 'Seeding...' : 'Seed Data'}
          </button>
          <button 
            className="btn-primary" 
            onClick={handleTrigger} 
            disabled={isTriggering}
          >
            {isTriggering ? 'Starting...' : 'Run Agent Queue'}
          </button>
        </div>
      </header>

      <ProcessingStatus currentTicket={currentTicket} />

      <main className="main-grid">
        <section className="scroll-area">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Ticket Queue ({tickets.length})</h3>
          {loading && tickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading tickets...</div>
          ) : tickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', background: 'white', borderRadius: '12px', border: '1px dashed var(--border)' }}>
              No tickets found. Seed data to begin.
            </div>
          ) : (
            tickets.map(ticket => (
              <TicketCard 
                key={ticket.id} 
                ticket={ticket} 
                isSelected={selectedTicketId === ticket.id}
                onSelect={setSelectedTicketId}
              />
            ))
          )}
        </section>

        <section className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <AuditTimeline logs={auditLogs} selectedTicket={selectedTicket} />
        </section>
      </main>
    </div>
  );
};
