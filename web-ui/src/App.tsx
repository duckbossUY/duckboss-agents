import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/dashboard/DashboardView';
import { ExecutiveSuiteView } from './components/executive/ExecutiveSuiteView';
import { LiveThoughtStream } from './components/stream/LiveThoughtStream';
import { KnowledgeVaultView } from './components/knowledge/KnowledgeVaultView';
import { InterventionModal } from './components/hitl/InterventionModal';
import { Sidebar } from './components/layout/Sidebar';
import type { Agent, Execution, Intervention } from './types';
import { api } from './services/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'executive' | 'stream' | 'knowledge'>('dashboard');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeExecution, setActiveExecution] = useState<Execution | null>(null);
  const [pendingInterventions, setPendingInterventions] = useState<Intervention[]>([]);
  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);
  const [isBackendHealthy, setIsBackendHealthy] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);

  const streamUnsubscribeRef = useRef<(() => void) | null>(null);

  // Load initial data
  const refreshData = async () => {
    try {
      const [agentsData, intervData] = await Promise.all([
        api.getAgents(),
        api.getPendingInterventions()
      ]);
      setAgents(agentsData || []);
      setPendingInterventions(intervData || []);
      setIsBackendHealthy(true);
    } catch (e) {
      console.error('Failed to contact backend', e);
      setIsBackendHealthy(false);
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 4000);
    return () => clearInterval(interval);
  }, []);

  // Handle running an agent
  const handleRunAgent = async (agentId: string, prompt: string) => {
    try {
      const res = await api.runAgent(agentId, prompt);
      const executionId = res.execution_id;

      // Create initial local execution object
      const initialExec: Execution = {
        id: executionId,
        agent_id: agentId,
        prompt: prompt,
        status: 'running',
        created_at: new Date().toISOString(),
        steps: []
      };

      setActiveExecution(initialExec);
      setActiveTab('stream'); // Switch to live stream view
      subscribeToStream(executionId);
    } catch (err) {
      alert('Error al iniciar el agente: ' + err);
    }
  };

  // SSE Stream subscription
  const subscribeToStream = (executionId: string) => {
    if (streamUnsubscribeRef.current) {
      streamUnsubscribeRef.current();
    }

    setIsStreaming(true);

    const unsub = api.subscribeExecutionStream(
      executionId,
      (event) => {
        if (!event) return;
        const type = event.type;
        const data = event.data;

        if (type === 'step') {
          setActiveExecution((prev) => {
            if (!prev || prev.id !== executionId) return prev;
            const steps = prev.steps ? [...prev.steps, data] : [data];
            return { ...prev, steps };
          });
        } else if (type === 'status_change') {
          setActiveExecution((prev) => {
            if (!prev || prev.id !== executionId) return prev;
            return { ...prev, status: data.status };
          });
          refreshData();
        } else if (type === 'human_intervention_required') {
          refreshData();
          setIsInterventionModalOpen(true);
        } else if (type === 'finished') {
          setIsStreaming(false);
          setActiveExecution((prev) => {
            if (!prev || prev.id !== executionId) return prev;
            return { 
              ...prev, 
              status: data.status, 
              result: data.result 
            };
          });
          refreshData();
        }
      },
      (err) => {
        console.error('SSE Stream error', err);
        setIsStreaming(false);
      }
    );

    streamUnsubscribeRef.current = unsub;
  };

  // Handle resolving an intervention
  const handleResolveIntervention = async (
    interventionId: string,
    decision: 'approved' | 'rejected' | 'modified',
    userResponse: string,
    modifiedArgs?: any
  ) => {
    try {
      await api.resolveIntervention(interventionId, decision, userResponse, modifiedArgs);
      setIsInterventionModalOpen(false);
      await refreshData();
    } catch (err) {
      alert('Error al resolver la intervención: ' + err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-app)] text-[var(--text-main)]">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingInterventionsCount={pendingInterventions.length}
        onOpenInterventions={() => setIsInterventionModalOpen(true)}
        isBackendHealthy={isBackendHealthy}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar 
          currentView={activeTab === 'stream' ? 'dashboard' : activeTab}
          onNavigate={setActiveTab as any}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto w-full px-6 lg:px-10 py-10">
          <div className="max-w-7xl mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              agents={agents}
              onRunAgent={handleRunAgent}
              onOpenExecutiveSuite={() => setActiveTab('executive')}
            />
          )}

          {activeTab === 'executive' && (
            <ExecutiveSuiteView
              onRunAgent={handleRunAgent}
              activeExecutionId={activeExecution?.id || null}
            />
          )}

          {activeTab === 'stream' && (
            <LiveThoughtStream
              execution={activeExecution}
              onOpenIntervention={() => setIsInterventionModalOpen(true)}
              isStreaming={isStreaming}
            />
          )}

          {activeTab === 'knowledge' && (
            <KnowledgeVaultView />
          )}
          </div>
        </main>
      </div>

      {/* Human-in-the-Loop Intervention Modal */}
      <InterventionModal
        isOpen={isInterventionModalOpen}
        onClose={() => setIsInterventionModalOpen(false)}
        interventions={pendingInterventions}
        onResolve={handleResolveIntervention}
      />

    </div>
  );
};

export default App;
