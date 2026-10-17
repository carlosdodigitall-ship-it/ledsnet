import React from 'react';
import {
  Users,
  UserCheck,
  TrendingUp,
  Clock,
  CalendarCheck,
  MessageSquare,
  ArrowRight,
  Search,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Download
} from 'lucide-react';
import { Lead, Task, LeadStatus } from '../types';

interface DashboardViewProps {
  leads: Lead[];
  tasks: Task[];
  onNavigateToFinder: () => void;
  onNavigateToKanban: () => void;
  onOpenLead: (lead: Lead) => void;
  onOpenWhatsApp: (lead: Lead) => void;
  onToggleTask: (taskId: string) => void;
  onExportCSV: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  leads,
  tasks,
  onNavigateToFinder,
  onNavigateToKanban,
  onOpenLead,
  onOpenWhatsApp,
  onToggleTask,
  onExportCSV,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Cálculo de KPIs
  const totalLeads = leads.length;
  const newToday = leads.filter((l) => l.createdAt.startsWith(todayStr)).length;
  
  const contactedCount = leads.filter((l) => l.status !== 'novo').length;
  const respondedCount = leads.filter(
    (l) => l.status === 'respondeu' || l.status === 'qualificado' || l.status === 'convertido'
  ).length;
  const convertedCount = leads.filter((l) => l.status === 'convertido').length;

  const responseRate = contactedCount > 0 ? Math.round((respondedCount / contactedCount) * 100) : 0;
  const conversionRate = totalLeads > 0 ? Math.round((convertedCount / totalLeads) * 100) : 0;

  const pendingTasks = tasks.filter((t) => !t.completed);
  const tasksToday = pendingTasks.filter((t) => t.dueDate <= todayStr);

  // Contagem por Status
  const statusCounts: Record<LeadStatus, number> = {
    novo: leads.filter((l) => l.status === 'novo').length,
    contatado: leads.filter((l) => l.status === 'contatado').length,
    respondeu: leads.filter((l) => l.status === 'respondeu').length,
    qualificado: leads.filter((l) => l.status === 'qualificado').length,
    convertido: leads.filter((l) => l.status === 'convertido').length,
    perdido: leads.filter((l) => l.status === 'perdido').length,
  };

  // Contagem por Segmento
  const segmentMap: Record<string, number> = {};
  leads.forEach((l) => {
    segmentMap[l.segment] = (segmentMap[l.segment] || 0) + 1;
  });
  const topSegments = Object.entries(segmentMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Leads com Alta Urgência (Score >= 80)
  const highOpportunityLeads = leads
    .filter((l) => l.opportunityScore >= 80 && l.status !== 'convertido' && l.status !== 'perdido')
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .slice(0, 4);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 lg:px-8 py-6">
      {/* Banner de Boas-Vindas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>PAINEL COMERCIAL ATIVO</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Prospecção & Captação Inteligente
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Acompanhe o desempenho do seu funil comercial, contate estabelecimentos com alta urgência e nunca perca um retorno agendado.
          </p>
        </div>

        <div className="flex items-center gap-2.5 relative z-10">
          <button
            onClick={onExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={onNavigateToFinder}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-xs font-semibold text-white transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-600/20"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Buscar Novos Leads</span>
          </button>
        </div>
      </div>

      {/* Grid com 5 KPIs Oficiais do PRD */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total de Leads</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono-numbers">{totalLeads}</div>
          <span className="text-[10px] text-slate-500 mt-1 block">No pipeline ativo</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Novos Hoje</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono-numbers">+{newToday}</div>
          <span className="text-[10px] text-slate-500 mt-1 block">Capturados nas últimas 24h</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Taxa de Resposta</span>
            <MessageSquare className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400 font-mono-numbers">{responseRate}%</div>
          <span className="text-[10px] text-slate-500 mt-1 block">WhatsApp e contatos</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Conversão Final</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono-numbers">{conversionRate}%</div>
          <span className="text-[10px] text-slate-500 mt-1 block">{convertedCount} negócios fechados</span>
        </div>

        <div className="col-span-2 md:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Follow-ups Hoje</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono-numbers">{tasksToday.length}</div>
          <span className="text-[10px] text-slate-500 mt-1 block">Tarefas prioritárias pendentes</span>
        </div>
      </div>

      {/* Grid Principal: Funil Visual + Tarefas do Dia */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Funil Visual de Conversão */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Funil de Conversão Comercial
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Evolução quantitativa por estágio de prospecção
                </p>
              </div>
              <button
                onClick={onNavigateToKanban}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition cursor-pointer"
              >
                <span>Abrir Kanban</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Novo Lead', count: statusCounts.novo, color: 'bg-blue-600', text: 'text-blue-400' },
                { label: 'Contatado', count: statusCounts.contatado, color: 'bg-amber-500', text: 'text-amber-400' },
                { label: 'Respondeu', count: statusCounts.respondeu, color: 'bg-purple-500', text: 'text-purple-400' },
                { label: 'Qualificado', count: statusCounts.qualificado, color: 'bg-cyan-500', text: 'text-cyan-400' },
                { label: 'Convertido', count: statusCounts.convertido, color: 'bg-emerald-500', text: 'text-emerald-400' },
              ].map((step, idx) => {
                const percentage = totalLeads > 0 ? Math.round((step.count / totalLeads) * 100) : 0;
                return (
                  <div key={step.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">{step.label}</span>
                      <div className="flex items-center gap-2 font-mono-numbers">
                        <span className={`font-bold ${step.text}`}>{step.count} leads</span>
                        <span className="text-slate-500 text-[11px]">({percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                      <div
                        className={`h-full ${step.color} transition-all duration-500`}
                        style={{ width: `${Math.max(4, percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ramos mais Ativos */}
          <div className="mt-6 pt-4 border-t border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Distribuição por Ramo
            </span>
            <div className="flex flex-wrap gap-2">
              {topSegments.map(([seg, count]) => (
                <span
                  key={seg}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center gap-1.5"
                >
                  <span>{seg}</span>
                  <span className="text-[10px] text-blue-400 font-mono-numbers font-bold">
                    ({count})
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Tarefas e Follow-ups do Dia */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-amber-400" />
                  <span>Follow-ups & Tarefas de Hoje</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Compromissos pendentes com clientes
                </p>
              </div>
              <span className="text-xs font-mono-numbers text-amber-400 font-bold">
                {tasksToday.length} pendentes
              </span>
            </div>

            <div className="space-y-2.5">
              {tasksToday.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
                  <span>Todos os follow-ups de hoje estão em dia!</span>
                </div>
              ) : (
                tasksToday.map((task) => {
                  const lead = leads.find((l) => l.id === task.leadId);
                  return (
                    <div
                      key={task.id}
                      className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-start justify-between gap-3 group"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <button
                          type="button"
                          onClick={() => onToggleTask(task.id)}
                          className="mt-0.5 text-slate-500 hover:text-emerald-400 transition cursor-pointer shrink-0"
                          title="Marcar como concluído"
                        >
                          <div className="w-4 h-4 rounded border border-slate-600 hover:border-emerald-500" />
                        </button>
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => lead && onOpenLead(lead)}
                            className="text-xs font-bold text-white hover:text-blue-300 transition block truncate text-left cursor-pointer"
                          >
                            {task.leadName}
                          </button>
                          <p className="text-[11px] text-slate-400 leading-snug line-clamp-2 mt-0.5">
                            {task.description}
                          </p>
                        </div>
                      </div>

                      {lead && (
                        <button
                          type="button"
                          onClick={() => onOpenWhatsApp(lead)}
                          className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition shrink-0 cursor-pointer"
                          title="Falar no WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Oportunidades Quentes para Contatar */}
          {highOpportunityLeads.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-800">
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Oportunidades Quentes para Ligar Agora:</span>
              </span>
              <div className="space-y-1.5">
                {highOpportunityLeads.slice(0, 2).map((lead) => (
                  <div
                    key={lead.id}
                    className="p-2 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center justify-between text-xs"
                  >
                    <span className="font-medium text-white truncate max-w-[180px]">
                      {lead.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-emerald-400 font-mono-numbers">
                        {lead.opportunityScore} pts
                      </span>
                      <button
                        onClick={() => onOpenWhatsApp(lead)}
                        className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Zap</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
