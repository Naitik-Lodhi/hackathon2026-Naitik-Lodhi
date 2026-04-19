import React, { useState } from 'react';
import { ticketApi } from '../api/ticketApi';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    customers: null,
    orders: null,
    products: null,
    knowledge_base: null,
    tickets: null,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [replace, setReplace] = useState(true);

  if (!isOpen) return null;

  const handleFileChange = (key: string, file: File | null) => {
    setFiles(prev => ({ ...prev, [key]: file }));
  };

  const handleSubmit = async () => {
    setIsUploading(true);
    try {
      const dataset: any = { replace };
      
      for (const [key, file] of Object.entries(files)) {
        if (file) {
          const text = await file.text();
          dataset[key] = JSON.parse(text);
        }
      }

      const res = await ticketApi.importData('ui-upload', dataset);
      if (res.success) {
        onSuccess(res.message || 'Data uploaded successfully');
        onClose();
      } else {
        alert(res.error?.message || 'Upload failed');
      }
    } catch (err: any) {
      alert(`Error parsing JSON: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content card" style={{ maxWidth: '500px', width: '90%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Upload JSON Data</h2>
          <button className="btn-icon" onClick={onClose} disabled={isUploading}>✕</button>
        </div>

        <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
          {['customers', 'orders', 'products', 'knowledge_base', 'tickets'].map(key => (
            <div key={key}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem', textTransform: 'capitalize' }}>
                {key.replace('_', ' ')} JSON {key === 'tickets' ? '(optional)' : ''}
              </label>
              <input 
                type="file" 
                accept=".json" 
                onChange={(e) => handleFileChange(key, e.target.files?.[0] || null)}
                style={{ fontSize: '0.875rem' }}
                disabled={isUploading}
              />
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
            <input 
              type="checkbox" 
              checked={replace} 
              onChange={(e) => setReplace(e.target.checked)} 
              disabled={isUploading}
            />
            Replace existing data (Truncate tables)
          </label>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button className="btn-outline" onClick={onClose} disabled={isUploading}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={isUploading}>
            {isUploading ? 'Uploading...' : 'Upload & Update DB'}
          </button>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: var(--shadow-lg);
        }
      `}} />
    </div>
  );
};
