import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { DebtorClient } from '../../types';

interface DebtorsCollectionWidgetProps {
  debtors: DebtorClient[];
  onRunAgent: (agentId: string, prompt: string) => void;
}

export const DebtorsCollectionWidget: React.FC<DebtorsCollectionWidgetProps> = ({ debtors, onRunAgent }) => {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white uppercase tracking-wider">
          Cartera de Cuentas por Cobrar
        </h3>
        <button
          onClick={() => onRunAgent('executive_assistant', 'Notificar al cliente TechCorp con mora de 18 días')}
          className="btn btn-secondary btn-sm gap-2"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Generar Intimación TechCorp</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-semibold uppercase tracking-wider">
              <th className="py-3 px-4">Cliente</th>
              <th className="py-3 px-4">Factura</th>
              <th className="py-3 px-4">Monto</th>
              <th className="py-3 px-4">Días Mora</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {debtors.map((d) => (
              <tr key={d.client_id} className="hover:bg-white/[0.02] transition-colors">
                <td className="py-3.5 px-4 font-semibold text-white">
                  {d.client_name}
                  <div className="text-xs text-[var(--text-muted)] font-normal">{d.contact_email}</div>
                </td>
                <td className="py-3.5 px-4 font-mono text-cyan-400">{d.invoice_id}</td>
                <td className="py-3.5 px-4 font-bold text-slate-200">${d.amount_due.toLocaleString()} USD</td>
                <td className="py-3.5 px-4">
                  <span className={`px-2.5 py-1 rounded font-bold ${
                    d.days_overdue > 15 ? 'bg-rose-500/20 text-rose-300' :
                    d.days_overdue > 5 ? 'bg-amber-500/20 text-amber-300' :
                    'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {d.days_overdue} días
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  {d.status === 'critical' ? (
                    <span className="badge badge-failed">Crítico</span>
                  ) : d.status === 'notice_delivered' ? (
                    <span className="badge badge-completed">Notificado</span>
                  ) : (
                    <span className="badge badge-cancelled">Período de Gracia</span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button
                    onClick={() => onRunAgent('executive_assistant', `Enviar recordatorio de cobro a ${d.client_name} por factura ${d.invoice_id}`)}
                    className="btn btn-secondary btn-sm gap-2 hover:border-amber-500/50"
                  >
                    <span>Cobrar</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
