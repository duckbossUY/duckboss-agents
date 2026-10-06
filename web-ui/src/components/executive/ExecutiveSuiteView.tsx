import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar as CalendarIcon, Mail, DollarSign, Play } from 'lucide-react';
import { CalendarWidget } from './CalendarWidget';
import { EmailTriageWidget } from './EmailTriageWidget';
import { DebtorsCollectionWidget } from './DebtorsCollectionWidget';
import { api } from '../../services/api';

interface ExecutiveSuiteViewProps {
  onRunAgent: (agentId: string, prompt: string) => void;
  activeExecutionId: string | null;
}

export const ExecutiveSuiteView: React.FC<ExecutiveSuiteViewProps> = ({
  onRunAgent,
}) => {
  const [subTab, setSubTab] = useState<'debtors' | 'inbox' | 'calendar'>('debtors');

  const { data: calRes } = useQuery({
    queryKey: ['calendar'],
    queryFn: () => api.getCalendar(),
    initialData: { events: [] }
  });

  const { data: mailRes } = useQuery({
    queryKey: ['emails'],
    queryFn: () => api.getEmails(),
    initialData: { emails: [] }
  });

  const { data: debtRes } = useQuery({
    queryKey: ['debtors'],
    queryFn: () => api.getDebtors(),
    initialData: { debtors: [], total_overdue: 0, critical_count: 0 }
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* View Header with Hero Banner */}
      <div className="p-6 rounded-2xl glass-panel relative overflow-hidden bg-gradient-to-r from-amber-500/10 via-slate-900/60 to-cyan-500/10 border border-amber-500/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <span className="badge badge-aurora">Asistente Ejecutivo</span>
              <span className="text-xs text-[var(--text-muted)]">• Conectores MCP Activos</span>
            </div>
            <h2 className="text-2xl font-black text-white font-display">
              Suite de Productividad y Finanzas Personales
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-2xl leading-relaxed">
              Supervisa la agenda de Google Calendar, triaje inteligente de correos Gmail y cobranza automatizada a clientes deudores con autorización humana previa.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onRunAgent('executive_assistant', 'Revisar clientes deudores con más de 5 días de mora y preparar aviso de cobro')}
              className="btn btn-primary gap-2 py-2.5 px-4 shadow-lg shadow-emerald-500/20"
            >
              <Play className="w-4 h-4" />
              <span>Ejecutar Cobranza Asistida</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Debtors KPI */}
        <div 
          onClick={() => setSubTab('debtors')}
          className={`kpi-card cursor-pointer ${subTab === 'debtors' ? 'border-amber-500/60 bg-amber-500/10' : ''}`}
        >
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-sm text-[var(--text-muted)] font-medium">Cuentas por Cobrar Vencidas</span>
            <div className="text-xl font-bold text-white mt-0.5">${debtRes.total_overdue?.toLocaleString() || 0} USD</div>
            <span className="text-sm text-amber-400 font-semibold">{debtRes.critical_count || 0} clientes en estado crítico</span>
          </div>
        </div>

        {/* Email KPI */}
        <div 
          onClick={() => setSubTab('inbox')}
          className={`kpi-card cursor-pointer ${subTab === 'inbox' ? 'border-cyan-500/60 bg-cyan-500/10' : ''}`}
        >
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <span className="text-sm text-[var(--text-muted)] font-medium">Triaje de Gmail</span>
            <div className="text-xl font-bold text-white mt-0.5">{mailRes.emails?.length || 0} Correos Analizados</div>
            <span className="text-sm text-cyan-400 font-semibold">1 VIP Prioritario / 1 Spam Detectado</span>
          </div>
        </div>

        {/* Calendar KPI */}
        <div 
          onClick={() => setSubTab('calendar')}
          className={`kpi-card cursor-pointer ${subTab === 'calendar' ? 'border-indigo-500/60 bg-indigo-500/10' : ''}`}
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-sm text-[var(--text-muted)] font-medium">Google Calendar</span>
            <div className="text-xl font-bold text-white mt-0.5">{calRes.events?.length || 0} Reuniones Próximas</div>
            <span className="text-sm text-indigo-400 font-semibold">0 conflictos de agenda</span>
          </div>
        </div>
      </div>

      {/* Main Tab Panel */}
      <div className="glass-panel p-6">
        
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSubTab('debtors')}
              className={`tab-btn ${subTab === 'debtors' ? 'active' : ''}`}
            >
              <DollarSign className="w-4 h-4 text-amber-400" />
              <span>Clientes Deudores & Cobranzas</span>
            </button>
            <button
              onClick={() => setSubTab('inbox')}
              className={`tab-btn ${subTab === 'inbox' ? 'active' : ''}`}
            >
              <Mail className="w-4 h-4 text-cyan-400" />
              <span>Bandeja & Filtro Anti-Spam</span>
            </button>
            <button
              onClick={() => setSubTab('calendar')}
              className={`tab-btn ${subTab === 'calendar' ? 'active' : ''}`}
            >
              <CalendarIcon className="w-4 h-4 text-indigo-400" />
              <span>Agenda de Reuniones</span>
            </button>
          </div>

          <div className="text-xs text-[var(--text-muted)]">
            MCP Protocol: <span className="text-emerald-400 font-mono">stdio-transport: ok</span>
          </div>
        </div>

        {/* TAB 1: DEBTORS */}
        {subTab === 'debtors' && (
          <DebtorsCollectionWidget debtors={debtRes.debtors} onRunAgent={onRunAgent} />
        )}

        {/* TAB 2: INBOX */}
        {subTab === 'inbox' && (
          <EmailTriageWidget emails={mailRes.emails} onRunAgent={onRunAgent} />
        )}

        {/* TAB 3: CALENDAR */}
        {subTab === 'calendar' && (
          <CalendarWidget events={calRes.events} onRunAgent={onRunAgent} />
        )}

      </div>
    </div>
  );
};
