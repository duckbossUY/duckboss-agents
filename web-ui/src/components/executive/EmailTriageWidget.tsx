import React from 'react';
import { Trash2, Send, AlertCircle } from 'lucide-react';
import type { InboxEmail } from '../../types';

interface EmailTriageWidgetProps {
  emails: InboxEmail[];
  onRunAgent: (agentId: string, prompt: string) => void;
}

export const EmailTriageWidget: React.FC<EmailTriageWidgetProps> = ({ emails, onRunAgent }) => {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white uppercase tracking-wider">
          Bandeja de Entrada Filtrada con IA
        </h3>
        <button
          onClick={() => onRunAgent('executive_assistant', 'Escanear correos, eliminar el spam publicitario y clasificar importantes')}
          className="btn btn-secondary btn-sm gap-2"
        >
          <Trash2 className="w-4 h-4 text-rose-400" />
          <span>Purgar Spam con Agente</span>
        </button>
      </div>

      <div className="space-y-2.5">
        {emails.map((mail) => (
          <div 
            key={mail.id}
            className="p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-slate-700 transition-all flex items-start justify-between gap-5"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <span className={`badge ${
                  mail.category === 'VIP' ? 'badge-aurora' :
                  mail.category === 'Spam' ? 'badge-failed' : 'badge-idle'
                }`}>
                  {mail.category}
                </span>
                <span className="text-sm font-semibold text-slate-300">{mail.sender}</span>
                <span className="text-xs text-[var(--text-muted)]">• {new Date(mail.date).toLocaleDateString()}</span>
              </div>
              <div className="text-sm font-bold text-white">{mail.subject}</div>
              <p className="text-sm text-[var(--text-secondary)] line-clamp-1 leading-relaxed">{mail.snippet}</p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {mail.category === 'Spam' ? (
                <span className="text-xs text-rose-400 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Marcado para borrado
                </span>
              ) : (
                <button
                  onClick={() => onRunAgent('executive_assistant', `Redactar respuesta de cortesía a ${mail.sender}`)}
                  className="btn btn-secondary btn-sm gap-2"
                >
                  <Send className="w-4 h-4 text-cyan-400" />
                  <span>Borrador</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
