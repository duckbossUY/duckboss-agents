import React from 'react';
import { 
  Bot, 
  Briefcase, 
  Activity, 
  Database, 
  AlertTriangle
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'executive' | 'stream' | 'knowledge';
  setActiveTab: (tab: 'dashboard' | 'executive' | 'stream' | 'knowledge') => void;
  pendingInterventionsCount: number;
  onOpenInterventions: () => void;
  isBackendHealthy: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  pendingInterventionsCount,
  onOpenInterventions,
  isBackendHealthy
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-app)]/80 backdrop-blur-xl">
      <div className="px-6 lg:px-8 h-[72px] flex items-center justify-between gap-6">
        
        {/* Brand */}
        <div className="flex items-center gap-4 cursor-pointer shrink-0" onClick={() => setActiveTab('dashboard')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/10">
            <span className="text-2xl select-none">🦆</span>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-lg tracking-tight text-white font-display">DuckBoss</span>
              <span className="badge badge-aurora py-1">v2.0 MCP</span>
            </div>
            <p className="hidden 2xl:block text-sm text-[var(--text-muted)] font-medium whitespace-nowrap">Orquestador de Agentes & Human-in-the-Loop</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 p-1.5 whitespace-nowrap bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <Bot className="w-4 h-4 text-cyan-400" />
            <span>Escuadrones</span>
          </button>

          <button
            onClick={() => setActiveTab('executive')}
            className={`tab-btn ${activeTab === 'executive' ? 'active' : ''}`}
          >
            <Briefcase className="w-4 h-4 text-amber-400" />
            <span>Suite Ejecutiva</span>
            <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">MVP</span>
          </button>

          <button
            onClick={() => setActiveTab('stream')}
            className={`tab-btn ${activeTab === 'stream' ? 'active' : ''}`}
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Consola Live</span>
          </button>

          <button
            onClick={() => setActiveTab('knowledge')}
            className={`tab-btn ${activeTab === 'knowledge' ? 'active' : ''}`}
          >
            <Database className="w-4 h-4 text-purple-400" />
            <span>Bóveda RAG</span>
          </button>
        </nav>

        {/* Right Status & Intervention Trigger */}
        <div className="flex items-center gap-4 shrink-0 whitespace-nowrap">
          {/* Pending Interventions Alert Button */}
          {pendingInterventionsCount > 0 ? (
            <button
              onClick={onOpenInterventions}
              className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-300 font-semibold text-xs animate-pulse shadow-lg shadow-amber-500/20 hover:bg-amber-500/30 transition-all cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>{pendingInterventionsCount} Bloqueo{pendingInterventionsCount > 1 ? 's' : ''} Humano</span>
            </button>
          ) : (
            <div className="hidden xl:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Agentes Autónomos OK</span>
            </div>
          )}

          {/* Backend Status indicator */}
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] border-l border-[var(--border-subtle)] pl-4">
            <span className={`w-2 h-2 rounded-full ${isBackendHealthy ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-rose-500'}`} />
            <span className="hidden sm:inline">{isBackendHealthy ? 'Orquestador Online' : 'Desconectado'}</span>
          </div>
        </div>

      </div>
    </header>
  );
};
