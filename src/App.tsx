import React, { useState, useEffect } from 'react';
import { exportLeadsToCSV, INITIAL_TEMPLATES } from './services/storage';
import { loadOwnedCollection, saveOwnedCollection } from './services/firestoreStorage';
import { useAuth } from './auth/AuthContext';
import { auth } from './lib/firebase';
import { signOut } from 'firebase/auth';
import { Lead, LeadStatus, Interaction, Task, MessageTemplate } from './types';
import { Header } from './components/Header';
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

function DashboardApp() {
  const { user } = useAuth();
  const [accessKey, setAccessKey] = useState<string>('');
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

  // Inicialização isolada por usuário: nenhum lead de demonstração é carregado.
  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    Promise.all([
      loadOwnedCollection<Lead>(user.uid, 'leads'),
      loadOwnedCollection<Task>(user.uid, 'tasks'),
      loadOwnedCollection<Interaction>(user.uid, 'interactions'),
      loadOwnedCollection<MessageTemplate>(user.uid, 'templates'),
    ]).then(async ([ownedLeads, ownedTasks, ownedInteractions, ownedTemplates]) => {
      if (!active) return;
      setLeads(ownedLeads);
      setTasks(ownedTasks);
      setInteractions(ownedInteractions);
      if (ownedTemplates.length) setTemplates(ownedTemplates);
      else {
        setTemplates(INITIAL_TEMPLATES);
        await saveOwnedCollection(user.uid, 'templates', INITIAL_TEMPLATES);
      }
    }).catch((error) => {
      console.error('[LedsNet] Falha ao carregar dados da conta:', error);
      if (active) alert('Não foi possível carregar seus dados. Confira sua conexão e as regras do Firestore.');
    });
    return () => { active = false; };
  }, [user?.uid]);

  // Sincronização automática com localStorage
  const updateLeads = (newLeads: Lead[]) => {
    setLeads(newLeads);
    if (user?.uid) void saveOwnedCollection(user.uid, 'leads', newLeads).catch(() => alert('Não foi possível salvar os leads no Firestore.'));
  };

  const updateTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    if (user?.uid) void saveOwnedCollection(user.uid, 'tasks', newTasks).catch(() => alert('Não foi possível salvar as tarefas no Firestore.'));
  };

  const updateInteractions = (newInteractions: Interaction[]) => {
    setInteractions(newInteractions);
    if (user?.uid) void saveOwnedCollection(user.uid, 'interactions', newInteractions).catch(() => alert('Não foi possível salvar as interações no Firestore.'));
  };

  const updateTemplates = (newTemplates: MessageTemplate[]) => {
    setTemplates(newTemplates);
    if (user?.uid) void saveOwnedCollection(user.uid, 'templates', newTemplates).catch(() => alert('Não foi possível salvar os templates no Firestore.'));
  };

  // A sessão real é gerenciada pelo Firebase Authentication.
  const handleLogout = () => {
    void signOut(auth).finally(() => window.location.assign('/entrar'));
  };

  const handleUpdateKey = (_newKey: string) => {
    alert('Chaves de integração não podem ser armazenadas no navegador. Configure-as como segredos no servidor.');
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

export default function App() {
  return <DashboardApp />;
}
