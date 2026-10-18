import React, { useState } from 'react';
import {
  X,
  Phone,
  MessageSquare,
  MapPin,
  ExternalLink,
  Calendar,
  Clock,
  Trash2,
  DollarSign,
  FileText,
  History,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { Lead, LeadStatus, Interaction } from '../types';

interface LeadDetailModalProps {
  lead: Lead | null;
  interactions: Interaction[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (leadId: string, status: LeadStatus) => void;
  onUpdateLead: (updated: Lead) => void;
  onDeleteLead: (leadId: string) => void;
  onOpenWhatsApp: (lead: Lead) => void;
  onAddInteraction: (leadId: string, type: 'note' | 'call' | 'whatsapp', content: string) => void;
  onScheduleFollowUp: (leadId: string, date: string, note: string) => void;
}

const STATUS_LABELS: Record<LeadStatus, string> = {
  novo: 'Novo Lead',
  contatado: 'Contatado',
  respondeu: 'Respondeu',
  qualificado: 'Qualificado',
  convertido: 'Convertido',
  perdido: 'Perdido',
  nao_contatar: 'Não contatar',
};

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead,
  interactions,
  isOpen,
  onClose,
  onUpdateStatus,
  onUpdateLead,
  onDeleteLead,
  onOpenWhatsApp,
  onAddInteraction,
  onScheduleFollowUp,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'schedule'>('info');
  const [newNote, setNewNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState(lead?.nextFollowUpDate || '');
  const [followUpNote, setFollowUpNote] = useState(lead?.nextFollowUpNote || '');
  const [dealValue, setDealValue] = useState<number>(lead?.dealValue || 0);

  if (!isOpen || !lead) return null;

  const leadInteractions = interactions.filter((i) => i.leadId === lead.id);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    onAddInteraction(lead.id, 'note', newNote.trim());
    setNewNote('');
  };

  const handleSaveFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    onScheduleFollowUp(lead.id, followUpDate, followUpNote);
    alert('Follow-up agendado e registrado na lista de tarefas!');
  };

  const handleDealValueBlur = () => {
    onUpdateLead({
      ...lead,
      dealValue: Number(dealValue) || 0,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-slate-950/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-blue-400 font-mono-numbers">
                Score {lead.opportunityScore}/100
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400">{lead.segment}</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">{lead.name}</h2>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>{lead.address} · {lead.city}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Seletor de Fase do Funil */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-900/50 flex items-center justify-between gap-3 overflow-x-auto">
          <span className="text-xs font-semibold text-slate-400 shrink-0 uppercase tracking-wider">
            Fase Atual:
          </span>
          <div className="flex items-center gap-1.5">
            {(['novo', 'contatado', 'respondeu', 'qualificado', 'convertido', 'perdido'] as LeadStatus[]).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => onUpdateStatus(lead.id, st)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition whitespace-nowrap cursor-pointer ${
                  lead.status === st
                    ? st === 'convertido'
                      ? 'bg-emerald-600 text-white'
                      : st === 'perdido'
                      ? 'bg-rose-900/80 text-rose-200'
                      : 'bg-blue-600 text-white'
                    : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {STATUS_LABELS[st]}
              </button>
            ))}
          </div>
        </div>

        {/* Abas de Navegação Interna */}
        <div className="flex items-center border-b border-slate-800 px-5 gap-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`py-3 border-b-2 transition cursor-pointer ${
              activeTab === 'info'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Ficha do Lead
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Histórico de Contatos</span>
            <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded-full font-mono-numbers">
              {leadInteractions.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`py-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'schedule'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Agendar Retorno</span>
            {lead.nextFollowUpDate && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            )}
          </button>
        </div>

        {/* Conteúdo das Abas */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
                  <span className="text-[11px] font-medium text-slate-400 block mb-1">Telefone Principal</span>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white font-mono-numbers">{lead.phone || 'Não informado'}</span>
                    <a
                      href={`tel:${lead.phone}`}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                      title="Ligar"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
                  <span className="text-[11px] font-medium text-slate-400 block mb-1">Presença Digital (Site)</span>
                  {lead.website ? (
                    <a
                      href={lead.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:underline flex items-center gap-1 truncate"
                    >
                      <span className="truncate">{lead.website}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-xs text-emerald-400 font-medium">Sem site oficial registrado</span>
                  )}
                </div>

                <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
                  <span className="text-[11px] font-medium text-slate-400 block mb-1">Avaliação Google</span>
                  <div className="text-xs text-slate-200 flex items-center gap-1.5">
                    <span className="text-amber-400 font-bold font-mono-numbers">★ {lead.rating > 0 ? lead.rating.toFixed(1) : 'Sem nota'}</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-400 font-mono-numbers">{lead.reviewCount} avaliações</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
                  <span className="text-[11px] font-medium text-slate-400 block mb-1">Valor da Oportunidade (R$)</span>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-xs text-slate-500 font-semibold">R$</span>
                    <input
                      type="number"
                      value={dealValue}
                      onChange={(e) => setDealValue(parseFloat(e.target.value) || 0)}
                      onBlur={handleDealValueBlur}
                      placeholder="0.00"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-2 py-1 text-xs text-white font-mono-numbers outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {lead.mapsUrl && (
                <div className="text-right">
                  <a
                    href={lead.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    <span>Ver ficha no Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Anotações Gerais */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Anotações da Empresa
                </label>
                <textarea
                  value={lead.notes}
                  onChange={(e) => onUpdateLead({ ...lead, notes: e.target.value, updatedAt: new Date().toISOString() })}
                  rows={3}
                  placeholder="Ex: Responsável é o Sr. Alberto. Estão insatisfeitos com a empresa atual de ar condicionado..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              {/* Form de Nova Nota */}
              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Registrar nova anotação ou resumo de ligação..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl cursor-pointer"
                >
                  Registrar
                </button>
              </form>

              {/* Linha do Tempo */}
              <div className="space-y-2.5">
                {leadInteractions.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">Nenhum contato registrado ainda.</p>
                ) : (
                  leadInteractions.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-start gap-3"
                    >
                      <div className="p-1.5 rounded-lg bg-slate-800 text-slate-400 shrink-0 mt-0.5">
                        {item.type === 'whatsapp' ? (
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                        ) : item.type === 'call' ? (
                          <Phone className="w-3.5 h-3.5 text-blue-400" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">{item.content}</p>
                        <span className="text-[10px] text-slate-500 font-mono-numbers mt-1 block">
                          {new Date(item.timestamp).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <form onSubmit={handleSaveFollowUp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Data do Próximo Retorno (Follow-up)
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono-numbers"
                  />
                  <Calendar className="w-4 h-4 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Objetivo do Follow-up / Lembrete
                </label>
                <textarea
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  rows={3}
                  placeholder="Ex: Ligar para confirmar se o síndico recebeu a cotação de manutenção preventiva..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl p-3 text-xs text-slate-200 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl cursor-pointer transition shadow-md shadow-blue-600/20"
              >
                Salvar Agendamento na Lista de Tarefas
              </button>
            </form>
          )}
        </div>

        {/* Rodapé da Ficha */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (confirm('Tem certeza que deseja excluir este lead e todos os dados de contato permanentemente (Conformidade LGPD)?')) {
                onDeleteLead(lead.id);
                onClose();
              }
            }}
            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Excluir Lead (LGPD)</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition cursor-pointer"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={() => {
                onOpenWhatsApp(lead);
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-600/30"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Falar no WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
