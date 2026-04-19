import React, { useEffect, useState } from 'react';
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
  const [isUploading, setIsUploading] = useState(false);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [lastImport, setLastImport] = useState<string | null>(null);

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

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const parsed = JSON.parse(await file.text());
      const res = await ticketApi.importData(file.name, parsed);
      if (!res.success) {
        alert(res.error?.message || 'Upload rejected by validation');
      } else {
        setLastImport(res.message || `Imported ${file.name}`);
        await refresh();
        const statusRes = await ticketApi.getSystemStatus();
        if (statusRes.success) setSystemStatus(statusRes.data);
      }
    } catch (err: any) {
      alert(`Invalid JSON upload: ${err.message}`);
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

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
        </div>
        <div className="header-actions">
          <label className="btn-outline" style={{ cursor: isUploading ? 'not-allowed' : 'pointer' }}>
            {isUploading ? 'Uploading...' : 'Upload JSON'}
            <input
              type="file"
              accept="application/json,.json"
              onChange={handleUpload}
              disabled={isUploading}
              style={{ display: 'none' }}
            />
          </label>
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
        <div style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          {lastImport}
        </div>
      )}

      <ProcessingStatus currentTicket={currentTicket} systemStatus={systemStatus} />

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
