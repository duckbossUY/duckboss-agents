export interface Agent {
  id: string;
  name: string;
  squad: 'executive' | 'tech' | 'business';
  role: string;
  description: string;
  model_provider: string;
  model_name: string;
  system_prompt: string;
  status: 'idle' | 'running' | 'blocked';
  tools: string[];
  avatar?: string;
  created_at: string;
}

export interface ExecutionStep {
  id?: number;
  execution_id?: string;
  step_number: number;
  step_type: 'thought' | 'tool_call' | 'tool_result' | 'human_request' | 'human_response' | 'final_answer' | 'error';
  title: string;
  content: string;
  metadata?: any;
  timestamp?: string;
}

export interface Intervention {
  id: string;
  execution_id: string;
  agent_id: string;
  title: string;
  reason: string;
  proposed_action: string;
  context_data: any;
  status: 'pending' | 'approved' | 'rejected' | 'modified';
  user_response?: string;
  created_at: string;
  resolved_at?: string;
  agent_name?: string;
  agent_avatar?: string;
  agent_role?: string;
}

export interface Execution {
  id: string;
  agent_id: string;
  prompt: string;
  status: 'pending' | 'running' | 'waiting_for_human' | 'completed' | 'failed' | 'cancelled';
  result?: string;
  created_at: string;
  finished_at?: string;
  agent_name?: string;
  agent_role?: string;
  agent_avatar?: string;
  steps?: ExecutionStep[];
  interventions?: Intervention[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  attendees: string[];
  location: string;
}

export interface InboxEmail {
  id: string;
  sender: string;
  subject: string;
  date: string;
  snippet: string;
  category: 'VIP' | 'Operacional' | 'Spam';
  is_read: boolean;
}

export interface DebtorClient {
  client_id: string;
  client_name: string;
  contact_email: string;
  invoice_id: string;
  amount_due: number;
  currency: string;
  due_date: string;
  days_overdue: number;
  status: 'overdue' | 'grace_period' | 'critical' | 'notice_delivered';
  notes?: string;
  last_notice_sent?: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  category: string;
  created_at: string;
}

export interface UserPreference {
  key: string;
  value: string;
  category: string;
  description?: string;
  updated_at: string;
}
