export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface Ticket {
  id: string;
  external_ticket_id?: string;
  customer_email?: string;
  subject?: string;
  content: string;
  expected_action?: string;
  source?: string;
  data_source?: string;
  llm_status?: string;
  fallback_used?: boolean;
  status: 'queued' | 'processing' | 'resolved' | 'escalated';
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  ticket_id: string;
  step: number;
  tool_name: string;
  input: string; // Stored as JSON
  output: string | null; // Stored as JSON
  status: 'success' | 'failure';
  attempt: number;
  decision?: string;
  timestamp: Date;
}
