export interface Ticket {
  id: string;
  external_ticket_id?: string;
  customer_email?: string;
  subject?: string;
  data_source?: string;
  llm_status?: string;
  fallback_used?: boolean;
  content: string;
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
  input: any;
  output: any;
  status: 'success' | 'failure';
  timestamp: string;
  attempt?: number;
  decision?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}
