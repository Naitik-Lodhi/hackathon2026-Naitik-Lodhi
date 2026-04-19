import React, { useEffect, useState } from 'react';
import { useTickets } from '../hooks/useTickets';
import { ticketApi } from '../api/ticketApi';
import { ProcessingStatus } from '../components/ProcessingStatus';
import { TicketCard } from '../components/TicketCard';
import { AuditTimeline } from '../components/AuditTimeline';
import { UploadModal } from '../components/UploadModal';

type TicketTab = 'all' | string;

const baseTicketTabs: Array<{ key: TicketTab; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'queued', label: 'Queue' },
  { key: 'processing', label: 'Processing' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'escalated', label: 'Escalated' },
];

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [lastImport, setLastImport] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TicketTab>('all');

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      const res = await ticketApi.seedTickets();
      if (!res.success) alert(res.error?.message || 'Failed to seed default dataset');
      setLastImport(res.message || 'Default dataset loaded');
      await refresh();
      const statusRes = await ticketApi.getSystemStatus();
      if (statusRes.success) setSystemStatus(statusRes.data);
    } catch (err) {
      alert('Failed to seed tickets');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleUploadSuccess = async (message: string) => {
    setLastImport(message);
    await refresh();
    const statusRes = await ticketApi.getSystemStatus();
    if (statusRes.success) setSystemStatus(statusRes.data);
  };

  const dynamicTabs = Array.from(new Set(tickets.map(ticket => ticket.status)))
    .filter(status => !baseTicketTabs.some(tab => tab.key === status))
    .map(status => ({ key: status, label: status.replace(/_/g, ' ') }));

  const ticketTabs = [...baseTicketTabs, ...dynamicTabs];

  const counts = ticketTabs.reduce<Record<string, number>>((acc, tab) => {
    acc[tab.key] = tab.key === 'all'
      ? tickets.length
      : tickets.filter(ticket => ticket.status === tab.key).length;
    return acc;
  }, {
    all: 0,
    queued: 0,
    processing: 0,
    resolved: 0,
    escalated: 0,
  });

  const filteredTickets = activeTab === 'all'
    ? tickets
    : tickets.filter(ticket => ticket.status === activeTab);

  const selectedTicket = tickets.find(t => t.id === selectedTicketId) || null;

  useEffect(() => {
    ticketApi.getSystemStatus()
      .then(res => {
        if (res.success) setSystemStatus(res.data);
      })
      .catch(() => undefined);
  }, [tickets.length, currentTicket?.status]);

  return (
    <div className="dashboard-container">
      <header className="header">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
            ShopWave Agent <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>| Admin Console</span>
          </h1>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>Data Source: <strong style={{ color: 'var(--success)' }}>Database</strong></span>
            {systemStatus?.counts && (
              <>
                <span>Customers: {systemStatus.counts.customers}</span>
                <span>Orders: {systemStatus.counts.orders}</span>
                <span>Products: {systemStatus.counts.products}</span>
                <span>KB: {systemStatus.counts.kb}</span>
              </>
            )}
            {systemStatus && (
              <span>Active: {systemStatus.agent_active ? 'Yes' : 'No'}</span>
            )}
          </div>
        </div>
        <div className="header-actions">
          <button 
            className="btn-outline" 
            onClick={() => setIsModalOpen(true)}
          >
            Upload JSON Data
          </button>
          <button 
            className="btn-outline" 
            onClick={handleSeed} 
            disabled={isSeeding}
          >
            {isSeeding ? 'Loading...' : 'Use Default Dataset'}
          </button>
          <span className="btn-primary" style={{ cursor: 'default' }}>
            Auto Processing Enabled
          </span>
        </div>
      </header>

      {lastImport && (
        <div style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem', padding: '0.5rem 1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
          {lastImport}
        </div>
      )}

      <ProcessingStatus currentTicket={currentTicket} systemStatus={systemStatus} />

      <main className="main-grid">
        <section className="scroll-area">
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
              Tickets ({filteredTickets.length})
            </h3>
            <div className="ticket-tabs" role="tablist" aria-label="Ticket status filters">
              {ticketTabs.map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.key}
                  className={`ticket-tab ${activeTab === tab.key ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  <span>{tab.label}</span>
                  <span className="ticket-tab-count">{counts[tab.key]}</span>
                </button>
              ))}
            </div>
          </div>
          {loading && tickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading tickets...</div>
          ) : tickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', background: 'white', borderRadius: '12px', border: '1px dashed var(--border)' }}>
              No tickets found. Upload JSON or seed data to begin.
            </div>
          ) : filteredTickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', background: 'white', borderRadius: '8px', border: '1px dashed var(--border)' }}>
              No {activeTab === 'all' ? '' : activeTab} tickets found.
            </div>
          ) : (
            filteredTickets.map(ticket => (
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

      <UploadModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={handleUploadSuccess} 
      />
    </div>
  );
};
