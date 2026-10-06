import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  ShieldAlert, 
  Sparkles,
  X
} from 'lucide-react';
import type { Intervention } from '../../types';

interface InterventionModalProps {
  interventions: Intervention[];
  isOpen: boolean;
  onClose: () => void;
  onResolve: (interventionId: string, decision: 'approved' | 'rejected' | 'modified', userResponse: string, modifiedArgs?: any) => Promise<void>;
}

export const InterventionModal: React.FC<InterventionModalProps> = ({
  interventions,
  isOpen,
  onClose,
  onResolve
}) => {
  const [selectedInterventionId, setSelectedInterventionId] = useState<string | null>(
    interventions[0]?.id || null
  );
  const [editableBody, setEditableBody] = useState<string>('');
  const [feedbackNote, setFeedbackNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync selected intervention
  const activeIntervention = interventions.find(i => i.id === selectedInterventionId) || interventions[0];

  React.useEffect(() => {
    if (activeIntervention) {
      setSelectedInterventionId(activeIntervention.id);
      // Pre-populate editable text if tool args contain a body/preview
      const args = activeIntervention.context_data || {};
      const bodyText = args.reminder_body || args.body || args.description || '';
      setEditableBody(bodyText);
      setFeedbackNote('');
    }
  }, [activeIntervention?.id]);

  if (!isOpen || !activeIntervention) return null;

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      const args = { ...activeIntervention.context_data };
      if (args.reminder_body !== undefined) {
        args.reminder_body = editableBody;
      } else if (args.body !== undefined) {
        args.body = editableBody;
      }
      await onResolve(activeIntervention.id, 'approved', feedbackNote || 'Aprobado por el usuario', args);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!feedbackNote.trim()) {
      alert('Por favor agrega una breve nota explicando el motivo del rechazo para que el agente aprenda.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onResolve(activeIntervention.id, 'rejected', feedbackNote);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-[var(--bg-surface)] border border-amber-500/40 rounded-2xl shadow-2xl shadow-amber-500/10 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-subtle)] bg-gradient-to-r from-amber-500/10 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-base font-bold text-white">Centro de Intervención Humana</h3>
                <span className="badge badge-blocked">Agente en Pausa</span>
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                El agente autónomo requiere tu autorización o criterio para proceder.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-white/5 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* Context Banner */}
          <div className="p-5 rounded-xl bg-amber-500/5 border border-amber-500/20 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                Motivo del Bloqueo
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                Agente: <strong className="text-white">{activeIntervention.agent_name || activeIntervention.agent_id}</strong>
              </span>
            </div>
            <p className="text-sm text-slate-200 font-medium leading-relaxed">
              {activeIntervention.reason}
            </p>
          </div>

          {/* Action Details & Editable Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-3">
                <Edit3 className="w-4 h-4 text-cyan-400" />
                Propuesta de Acción & Contenido Editable
              </label>
              <span className="text-xs text-cyan-400 font-medium">
                Puedes ajustar el texto antes de autorizar el despacho
              </span>
            </div>

            {/* If there's an editable body */}
            {editableBody !== '' ? (
              <textarea
                value={editableBody}
                onChange={(e) => setEditableBody(e.target.value)}
                rows={6}
                className="w-full bg-[var(--bg-console)] border border-[var(--border-subtle)] focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 rounded-xl p-4 text-xs font-mono text-slate-200 outline-none leading-relaxed resize-y transition-all"
                placeholder="Escribe o ajusta el borrador aquí..."
              />
            ) : (
              <pre className="p-5 rounded-xl bg-[var(--bg-console)] border border-[var(--border-subtle)] text-sm font-mono text-slate-300 overflow-x-auto">
                {JSON.stringify(activeIntervention.context_data, null, 2)}
              </pre>
            )}
          </div>

          {/* Feedback & Teaching Note (Vectorized Learning) */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Instrucción de Aprendizaje para el Agente (Memoria RAG)
            </label>
            <input
              type="text"
              value={feedbackNote}
              onChange={(e) => setFeedbackNote(e.target.value)}
              placeholder="Ej: 'Dar 48 horas de plazo adicional y no usar tono agresivo' (El agente recordará esto en el futuro)"
              className="input-field"
            />
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] flex items-center justify-between">
          <button
            onClick={handleReject}
            disabled={isSubmitting}
            className="btn btn-danger btn-sm gap-2"
          >
            <XCircle className="w-4 h-4" />
            <span>Rechazar y Retroalimentar</span>
          </button>

          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="btn btn-secondary btn-sm"
            >
              Cerrar por ahora
            </button>
            <button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="btn btn-primary gap-3 px-5 py-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Aprobar y Ejecutar Acción</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
