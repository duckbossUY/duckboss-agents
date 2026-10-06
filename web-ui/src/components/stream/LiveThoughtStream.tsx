import React, { useEffect, useRef } from 'react';
import { 
  BrainCircuit, 
  Wrench, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Terminal, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import type { Execution } from '../../types';

interface LiveThoughtStreamProps {
  execution: Execution | null;
  onOpenIntervention: () => void;
  isStreaming: boolean;
}

export const LiveThoughtStream: React.FC<LiveThoughtStreamProps> = ({
  execution,
  onOpenIntervention,
  isStreaming
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [execution?.steps?.length, execution?.status]);

  if (!execution) {
    return (
      <div className="glass-panel p-12 text-center space-y-5 animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
          <Terminal className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white font-display">Consola de Observabilidad en Vivo</h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-md mx-auto leading-relaxed">
            Selecciona un agente y ejecuta una tarea para ver en tiempo real la cadena de razonamiento, llamadas a herramientas MCP y solicitudes de intervención.
          </p>
        </div>
      </div>
    );
  }

  const steps = execution.steps || [];

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Stream Header */}
      <div className="glass-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 border-l-4 border-l-cyan-400">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <span className={`badge ${
              execution.status === 'running' ? 'badge-running' :
              execution.status === 'waiting_for_human' ? 'badge-blocked' :
              execution.status === 'completed' ? 'badge-completed' :
              execution.status === 'failed' ? 'badge-failed' : 'badge-idle'
            }`}>
              {execution.status === 'waiting_for_human' ? 'Esperando Autorización Humana' : execution.status.toUpperCase()}
            </span>
            <span className="text-xs font-mono text-[var(--text-muted)]">ID: {execution.id}</span>
            {isStreaming && (
              <span className="flex items-center gap-2 text-xs text-cyan-400 font-semibold animate-pulse">
                <span className="pulse-dot running" /> Live SSE
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-white font-display">
            Agente: {execution.agent_name || execution.agent_id}
          </h2>
          <p className="text-sm text-slate-300 bg-white/5 p-2 rounded-lg border border-white/5 font-mono leading-relaxed">
            &gt; {execution.prompt}
          </p>
        </div>

        {/* If waiting for human -> Direct Action CTA Button */}
        {execution.status === 'waiting_for_human' && (
          <button
            onClick={onOpenIntervention}
            className="btn btn-primary gap-3 py-2.5 px-4 shadow-lg shadow-amber-500/30 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 border border-amber-400 animate-pulse text-black font-extrabold"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Resolver Bloqueo Ahora</span>
          </button>
        )}
      </div>

      {/* Steps Timeline */}
      <div className="relative pl-6 space-y-8">
        {/* The Timeline Line */}
        <div className="absolute left-2.5 top-2 bottom-6 w-0.5 bg-slate-700/50"></div>

        {steps.map((step, idx) => {
          let nodeColor = 'bg-slate-600 text-slate-300';
          let borderColor = 'border-slate-500/30';
          let Icon = Terminal;

          if (step.step_type === 'thought') {
            nodeColor = 'bg-purple-500/20 text-purple-400';
            borderColor = 'border-purple-500/50';
            Icon = BrainCircuit;
          } else if (step.step_type === 'tool_call') {
            nodeColor = 'bg-cyan-500/20 text-cyan-400';
            borderColor = 'border-cyan-500/50';
            Icon = Wrench;
          } else if (step.step_type === 'tool_result') {
            nodeColor = 'bg-emerald-500/20 text-emerald-400';
            borderColor = 'border-emerald-500/50';
            Icon = CheckCircle2;
          } else if (step.step_type === 'human_request') {
            nodeColor = 'bg-amber-500/20 text-amber-400';
            borderColor = 'border-amber-500/50';
            Icon = AlertTriangle;
          } else if (step.step_type === 'human_response') {
            nodeColor = 'bg-sky-500/20 text-sky-400';
            borderColor = 'border-sky-500/50';
            Icon = CheckCircle2;
          } else if (step.step_type === 'final_answer') {
            nodeColor = 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]';
            borderColor = 'border-emerald-400';
            Icon = CheckCircle2;
          }

          return (
            <div key={idx} className={`relative animate-fadeIn`}>
              {/* Timeline Node */}
              <div className={`absolute -left-6 top-1.5 w-6 h-6 rounded-full border ${borderColor} ${nodeColor} flex items-center justify-center z-10 bg-[var(--bg-app)]`}>
                <Icon className="w-4 h-4" />
              </div>

              {/* Step Card Content */}
              <div className={`step-card ${step.step_type} ml-4`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Paso {step.step_number}: {step.title}
                    </span>
                  </div>

                  {step.timestamp && (
                    <span className="text-xs text-[var(--text-muted)] flex items-center gap-2 font-mono">
                      <Clock className="w-4 h-4" />
                      {new Date(step.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                </div>

                {/* Step Body */}
                {step.step_type === 'tool_call' || step.step_type === 'tool_result' ? (
                  <div className="relative mt-2">
                    <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-b from-[var(--bg-console)] to-transparent pointer-events-none rounded-t-lg z-10"></div>
                    <pre className="p-5 rounded-lg bg-[var(--bg-console)] border border-slate-700/50 shadow-inner text-sm font-mono text-cyan-400 overflow-x-auto leading-relaxed">
                      {step.content}
                    </pre>
                  </div>
                ) : step.step_type === 'human_request' ? (
                  <div className="space-y-4 p-5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <p className="text-sm font-semibold text-amber-300 leading-relaxed">{step.content}</p>
                    <button
                      onClick={onOpenIntervention}
                      className="btn btn-primary btn-sm gap-2 shadow-lg shadow-amber-500/20 bg-amber-500 text-black hover:bg-amber-400 border-none"
                    >
                      <span>Revisar y Decidir</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                    {step.content}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

    </div>
  );
};
