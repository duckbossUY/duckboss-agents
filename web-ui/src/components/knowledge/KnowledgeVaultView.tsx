import React, { useState, useEffect } from 'react';
import { 
  UploadCloud, 
  User, 
  FileText, 
  Sparkles, 
  BookOpen, 
  Save
} from 'lucide-react';
import type { DocumentItem, UserPreference } from '../../types';
import { api } from '../../services/api';

export const KnowledgeVaultView: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [preferences, setPreferences] = useState<UserPreference[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('finanzas');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadData = async () => {
    try {
      const [docs, prefs] = await Promise.all([
        api.getDocuments(),
        api.getPreferences()
      ]);
      setDocuments(docs || []);
      setPreferences(prefs || []);
    } catch (e) {
      console.error('Error loading knowledge data', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsSubmitting(true);
    try {
      await api.createDocument(newTitle, newContent, newCategory);
      setNewTitle('');
      setNewContent('');
      await loadData();
    } catch (e) {
      alert('Error al vectorizar documento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePref = (key: string, value: string) => {
    setPreferences(prev => prev.map(p => p.key === key ? { ...p, value } : p));
  };

  const handleSavePreferences = async () => {
    setIsSubmitting(true);
    try {
      for (const pref of preferences) {
        await api.savePreference(pref.key, pref.value, pref.category, pref.description);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e) {
      alert('Error al guardar preferencias');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-12 animate-fadeIn">
      
      {/* Header */}
      <div className="p-6 rounded-2xl glass-panel relative overflow-hidden bg-gradient-to-r from-purple-500/10 via-slate-900/60 to-cyan-500/10 border border-purple-500/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <span className="badge badge-aurora">Memoria Híbrida</span>
              <span className="text-xs text-[var(--text-muted)]">• ChromaDB + SQLite</span>
            </div>
            <h2 className="text-2xl font-black text-white font-display">
              Bóveda de Conocimiento y Aprendizaje Adaptativo
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-2xl leading-relaxed">
              Vectoriza documentos y políticas de tu empresa para que los agentes consulten vía RAG y configura tus reglas de comportamiento para que aprendan y se amolden a ti.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Panel 1: Subir Documento a ChromaDB */}
        <div className="glass-panel p-6 space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-[var(--border-subtle)]">
            <UploadCloud className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Vectorizar Documento (RAG)
              </h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                Indexa políticas, directrices de cobro o especificaciones técnicas en ChromaDB local.
              </p>
            </div>
          </div>

          <form onSubmit={handleUploadDocument} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Título del Documento</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ej: Política de Cobranzas y Plazos de Gracia 2026"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Categoría</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="input-field bg-[var(--bg-surface)] text-slate-200"
              >
                <option value="finanzas">Finanzas y Cobranzas</option>
                <option value="ciberseguridad">Ciberseguridad y Arquitectura</option>
                <option value="marketing">Marketing y Tono de Marca</option>
                <option value="operaciones">Operaciones y SOPs</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">Contenido Textual</label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={5}
                placeholder="Pega aquí el contenido, manual de procedimientos o reglas que los agentes deben conocer..."
                className="input-field resize-y"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-aurora w-full py-2.5 gap-3"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Vectorizando...' : 'Vectorizar en ChromaDB'}</span>
            </button>
          </form>

          {/* List of vectorized documents */}
          <div className="pt-3 border-t border-[var(--border-subtle)] space-y-3">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider block">
              Documentos Indexados ({documents.length})
            </span>
            {documents.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] italic leading-relaxed">Aún no hay documentos subidos en ChromaDB.</p>
            ) : (
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {documents.map((doc) => (
                  <div 
                    key={doc.id}
                    className="p-4 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-purple-400" />
                      <div>
                        <div className="font-semibold text-white">{doc.title}</div>
                        <div className="text-xs text-[var(--text-muted)]">Cat: {doc.category}</div>
                      </div>
                    </div>
                    <span className="badge badge-aurora">Vectorizado</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel 2: Preferencias y Memoria del Usuario (SQLite) */}
        <div className="glass-panel p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  Perfil & Reglas del Usuario
                </h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  Parámetros fijos que los agentes consultan en cada ciclo de razonamiento.
                </p>
              </div>
            </div>

            <button
              onClick={handleSavePreferences}
              disabled={isSubmitting}
              className="btn btn-primary btn-sm gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saveSuccess ? '¡Guardado!' : 'Guardar'}</span>
            </button>
          </div>

          <div className="space-y-5">
            {preferences.map((pref) => (
              <div key={pref.key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-300">
                    {pref.key.replace(/_/g, ' ').toUpperCase()}
                  </label>
                  <span className="text-xs text-cyan-400 uppercase font-mono">{pref.category}</span>
                </div>
                <input
                  type="text"
                  value={pref.value}
                  onChange={(e) => handleUpdatePref(pref.key, e.target.value)}
                  className="input-field"
                />
                {pref.description && (
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">{pref.description}</p>
                )}
              </div>
            ))}
          </div>

          {/* Guía informativa de fuentes requeridas */}
          <div className="p-5 rounded-xl bg-cyan-500/5 border border-cyan-500/20 space-y-3 mt-4">
            <h4 className="text-xs font-bold text-cyan-400 flex items-center gap-2 uppercase tracking-wider">
              <BookOpen className="w-4 h-4" /> ¿Qué fuentes necesita cada escuadrón?
            </h4>
            <ul className="text-sm text-slate-300 space-y-1.5 list-disc list-inside">
              <li><strong>Asistente Ejecutivo:</strong> Horarios laborales, clientes VIP, plantillas de cobro.</li>
              <li><strong>Ciberseguridad:</strong> Diagramas C4, tokens requeridos, políticas de contraseñas.</li>
              <li><strong>Finanzas & Marketing:</strong> Objetivos de facturación, márgenes, manual de tono.</li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
};
