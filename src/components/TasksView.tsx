import React, { useState } from 'react';
import { CheckSquare, Square, Calendar, Clock, MessageSquare, AlertTriangle, Plus, CheckCircle2, User } from 'lucide-react';
import { Task, Lead } from '../types';

interface TasksViewProps {
  tasks: Task[];
  leads: Lead[];
  onToggleTask: (taskId: string) => void;
  onOpenLead: (lead: Lead) => void;
  onOpenWhatsApp: (lead: Lead) => void;
  onAddTask: (task: Task) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  leads,
  onToggleTask,
  onOpenLead,
  onOpenWhatsApp,
  onAddTask,
}) => {
  const [filter, setFilter] = useState<'pending' | 'today' | 'completed' | 'all'>('pending');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState(leads[0]?.id || '');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDueDate, setTaskDueDate] = useState(new Date().toISOString().split('T')[0]);

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'today') return !t.completed && t.dueDate === todayStr;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskDescription.trim() || !selectedLeadId) return;

    const lead = leads.find((l) => l.id === selectedLeadId);
    const newTask: Task = {
      id: `task-${Date.now()}`,
      leadId: selectedLeadId,
      leadName: lead?.name || 'Cliente',
      dueDate: taskDueDate,
      description: taskDescription.trim(),
      completed: false,
    };

    onAddTask(newTask);
    setTaskDescription('');
    setShowAddModal(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <span>Gestor de Follow-ups e Tarefas Comerciais</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Mantenha o relacionamento aquecido e feche propostas no momento certo
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Segmented filter */}
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filter === 'pending' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pendentes ({tasks.filter((t) => !t.completed).length})
            </button>
            <button
              onClick={() => setFilter('today')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filter === 'today' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Hoje ({tasks.filter((t) => !t.completed && t.dueDate === todayStr).length})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filter === 'completed' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Concluídas
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/30"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Tarefa</span>
          </button>
        </div>
      </div>

      {/* Lista de Tarefas */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/50 border border-slate-800/80 rounded-2xl p-8">
            <CheckCircle2 className="w-10 h-10 text-emerald-500/40 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-white">Nenhuma tarefa nesta categoria</h3>
            <p className="text-xs text-slate-400 mt-1">
              {filter === 'today'
                ? 'Sem retornos agendados para hoje. Excelente momento para buscar novos leads!'
                : 'Todas as tarefas pendentes foram resolvidas.'}
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const lead = leads.find((l) => l.id === task.leadId);
            const isToday = task.dueDate === todayStr;
            const isOverdue = !task.completed && task.dueDate < todayStr;

            return (
              <div
                key={task.id}
                className={`p-4 rounded-2xl border transition flex items-start justify-between gap-4 ${
                  task.completed
                    ? 'bg-slate-950/40 border-slate-850 opacity-60'
                    : isOverdue
                    ? 'bg-slate-900 border-rose-800/50 shadow-md'
                    : isToday
                    ? 'bg-slate-900 border-amber-800/50 shadow-md'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => onToggleTask(task.id)}
                    className="mt-0.5 text-slate-400 hover:text-emerald-400 transition cursor-pointer shrink-0"
                  >
                    {task.completed ? (
                      <CheckSquare className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-500 hover:text-slate-300" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {lead ? (
                        <button
                          type="button"
                          onClick={() => onOpenLead(lead)}
                          className="text-xs font-bold text-white hover:text-blue-300 transition block truncate text-left cursor-pointer"
                        >
                          {lead.name}
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-white">{task.leadName}</span>
                      )}
                      <span className="text-slate-600">·</span>
                      <span
                        className={`text-[10px] font-mono-numbers px-2 py-0.5 rounded-full ${
                          isOverdue
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : isToday
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isOverdue ? `Atrasada (${task.dueDate})` : isToday ? 'Para Hoje' : task.dueDate}
                      </span>
                    </div>

                    <p
                      className={`text-xs leading-relaxed ${
                        task.completed ? 'line-through text-slate-500' : 'text-slate-300'
                      }`}
                    >
                      {task.description}
                    </p>
                  </div>
                </div>

                {lead && (
                  <button
                    type="button"
                    onClick={() => onOpenWhatsApp(lead)}
                    className="p-2 rounded-xl text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/30 transition shrink-0 cursor-pointer"
                    title="Falar no WhatsApp"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Criação de Tarefa */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-white tracking-tight mb-4">
              Agendar Nova Tarefa Comercial
            </h3>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Vincular ao Lead
                </label>
                <select
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                >
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.segment})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Data Prevista
                </label>
                <input
                  type="date"
                  required
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono-numbers"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Descrição da Ação
                </label>
                <textarea
                  required
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  rows={3}
                  placeholder="Ex: Enviar catálogo em PDF e ligar para saber a decisão da diretoria..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl p-3 text-xs text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Salvar Tarefa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
