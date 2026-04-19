import React, { useState } from 'react';

interface JsonDisplayProps {
  data: any;
  label?: string;
}

const renderValue = (val: any): string => {
  if (val === null || val === undefined) return 'N/A';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
};

const KeyValueRow: React.FC<{ label: string; value: any }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
    <span style={{ fontWeight: 600, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{label.replace(/_/g, ' ')}:</span>
    <span style={{ color: 'var(--text)' }}>{renderValue(value)}</span>
  </div>
);

export const JsonDisplay: React.FC<JsonDisplayProps> = ({ data, label }) => {
  const [showRaw, setShowRaw] = useState(false);

  if (!data) return null;

  // Identify common structures
  const isCustomer = data.customer_id || data.email && data.name;
  const isOrder = data.order_id || data.total_amount;
  const isProduct = data.product_id || (data.price && data.name && !data.order_id);
  const isKB = data.results && Array.isArray(data.results);
  const isRefund = data.eligible !== undefined && data.reason;

  const renderSummary = () => {
    if (isCustomer) {
      return (
        <div className="user-friendly-card">
          <KeyValueRow label="Name" value={data.name} />
          <KeyValueRow label="Email" value={data.email} />
          <KeyValueRow label="Tier" value={data.tier} />
          <KeyValueRow label="Notes" value={data.notes} />
        </div>
      );
    }

    if (isOrder) {
      return (
        <div className="user-friendly-card">
          <KeyValueRow label="Order ID" value={data.order_id} />
          <KeyValueRow label="Status" value={data.status} />
          <KeyValueRow label="Amount" value={data.total_amount || data.amount} />
          <KeyValueRow label="Date" value={data.order_date || data.created_at} />
          <KeyValueRow label="Refund Status" value={data.refund_status} />
        </div>
      );
    }

    if (isProduct) {
      return (
        <div className="user-friendly-card">
          <KeyValueRow label="Product" value={data.name} />
          <KeyValueRow label="Category" value={data.category} />
          <KeyValueRow label="Price" value={data.price} />
          <KeyValueRow label="Warranty" value={data.warranty_months ? `${data.warranty_months} Months` : 'None'} />
        </div>
      );
    }

    if (isRefund) {
      return (
        <div className="user-friendly-card">
          <KeyValueRow label="Eligible" value={data.eligible} />
          <KeyValueRow label="Reason" value={data.reason} />
        </div>
      );
    }

    if (isKB) {
      return (
        <div className="user-friendly-card">
          <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Found {data.results.length} relevant articles:</div>
          {data.results.map((r: any, i: number) => (
            <div key={i} style={{ padding: '0.5rem', background: '#f8fafc', borderRadius: '4px', marginBottom: '0.5rem', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{r.title}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.excerpt}</div>
            </div>
          ))}
        </div>
      );
    }

    // Default simple list for objects
    if (typeof data === 'object' && !Array.isArray(data)) {
      const keys = Object.keys(data).filter(k => typeof data[k] !== 'object' || data[k] === null);
      if (keys.length > 0 && keys.length < 8) {
        return (
          <div className="user-friendly-card">
            {keys.map(k => <KeyValueRow key={k} label={k} value={data[k]} />)}
          </div>
        );
      }
    }

    return null;
  };

  const summary = renderSummary();

  return (
    <div style={{ marginTop: '0.5rem' }}>
      {label && <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{label}</div>}
      
      {summary}

      <div style={{ marginTop: '0.25rem' }}>
        <button 
          onClick={() => setShowRaw(!showRaw)}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--primary)', 
            fontSize: '0.7rem', 
            cursor: 'pointer',
            padding: 0,
            textDecoration: 'underline'
          }}
        >
          {showRaw ? 'Hide Technical Data' : 'View Technical Data'}
        </button>
        
        {showRaw && (
          <pre className="json-viewer" style={{ marginTop: '0.5rem', maxHeight: '200px', overflow: 'auto' }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .user-friendly-card {
          background: #ffffff;
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 0.75rem;
          font-size: 0.875rem;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
      `}} />
    </div>
  );
};
