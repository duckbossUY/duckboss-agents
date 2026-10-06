import type {
  Agent,
  Execution,
  Intervention,
  CalendarEvent,
  InboxEmail,
  DebtorClient,
  DocumentItem,
  UserPreference
} from '../types';

const API_BASE = '/api';

export const api = {
  // Agents
  async getAgents(): Promise<Agent[]> {
    const res = await fetch(`${API_BASE}/agents`);
    if (!res.ok) throw new Error('Error al cargar agentes');
    return res.json();
  },

  async runAgent(agentId: string, prompt: string): Promise<{ execution_id: string }> {
    const res = await fetch(`${API_BASE}/agents/${agentId}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    if (!res.ok) throw new Error('Error al iniciar agente');
    return res.json();
  },

  // Executions
  async getExecutions(): Promise<Execution[]> {
    const res = await fetch(`${API_BASE}/executions`);
    if (!res.ok) throw new Error('Error al cargar ejecuciones');
    return res.json();
  },

  async getExecution(executionId: string): Promise<Execution> {
    const res = await fetch(`${API_BASE}/executions/${executionId}`);
    if (!res.ok) throw new Error('Error al cargar detalles de ejecución');
    return res.json();
  },

  // SSE Stream
  subscribeExecutionStream(
    executionId: string,
    onEvent: (event: any) => void,
    onError?: (err: any) => void
  ): () => void {
    const eventSource = new EventSource(`${API_BASE}/executions/${executionId}/events`);

    eventSource.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data);
        onEvent(parsed);
      } catch (err) {
        console.error('Error parsing SSE data', err);
      }
    };

    // Specific event listeners
    const eventTypes = ['step', 'status_change', 'human_intervention_required', 'finished', 'ping'];
    eventTypes.forEach(type => {
      eventSource.addEventListener(type, (e: any) => {
        try {
          const parsed = JSON.parse(e.data);
          onEvent(parsed);
        } catch (err) {
          console.error(`Error parsing SSE event ${type}`, err);
        }
      });
    });

    eventSource.onerror = (err) => {
      if (onError) onError(err);
    };

    return () => {
      eventSource.close();
    };
  },

  // Interventions (Human-in-the-Loop)
  async getPendingInterventions(): Promise<Intervention[]> {
    const res = await fetch(`${API_BASE}/interventions`);
    if (!res.ok) throw new Error('Error al cargar intervenciones pendientes');
    return res.json();
  },

  async resolveIntervention(
    interventionId: string,
    decision: 'approved' | 'rejected' | 'modified',
    userResponse: string = '',
    modifiedArgs?: any
  ): Promise<any> {
    const res = await fetch(`${API_BASE}/interventions/${interventionId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision,
        user_response: userResponse,
        modified_args: modifiedArgs
      })
    });
    if (!res.ok) throw new Error('Error al resolver intervención');
    return res.json();
  },

  // Executive Tools
  async getCalendar(): Promise<{ events: CalendarEvent[] }> {
    const res = await fetch(`${API_BASE}/executive/calendar`);
    if (!res.ok) throw new Error('Error al cargar calendario');
    return res.json();
  },

  async getEmails(): Promise<{ emails: InboxEmail[] }> {
    const res = await fetch(`${API_BASE}/executive/emails`);
    if (!res.ok) throw new Error('Error al cargar correos');
    return res.json();
  },

  async getDebtors(): Promise<{ debtors: DebtorClient[]; total_overdue: number; critical_count: number }> {
    const res = await fetch(`${API_BASE}/executive/debtors`);
    if (!res.ok) throw new Error('Error al cargar cartera de deudores');
    return res.json();
  },

  // Knowledge & Memory
  async getDocuments(): Promise<DocumentItem[]> {
    const res = await fetch(`${API_BASE}/knowledge/documents`);
    if (!res.ok) throw new Error('Error al cargar documentos');
    return res.json();
  },

  async createDocument(title: string, content: string, category: string = 'general'): Promise<any> {
    const res = await fetch(`${API_BASE}/knowledge/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, category })
    });
    if (!res.ok) throw new Error('Error al vectorizar documento');
    return res.json();
  },

  async getPreferences(): Promise<UserPreference[]> {
    const res = await fetch(`${API_BASE}/knowledge/preferences`);
    if (!res.ok) throw new Error('Error al cargar preferencias de usuario');
    return res.json();
  },

  async savePreference(key: string, value: string, category: string, description?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/knowledge/preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value, category, description })
    });
    if (!res.ok) throw new Error('Error al guardar preferencia');
    return res.json();
  }
};
