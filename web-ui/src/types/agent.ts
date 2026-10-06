export type InputType = 'string' | 'number' | 'boolean' | 'select' | 'textarea';

export interface AgentInput {
  name: string;
  label: string;
  type: InputType;
  description?: string;
  required?: boolean;
  default?: any;
  options?: string[];
}

export interface AgentRuntime {
  type: string;
  entrypoint: string;
  python_version?: string;
}

export interface AgentOutputDef {
  type: 'json' | 'text' | 'markdown';
  description?: string;
}

export interface AgentManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  category?: string;
  runtime: AgentRuntime;
  inputs: AgentInput[];
  triggers: string[];
  output?: AgentOutputDef;
}

export type ExecutionStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface LogEntry {
  timestamp: string;
  stream: 'stdout' | 'stderr' | 'system';
  level: string;
  message: string;
  step?: number;
  total_steps?: number;
  progress?: number;
  extra?: Record<string, any>;
  raw?: string;
}

export interface ExecutionSummary {
  execution_id: string;
  agent_id: string;
  status: ExecutionStatus;
  started_at: string;
  finished_at?: string;
  duration_seconds?: number;
  exit_code?: number;
  error?: string;
  output?: any;
}

export interface AgentInfo {
  id: string;
  path: string;
  manifest: AgentManifest;
  status: 'idle' | 'running';
  last_execution?: ExecutionSummary;
}
