import React, { useState } from 'react';
import {
  Kanban,
  Table as TableIcon,
  Search,
  Plus,
  MessageSquare,
  Calendar,
  DollarSign,
  Download,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronRight,
  Filter
} from 'lucide-react';
import { Lead, LeadStatus } from '../types';

interface KanbanViewProps {
  leads: Lead[];
  onUpdateStatus: (leadId: string, status: LeadStatus) => void;
  onOpenLead: (lead: Lead) => void;
  onOpenWhatsApp: (lead: Lead) => void;
  onAddManualLead: () => void;
  onExportCSV: () => void;
}

const STAGES: { id: LeadStatus; label: string; color: string; bg: string }[] = [
  { id: 'novo', label: 'Novo', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  { id: 'contatado', label: 'Contatado', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  { id: 'respondeu', label: 'Respondeu', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  { id: 'qualificado', label: 'Qualificado', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  { id: 'convertido', label: 'Convertido', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { id: 'perdido', label: 'Perdido', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
];

export const KanbanView: React.FC<KanbanViewProps> = ({
  leads,
  onUpdateStatus,
  onOpenLead,
  onOpenWhatsApp,
  onAddManualLead,
  onExportCSV,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<string>('all');

  const todayStr = new Date().toISOString().split('T')[0];

  // Filtra leads por pesquisa e segmento
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.segment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.phone && lead.phone.includes(searchQuery));

    const matchesSegment = selectedSegment === 'all' || lead.segment === selectedSegment;

    return matchesSearch && matchesSegment;
  });

  const segments = Array.from(new Set(leads.map((l) => l.segment))).filter(Boolean);

  const getNextStage = (current: LeadStatus): LeadStatus | null => {
    const order: LeadStatus[] = ['novo', 'contatado', 'respondeu', 'qualificado', 'convertido'];
    const idx = order.indexOf(current);
    if (idx >= 0 && idx < order.length - 1) return order[idx + 1];
    return null;
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4 lg:px-8 py-6">
      {/* Barra de Ferramentas Superior */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-wrap items-center gap-3">
          {/* Seletor de Modo: Kanban vs Tabela */}
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Tabela</span>
            </button>
          </div>

          {/* Filtro de Ramo */}
          <select
            value={selectedSegment}
            onChange={(e) => setSelectedSegment(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none focus:border-blue-500"
          >
            <option value="all">Todos os Ramos ({leads.length})</option>
            {segments.map((seg) => (
              <option key={seg} value={seg}>
                {seg}
              </option>
            ))}
          </select>
        </div>

        {/* Busca e Ações Primárias */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar no funil..."
              className="bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none w-48 sm:w-56"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>

          <button
            onClick={onExportCSV}
            title="Exportar base completa para CSV"
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={onAddManualLead}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm shadow-blue-600/30"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Novo Lead</span>
          </button>
        </div>
      </div>

      {/* Visualização Kanban */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 items-start">
          {STAGES.map((stage) => {
            const stageLeads = filteredLeads.filter((l) => l.status === stage.id);
            const stageTotalValue = stageLeads.reduce((acc, l) => acc + (l.dealValue || 0), 0);

            return (
              <div
                key={stage.id}
                className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3 flex flex-col min-h-[500px]"
              >
                {/* Cabeçalho da Coluna */}
                <div className="pb-3 border-b border-slate-800 mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold tracking-tight ${stage.color}`}>
                      {stage.label}
                    </span>
                    <span className="text-[11px] font-mono-numbers px-1.5 py-0.5 rounded-md bg-slate-950 text-slate-400 border border-slate-800">
                      {stageLeads.length}
                    </span>
                  </div>
                  {stageTotalValue > 0 && (
                    <span className="text-[10px] text-slate-500 font-mono-numbers">
                      R$ {stageTotalValue.toLocaleString('pt-BR')}
                    </span>
                  )}
                </div>

                {/* Lista de Cards */}
                <div className="space-y-2.5 flex-1">
                  {stageLeads.length === 0 ? (
                    <div className="py-10 text-center text-xs text-slate-600 border border-dashed border-slate-800/60 rounded-xl">
                      Nenhum lead
                    </div>
                  ) : (
                    stageLeads.map((lead) => {
                      const nextStage = getNextStage(lead.status);
                      const isFollowUpToday = lead.nextFollowUpDate === todayStr;
                      const isOverdue = lead.nextFollowUpDate && lead.nextFollowUpDate < todayStr;

                      return (
                        <div
                          key={lead.id}
                          className="bg-slate-950/90 border border-slate-800/90 rounded-xl p-3.5 shadow-sm hover:border-slate-700 transition flex flex-col justify-between group"
                        >
                          <div>
                            {/* Topo do Card */}
                            <div className="flex items-start justify-between gap-1.5 mb-1.5">
                              <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                                {lead.segment}
                              </span>
                              <span
                                title="Opportunity Score"
                                className={`text-[10px] font-bold font-mono-numbers px-1.5 py-0.5 rounded ${
                                  lead.opportunityScore >= 80
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-blue-500/10 text-blue-400'
                                }`}
                              >
                                {lead.opportunityScore} pts
                              </span>
                            </div>

                            {/* Nome do Lead */}
                            <button
                              type="button"
                              onClick={() => onOpenLead(lead)}
                              className="text-xs font-bold text-left text-white group-hover:text-blue-300 transition block truncate w-full mb-1 cursor-pointer"
                            >
                              {lead.name}
                            </button>

                            <p className="text-[11px] text-slate-400 truncate mb-2">
                              {lead.city}
                            </p>

                            {/* Alerta de Retorno / Follow-up */}
                            {lead.nextFollowUpDate && (
                              <div
                                className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg mb-2 font-mono-numbers ${
                                  isOverdue
                                    ? 'bg-rose-950/50 text-rose-300 border border-rose-800/50'
                                    : isFollowUpToday
                                    ? 'bg-amber-950/50 text-amber-300 border border-amber-800/50'
                                    : 'bg-slate-900 text-slate-400'
                                }`}
                              >
                                <Calendar className="w-3 h-3 shrink-0" />
                                <span>
                                  {isFollowUpToday
                                    ? 'Retorno Hoje'
                                    : isOverdue
                                    ? `Atrasado (${lead.nextFollowUpDate})`
                                    : `Retorno: ${lead.nextFollowUpDate}`}
                                </span>
                              </div>
                            )}

                            {lead.dealValue ? (
                              <div className="text-[11px] font-semibold text-emerald-400 font-mono-numbers mb-2">
                                R$ {lead.dealValue.toLocaleString('pt-BR')}
                              </div>
                            ) : null}
                          </div>

                          {/* Rodapé do Card com Ações */}
                          <div className="pt-2 border-t border-slate-850 flex items-center justify-between gap-1">
                            <button
                              type="button"
                              onClick={() => onOpenWhatsApp(lead)}
                              className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition cursor-pointer"
                              title="Falar no WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => onOpenLead(lead)}
                                className="text-[10px] text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800 cursor-pointer"
                              >
                                Ficha
                              </button>

                              {nextStage && (
                                <button
                                  type="button"
                                  onClick={() => onUpdateStatus(lead.id, nextStage)}
                                  title={`Avançar para ${nextStage}`}
                                  className="p-1 text-slate-400 hover:text-blue-400 rounded hover:bg-blue-500/10 transition cursor-pointer"
                                >
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Visualização em Tabela de Alta Densidade */}
      {viewMode === 'table' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Empresa / Negócio</th>
                  <th className="py-3 px-4">Ramo</th>
                  <th className="py-3 px-4">Cidade</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Score</th>
                  <th className="py-3 px-4">Telefone</th>
                  <th className="py-3 px-4">Próximo Passo</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-slate-800/30 transition cursor-pointer"
                    onClick={() => onOpenLead(lead)}
                  >
                    <td className="py-3 px-4 font-semibold text-white">
                      <div className="truncate max-w-[200px]">{lead.name}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{lead.segment}</td>
                    <td className="py-3 px-4 text-slate-400">{lead.city}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-slate-800 text-slate-300">
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono-numbers font-bold">
                      <span
                        className={
                          lead.opportunityScore >= 80 ? 'text-emerald-400' : 'text-blue-400'
                        }
                      >
                        {lead.opportunityScore}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono-numbers text-slate-300">
                      {lead.phone || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {lead.nextFollowUpDate || 'Sem data'}
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onOpenWhatsApp(lead)}
                        className="p-1.5 rounded-lg bg-emerald-600/15 text-emerald-400 hover:bg-emerald-600 hover:text-white transition cursor-pointer"
                        title="Falar no WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
