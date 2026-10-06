import React, { useState } from 'react';
import { 
  Bot, 
  Briefcase, 
  ShieldCheck, 
  Layout, 
  TrendingUp, 
  Sparkles, 
  Play, 
  Cpu, 
  ArrowRight,
  Send,
  X
} from 'lucide-react';
import type { Agent } from '../../types';

interface DashboardViewProps {
  agents: Agent[];
  onRunAgent: (agentId: string, prompt: string) => void;
  onOpenExecutiveSuite: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  agents,
  onRunAgent,
  onOpenExecutiveSuite
}) => {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [promptText, setPromptText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getSquadAgents = (squad: string) => agents.filter(a => a.squad === squad);

  const handleOpenRun = (agent: Agent) => {
    setSelectedAgent(agent);
    if (agent.id === 'executive_assistant') {
      setPromptText('Revisar clientes en mora y preparar avisos de cobranza');
    } else if (agent.id === 'cybersecurity_auditor') {
      setPromptText('Realizar un escaneo de seguridad en repositorios de código y dependencias');
    } else if (agent.id === 'ux_architect') {
      setPromptText('Auditar la usabilidad y diseño del frontend actual de DuckBoss');
    } else if (agent.id === 'financial_advisor') {
      setPromptText('Analizar la estructura de costos y calcular el runway operativo');
    } else {
      setPromptText('Crear estrategia de captación de leads para el nuevo producto');
    }
    setIsModalOpen(true);
  };

  const handleExecute = () => {
    if (!selectedAgent || !promptText.trim()) return;
    onRunAgent(selectedAgent.id, promptText);
    setIsModalOpen(false);
  };

  const renderAgentIcon = (avatar?: string) => {
    switch (avatar) {
      case 'briefcase': return <Briefcase className="w-5 h-5 text-amber-400" />;
      case 'shield-check': return <ShieldCheck className="w-5 h-5 text-cyan-400" />;
      case 'layout': return <Layout className="w-5 h-5 text-indigo-400" />;
      case 'trending-up': return <TrendingUp className="w-5 h-5 text-emerald-400" />;
      case 'sparkles': return <Sparkles className="w-5 h-5 text-purple-400" />;
      default: return <Bot className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-12 animate-fadeIn">
      
      {/* Hero Welcome */}
      <div className="p-8 rounded-2xl glass-panel relative overflow-hidden bg-gradient-to-r from-indigo-900/40 via-slate-900/60 to-cyan-900/40 border border-indigo-500/20">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-3 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
            <Cpu className="w-4 h-4" />
            <span>DuckBoss Multi-Agent Ecosystem • MCP Protocol Ready</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white font-display tracking-tight">
            Centro de Control & Escuadrones de Agentes
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Ejecuta agentes autónomos y asesores estratégicos con soporte para streaming de pensamientos, resolución de problemas Human-in-the-Loop y memoria adaptativa.
          </p>
        </div>
      </div>

      {/* SQUAD 1: ASISTENTE EJECUTIVO (MVP) */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white font-display">Escuadrón Asistente Ejecutivo</h2>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">Gestión de agenda, triaje de correo y cobro de deudas</p>
            </div>
          </div>

          <button
            onClick={onOpenExecutiveSuite}
            className="btn btn-secondary btn-sm gap-2 hover:border-amber-400/50"
          >
            <span>Abrir Suite Ejecutiva</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getSquadAgents('executive').map((agent) => (
            <div key={agent.id} className="glow-card p-6 flex flex-col justify-between border-amber-500/30">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                    {renderAgentIcon(agent.avatar)}
                  </div>
                  <span className={`badge ${
                    agent.status === 'running' ? 'badge-running' :
                    agent.status === 'blocked' ? 'badge-blocked' : 'badge-idle'
                  }`}>
                    {agent.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">{agent.name}</h3>
                  <div className="text-sm text-amber-400 font-semibold">{agent.role}</div>
                </div>

                <p className="text-sm text-[var(--text-secondary)] line-clamp-3 leading-relaxed">
                  {agent.description}
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  {agent.tools.slice(0, 3).map((t) => (
                    <span key={t} className="text-xs px-2.5 py-1 rounded bg-white/5 border border-white/10 text-slate-300 font-mono">
                      {t}
                    </span>
                  ))}
                  {agent.tools.length > 3 && (
                    <span className="text-xs px-2 py-1 rounded bg-white/5 text-[var(--text-muted)] font-mono">
                      +{agent.tools.length - 3}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">
                  {agent.model_provider} • {agent.model_name}
                </span>
                <button
                  onClick={() => handleOpenRun(agent)}
                  className="btn btn-primary btn-sm gap-2"
                >
                  <Play className="w-4 h-4" />
                  <span>Ejecutar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SQUAD 2: TECH & PRODUCT */}
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white font-display">Escuadrón Tech, Seguridad & UX</h2>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">Auditoría de ciberseguridad, arquitectura de software y heurísticas de diseño</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getSquadAgents('tech').map((agent) => (
            <div key={agent.id} className="glow-card p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                    {renderAgentIcon(agent.avatar)}
                  </div>
                  <span className={`badge ${
                    agent.status === 'running' ? 'badge-running' :
                    agent.status === 'blocked' ? 'badge-blocked' : 'badge-idle'
                  }`}>
                    {agent.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">{agent.name}</h3>
                  <div className="text-sm text-cyan-400 font-semibold">{agent.role}</div>
                </div>

                <p className="text-sm text-[var(--text-secondary)] line-clamp-3 leading-relaxed">
                  {agent.description}
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  {agent.tools.map((t) => (
                    <span key={t} className="text-xs px-2.5 py-1 rounded bg-white/5 border border-white/10 text-slate-300 font-mono">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">
                  {agent.model_provider} • {agent.model_name}
                </span>
                <button
                  onClick={() => handleOpenRun(agent)}
                  className="btn btn-secondary btn-sm gap-2 hover:border-cyan-400"
                >
                  <Play className="w-4 h-4 text-cyan-400" />
                  <span>Consultar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SQUAD 3: BUSINESS & GROWTH */}
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white font-display">Escuadrón Business, Finanzas & Growth</h2>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">Modelado financiero, márgenes, copywriting y marketing digital</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getSquadAgents('business').map((agent) => (
            <div key={agent.id} className="glow-card p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                    {renderAgentIcon(agent.avatar)}
                  </div>
                  <span className={`badge ${
                    agent.status === 'running' ? 'badge-running' :
                    agent.status === 'blocked' ? 'badge-blocked' : 'badge-idle'
                  }`}>
                    {agent.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">{agent.name}</h3>
                  <div className="text-sm text-emerald-400 font-semibold">{agent.role}</div>
                </div>

                <p className="text-sm text-[var(--text-secondary)] line-clamp-3 leading-relaxed">
                  {agent.description}
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  {agent.tools.map((t) => (
                    <span key={t} className="text-xs px-2.5 py-1 rounded bg-white/5 border border-white/10 text-slate-300 font-mono">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">
                  {agent.model_provider} • {agent.model_name}
                </span>
                <button
                  onClick={() => handleOpenRun(agent)}
                  className="btn btn-secondary btn-sm gap-2 hover:border-emerald-400"
                >
                  <Play className="w-4 h-4 text-emerald-400" />
                  <span>Consultar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Prompt Execution Modal */}
      {isModalOpen && selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-xl bg-[var(--bg-surface)] border border-cyan-500/40 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                  {renderAgentIcon(selectedAgent.avatar)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">Asignar Tarea a {selectedAgent.name}</h3>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">{selectedAgent.role}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-300">Instrucción / Prompt para el Agente</label>
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                rows={4}
                className="input-field resize-y font-mono"
                placeholder="Indica qué quieres que haga el agente..."
              />
            </div>

            <div className="flex items-center justify-end gap-4 pt-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="btn btn-secondary btn-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleExecute}
                className="btn btn-primary gap-3 px-4 py-2"
              >
                <Send className="w-4 h-4" />
                <span>Lanzar Ejecución</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
