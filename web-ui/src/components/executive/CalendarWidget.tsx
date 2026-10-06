import React from 'react';
import { Clock, Users, Sparkles } from 'lucide-react';
import type { CalendarEvent } from '../../types';

interface CalendarWidgetProps {
  events: CalendarEvent[];
  onRunAgent: (agentId: string, prompt: string) => void;
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({ events, onRunAgent }) => {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white uppercase tracking-wider">
          Eventos Próximos de Google Calendar
        </h3>
        <button
          onClick={() => onRunAgent('executive_assistant', 'Verificar mi disponibilidad para la semana y optimizar bloques de foco')}
          className="btn btn-secondary btn-sm gap-2"
        >
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Optimizar Agenda</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {events.map((evt) => (
          <div 
            key={evt.id}
            className="p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3"
          >
            <div className="flex items-center justify-between text-sm text-indigo-400 font-medium">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {new Date(evt.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-xs bg-indigo-500/10 text-indigo-300 px-2.5 py-1 rounded">
                {evt.location}
              </span>
            </div>
            <h4 className="text-sm font-bold text-white">{evt.title}</h4>
            <div className="text-xs text-[var(--text-muted)] flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{evt.attendees.join(', ')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
