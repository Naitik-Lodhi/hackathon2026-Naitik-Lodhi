import React from 'react';
import type { AuditLog } from '../types';
import { JsonDisplay } from './JsonDisplay';

interface AuditStepProps {
  log: AuditLog;
}

export const AuditStep: React.FC<AuditStepProps> = ({ log }) => {
  const isLLM = log.tool_name === 'llm_analysis';
  const isSuccess = log.status === 'success';

  return (
    <div className={`audit-step ${isLLM ? 'analysis' : 'tool'} ${isSuccess ? 'success' : 'failure'}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ fontSize: '0.9rem', color: 'var(--text)' }}>
          {isLLM ? '🧠 AI Analysis' : `🛠️ Tool: ${log.tool_name}`}
        </h4>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          {new Date(log.timestamp).toLocaleTimeString()}
        </span>
      </div>

      {log.decision && (
        <p style={{ fontSize: '0.85rem', margin: '0.25rem 0', fontWeight: 500 }}>
          {log.decision}
        </p>
      )}

      {log.input && <JsonDisplay data={log.input} label="Input" />}
      {log.output && <JsonDisplay data={log.output} label="Result / Reasoning" />}
    </div>
  );
};
