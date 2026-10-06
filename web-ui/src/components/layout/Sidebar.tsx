import React from 'react';
import { Home, Briefcase, AlertCircle, Database } from 'lucide-react';

interface SidebarProps {
  currentView: 'dashboard' | 'executive' | 'knowledge';
  onNavigate: (view: 'dashboard' | 'executive' | 'knowledge') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  return (
    <aside className="w-72 shrink-0 border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] hidden md:flex flex-col">
      <div className="p-6 h-[72px] border-b border-[var(--border-subtle)] flex items-center">
        <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 font-display">
          🦆 DuckBoss v2
        </h1>
      </div>
      <nav className="flex-1 p-5 space-y-2">
        <button
          onClick={() => onNavigate('dashboard')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left whitespace-nowrap text-sm font-semibold transition-colors ${
            currentView === 'dashboard' 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Home className="w-5 h-5 shrink-0" />
          Dashboard General
        </button>
        <button
          onClick={() => onNavigate('executive')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left whitespace-nowrap text-sm font-semibold transition-colors ${
            currentView === 'executive' 
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' 
              : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Briefcase className="w-5 h-5 shrink-0" />
          Asistente Ejecutivo
        </button>
        <button
          onClick={() => onNavigate('knowledge')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left whitespace-nowrap text-sm font-semibold transition-colors ${
            currentView === 'knowledge' 
              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
              : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Database className="w-5 h-5 shrink-0" />
          Bóveda de Conocimiento
        </button>
        <div className="mt-8">
          <div className="px-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
            Intervenciones (HITL)
          </div>
          <button
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-semibold text-[var(--text-secondary)] hover:text-white hover:bg-white/5 transition-colors border border-transparent"
          >
            <div className="flex items-center gap-4">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Consola HITL
            </div>
            <span className="bg-amber-500 text-black text-xs px-2.5 py-1 rounded-full font-bold">
              0
            </span>
          </button>
        </div>
      </nav>
    </aside>
  );
};
