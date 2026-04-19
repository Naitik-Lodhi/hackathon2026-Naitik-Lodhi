import React from 'react';

interface JsonDisplayProps {
  data: any;
  label?: string;
}

export const JsonDisplay: React.FC<JsonDisplayProps> = ({ data, label }) => {
  const formatted = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

  return (
    <div style={{ marginTop: '0.5rem' }}>
      {label && <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{label}</div>}
      <pre className="json-viewer">
        {formatted}
      </pre>
    </div>
  );
};
