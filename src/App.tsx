import React, { useState, useEffect } from 'react';
import {
  getStoredAccessKey,
  setStoredAccessKey,
  clearStoredAccessKey,
  loadLeads,
  saveLeads,
  loadTasks,
  saveTasks,
  loadInteractions,
  saveInteractions,
  loadTemplates,
  saveTemplates,
  exportLeadsToCSV,
  DEFAULT_ACCESS_KEY,
} from './services/storage';
import { Lead, LeadStatus, Interaction, Task, MessageTemplate } from './types';
import { Header } from './components/Header';
import { KeyModal } from './components/KeyModal';
import { DashboardView } from './components/DashboardView';
import { LeadFinderView } from './components/LeadFinderView';
import { KanbanView } from './components/KanbanView';
import { TasksView } from './components/TasksView';
import { PRDReaderView } from './components/PRDReaderView';
import { PublicCapturePage } from './components/PublicCapturePage';
import { LeadDetailModal } from './components/LeadDetailModal';
import { WhatsAppModal } from './components/WhatsAppModal';
import { ScoreBreakdownModal } from './components/ScoreBreakdownModal';
import { SettingsModal } from './components/SettingsModal';
import { ManualLeadModal } from './components/ManualLeadModal';
import { Sidebar } from './components/Sidebar';

export default function App() {
  const [accessKey, setAccessKey] = useState<string>('');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'finder' | 'kanban' | 'tasks' | 'prd' | 'capture'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopPinned, setIsDesktopPinned] = useState(true);

  // Dados Centrais
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);

  // Modais
  const [activeLeadForDetail, setActiveLeadForDetail] = useState<Lead | null>(null);
  const [activeLeadForWhatsApp, setActiveLeadForWhatsApp] = useState<Lead | null>(null);
  const [activeLeadForScore, setActiveLeadForScore] = useState<Lead | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isManualLeadOpen, setIsManualLeadOpen] = useState(false);

  // Inicialização
  useEffect(() => {
    const key = getStoredAccessKey();
    if (key) {
      setAccessKey(key);
      setIsUnlocked(true);
    } else {
      // Se não houver chave armazenada, abre com a demo pré-configurada
      setAccessKey(DEFAULT_ACCESS_KEY);
      setIsUnlocked(true);
      setStoredAccessKey(DEFAULT_ACCESS_KEY);
    }

    setLeads(loadLeads());
    setTasks(loadTasks());
    setInteractions(loadInteractions());
    setTemplates(loadTemplates());
  }, []);

  // Sincronização automática com localStorage
  const updateLeads = (newLeads: Lead[]) => {
    setLeads(newLeads);
    saveLeads(newLeads);
  };

  const updateTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    saveTasks(newTasks);
  };

  const updateInteractions = (newInteractions: Interaction[]) => {
    setInteractions(newInteractions);
    saveInteractions(newInteractions);
  };

  const updateTemplates = (newTemplates: MessageTemplate[]) => {
    setTemplates(newTemplates);
    saveTemplates(newTemplates);
  };

  // Autenticação por chave
  const handleUnlock = (key: string) => {
    setStoredAccessKey(key);
    setAccessKey(key);
    setIsUnlocked(true);
  };

  const handleLogout = () => {
    clearStoredAccessKey();
    setAccessKey('');
    setIsUnlocked(false);
  };

  const handleUpdateKey = (newKey: string) => {
    setStoredAccessKey(newKey);
    setAccessKey(newKey);
  };

  // Ações de Leads
  const handleAddLeadToFunnel = (lead: Lead) => {
    // Evita duplicatas
    const alreadyExists = leads.some(
      (l) => (lead.placeId && l.placeId === lead.placeId) || l.name.toLowerCase() === lead.name.toLowerCase()
    );

    if (alreadyExists) {
      alert('Este lead já está no seu funil comercial.');
      return;
    }

    const updated = [lead, ...leads];
    updateLeads(updated);

    // Registra interação de importação
    const newInt: Interaction = {
      id: `int-${Date.now()}`,
      leadId: lead.id,
      type: 'note',
      content: `Lead importado do Google Places para o funil (Opportunity Score: ${lead.opportunityScore}).`,
      timestamp: new Date().toISOString(),
    };
    updateInteractions([newInt, ...interactions]);
  };

  const handleUpdateStatus = (leadId: string, newStatus: LeadStatus) => {
    const updated = leads.map((l) => (l.id === leadId ? { ...l, status: newStatus, updatedAt: new Date().toISOString() } : l));
    updateLeads(updated);

    const leadName = leads.find((l) => l.id === leadId)?.name || 'Lead';
    const newInt: Interaction = {
      id: `int-${Date.now()}`,
      leadId,
      type: 'status_change',
      content: `Status alterado para "${newStatus.toUpperCase()}".`,
      timestamp: new Date().toISOString(),
    };
    updateInteractions([newInt, ...interactions]);
  };

  const handleUpdateLead = (updatedLead: Lead) => {
    const updated = leads.map((l) => (l.id === updatedLead.id ? updatedLead : l));
    updateLeads(updated);
  };

  const handleDeleteLead = (leadId: string) => {
    const updatedLeads = leads.filter((l) => l.id !== leadId);
    updateLeads(updatedLeads);

    const updatedTasks = tasks.filter((t) => t.leadId !== leadId);
    updateTasks(updatedTasks);

    const updatedInteractions = interactions.filter((i) => i.leadId !== leadId);
    updateInteractions(updatedInteractions);
  };

  const handleWhatsAppSent = (leadId: string, messageText: string) => {
    // Se o lead ainda for "novo", avança automaticamente para "contatado"
    const lead = leads.find((l) => l.id === leadId);
    if (lead && lead.status === 'novo') {
      handleUpdateStatus(leadId, 'contatado');
    }

    const newInt: Interaction = {
      id: `int-${Date.now()}`,
      leadId,
      type: 'whatsapp',
      content: `Mensagem enviada via WhatsApp:\n"${messageText}"`,
      timestamp: new Date().toISOString(),
    };
    updateInteractions([newInt, ...interactions]);
  };

  const handleScheduleFollowUp = (leadId: string, date: string, note: string) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;

    // Atualiza o lead
    const updatedLead: Lead = {
      ...lead,
      nextFollowUpDate: date,
      nextFollowUpNote: note,
      updatedAt: new Date().toISOString(),
    };
    handleUpdateLead(updatedLead);

    // Cria/atualiza tarefa vinculada
    const newTask: Task = {
      id: `task-${Date.now()}`,
      leadId,
      leadName: lead.name,
      dueDate: date,
      description: note || 'Retorno de follow-up comercial',
      completed: false,
    };
    updateTasks([newTask, ...tasks]);

    // Registra na timeline
    const newInt: Interaction = {
      id: `int-${Date.now()}`,
      leadId,
      type: 'note',
      content: `Follow-up agendado para ${date}: "${note}"`,
      timestamp: new Date().toISOString(),
    };
    updateInteractions([newInt, ...interactions]);
  };

  const handleToggleTask = (taskId: string) => {
    const updated = tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
    updateTasks(updated);
  };

  const handleAddTask = (newTask: Task) => {
    updateTasks([newTask, ...tasks]);
  };

  // Se o usuário estiver na página pública de captura (/captura)
  if (currentTab === 'capture') {
    return (
      <PublicCapturePage
        onBackToApp={() => setCurrentTab('dashboard')}
        onLeadCaptured={(newLead) => {
          updateLeads([newLead, ...leads]);
          setCurrentTab('kanban');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Modal de Bloqueio por Chave Privada */}
      <KeyModal isOpen={!isUnlocked} onUnlock={handleUnlock} />

      {/* Top Bar Header com Botão da Gaveta Lateral */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onNewSearch={() => setCurrentTab('finder')}
        accessKey={accessKey}
        totalLeadsCount={leads.length}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      {/* Layout Flex com Menu Lateral (Sidebar / Gaveta) */}
      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          totalLeadsCount={leads.length}
          pendingTasksCount={tasks.filter((t) => !t.completed).length}
          accessKey={accessKey}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenManualLead={() => setIsManualLeadOpen(true)}
          onLogout={handleLogout}
          isDesktopPinned={isDesktopPinned}
          onToggleDesktopPin={() => setIsDesktopPinned((prev) => !prev)}
        />

        {/* Conteúdo Principal da Aba */}
        <main className="flex-1 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              leads={leads}
              tasks={tasks}
              onNavigateToFinder={() => setCurrentTab('finder')}
              onNavigateToKanban={() => setCurrentTab('kanban')}
              onOpenLead={(lead) => setActiveLeadForDetail(lead)}
              onOpenWhatsApp={(lead) => setActiveLeadForWhatsApp(lead)}
              onToggleTask={handleToggleTask}
              onExportCSV={() => exportLeadsToCSV(leads)}
            />
          )}

          {currentTab === 'finder' && (
            <LeadFinderView
              existingLeads={leads}
              onAddLeadToFunnel={handleAddLeadToFunnel}
              onOpenWhatsApp={(lead) => setActiveLeadForWhatsApp(lead)}
              onOpenScoreExplanation={(lead) => setActiveLeadForScore(lead)}
            />
          )}

          {currentTab === 'kanban' && (
            <KanbanView
              leads={leads}
              onUpdateStatus={handleUpdateStatus}
              onOpenLead={(lead) => setActiveLeadForDetail(lead)}
              onOpenWhatsApp={(lead) => setActiveLeadForWhatsApp(lead)}
              onAddManualLead={() => setIsManualLeadOpen(true)}
              onExportCSV={() => exportLeadsToCSV(leads)}
            />
          )}

          {currentTab === 'tasks' && (
            <TasksView
              tasks={tasks}
              leads={leads}
              onToggleTask={handleToggleTask}
              onOpenLead={(lead) => setActiveLeadForDetail(lead)}
              onOpenWhatsApp={(lead) => setActiveLeadForWhatsApp(lead)}
              onAddTask={handleAddTask}
            />
          )}

          {currentTab === 'prd' && <PRDReaderView />}
        </main>
      </div>

      {/* Modais Globais */}
      <LeadDetailModal
        lead={activeLeadForDetail}
        interactions={interactions}
        isOpen={!!activeLeadForDetail}
        onClose={() => setActiveLeadForDetail(null)}
        onUpdateStatus={handleUpdateStatus}
        onUpdateLead={handleUpdateLead}
        onDeleteLead={handleDeleteLead}
        onOpenWhatsApp={(lead) => {
          setActiveLeadForDetail(null);
          setActiveLeadForWhatsApp(lead);
        }}
        onAddInteraction={(leadId, type, content) => {
          const newInt: Interaction = {
            id: `int-${Date.now()}`,
            leadId,
            type,
            content,
            timestamp: new Date().toISOString(),
          };
          updateInteractions([newInt, ...interactions]);
        }}
        onScheduleFollowUp={handleScheduleFollowUp}
      />

      <WhatsAppModal
        lead={activeLeadForWhatsApp}
        templates={templates}
        isOpen={!!activeLeadForWhatsApp}
        onClose={() => setActiveLeadForWhatsApp(null)}
        onSent={handleWhatsAppSent}
      />

      <ScoreBreakdownModal
        lead={activeLeadForScore}
        isOpen={!!activeLeadForScore}
        onClose={() => setActiveLeadForScore(null)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        accessKey={accessKey}
        onUpdateKey={handleUpdateKey}
        onLogout={handleLogout}
        onExportCSV={() => exportLeadsToCSV(leads)}
        leads={leads}
        onImportBackup={(imported) => {
          updateLeads(imported);
          alert('Leads restaurados com sucesso!');
        }}
        templates={templates}
        onUpdateTemplates={updateTemplates}
      />

      <ManualLeadModal
        isOpen={isManualLeadOpen}
        onClose={() => setIsManualLeadOpen(false)}
        onAddLead={handleAddLeadToFunnel}
      />
    </div>
  );
}
