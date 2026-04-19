export interface Ticket {
  id: string;
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
