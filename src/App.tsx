import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './lib/firebase';
import { api } from './services/api';
import {
  exportLeadsToCSV,
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

  // Inicialização com sessão persistente do Firebase Authentication.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAccessKey(user?.email || '');
      setIsUnlocked(!!user);
      if (!user) {
        setLeads([]);
        return;
      }
      setLeads([]);
      Promise.all([api.getLeads(), api.getTasks(), api.getInteractions(), api.getTemplates()])
        .then(([remoteLeads, remoteTasks, remoteInteractions, remoteTemplates]) => {
          setLeads(remoteLeads as Lead[]);
          setTasks(remoteTasks as Task[]);
          setInteractions(remoteInteractions as Interaction[]);
          setTemplates(remoteTemplates as MessageTemplate[]);
        })
        .catch((error) => {
          console.error('Falha ao carregar dados do Firebase:', error);
        });
    });
    return unsubscribe;
  }, []);

  // Sincronização automática com localStorage
  const updateLeads = (newLeads: Lead[]) => {
    setLeads(newLeads);
  };

  const updateTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    api.replaceTasks(newTasks).catch((error) => {
      console.error('Falha ao persistir tarefas no Firestore:', error);
      alert('Não foi possível salvar as tarefas no Firebase. Confira a conexão e tente novamente.');
    });
  };

  const updateInteractions = (newInteractions: Interaction[]) => {
    setInteractions(newInteractions);
    api.replaceInteractions(newInteractions).catch((error) => {
      console.error('Falha ao persistir interações no Firestore:', error);
    });
  };

  const updateTemplates = (newTemplates: MessageTemplate[]) => {
    setTemplates(newTemplates);
    api.replaceTemplates(newTemplates).catch((error) => {
      console.error('Falha ao persistir modelos no Firestore:', error);
      alert('Não foi possível salvar os modelos no Firebase.');
    });
  };

  // Autenticação real por Firebase Authentication.
  const handleUnlock = () => {
    setIsUnlocked(true);
    setAccessKey(auth.currentUser?.email || '');
  };

  const handleLogout = async () => {
    await signOut(auth);
    setAccessKey('');
    setIsUnlocked(false);
  };



  // Ações de Leads
  const handleAddLeadToFunnel = async (lead: Lead) => {
    const alreadyExists = leads.some(
      (item) => ((lead.placeId || lead.place_id) && (item.placeId || item.place_id) === (lead.placeId || lead.place_id)) ||
        (item.name || item.nome).toLowerCase() === (lead.name || lead.nome).toLowerCase()
    );
    if (alreadyExists) {
      alert('Esta empresa já está na sua lista.');
      return;
    }

    try {
      const response = await api.createLead({
        ...lead,
        nome: lead.name || lead.nome,
        name: lead.name || lead.nome,
        telefone: lead.phone || lead.telefone || '',
        phone: lead.phone || lead.telefone || '',
        email: lead.email || '',
        place_id: lead.place_id || lead.placeId || '',
        site: lead.website || lead.site || null,
        website: lead.website || lead.site || null,
        endereco: lead.address || lead.endereco || '',
        ramo: lead.segment || lead.ramo,
        regiao: lead.city || lead.regiao,
        score: lead.opportunityScore || lead.score,
      });
      const savedLead = response.lead ? { ...lead, ...response.lead } as Lead : lead;
      updateLeads([savedLead, ...leads]);
      const newInt: Interaction = {
        id: `int-${Date.now()}`,
        leadId: savedLead.id,
        type: 'note',
        content: `Empresa salva no Firestore para o funil comercial (score: ${savedLead.opportunityScore || savedLead.score}).`,
        timestamp: new Date().toISOString(),
      };
      updateInteractions([newInt, ...interactions]);
    } catch (error: any) {
      alert(error?.message || 'Não foi possível salvar a empresa no Firebase. Verifique a configuração do servidor.');
    }
  };

  const handleUpdateStatus = async (leadId: string, newStatus: LeadStatus) => {
    try {
      await api.updateLead(leadId, { status: newStatus });
      const updated = leads.map((l) => (l.id === leadId ? { ...l, status: newStatus, updatedAt: new Date().toISOString() } : l));
      updateLeads(updated);
      const newInt: Interaction = {
        id: `int-${Date.now()}`, leadId, type: 'status_change',
        content: `Status alterado para "${newStatus.toUpperCase()}".`,
        timestamp: new Date().toISOString(),
      };
      updateInteractions([newInt, ...interactions]);
    } catch (error: any) {
      alert(error?.message || 'Não foi possível atualizar o status no Firebase.');
    }
  };

  const handleUpdateLead = async (updatedLead: Lead) => {
    try {
      await api.updateLead(updatedLead.id, {
        status: updatedLead.status, email: updatedLead.email,
        telefone: updatedLead.phone || updatedLead.telefone,
        site: updatedLead.website || updatedLead.site,
        notes: updatedLead.notes, regiao: updatedLead.city || updatedLead.regiao,
        ramo: updatedLead.segment || updatedLead.ramo,
        nextFollowUpDate: updatedLead.nextFollowUpDate,
        nextFollowUpNote: updatedLead.nextFollowUpNote,
      });
      updateLeads(leads.map((lead) => lead.id === updatedLead.id ? updatedLead : lead));
    } catch (error: any) {
      alert(error?.message || 'Não foi possível salvar as alterações no Firebase.');
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      await api.deleteLead(leadId);
      updateLeads(leads.filter((lead) => lead.id !== leadId));
      updateTasks(tasks.filter((task) => task.leadId !== leadId));
      updateInteractions(interactions.filter((interaction) => interaction.leadId !== leadId));
    } catch (error: any) {
      alert(error?.message || 'Não foi possível excluir a empresa do Firebase.');
    }
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
