import React, { useState, useEffect } from 'react';
import { X, Send, MessageSquare, Copy, Check, Sparkles, AlertTriangle, ShieldAlert, Loader2, ExternalLink } from 'lucide-react';
import { Lead, MessageTemplate } from '../types';
import { api } from '../services/api';

interface WhatsAppModalProps {
  lead: Lead | null;
  templates: MessageTemplate[];
  isOpen: boolean;
  onClose: () => void;
  onSent: (leadId: string, messageText: string) => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  lead,
  templates,
  isOpen,
  onClose,
  onSent,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [messageText, setMessageText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (templates.length > 0 && !selectedTemplateId) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [templates, selectedTemplateId]);

  useEffect(() => {
    if (!lead || !templates.length) return;
    const currentTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];
    if (currentTemplate) {
      const templateContent = currentTemplate.texto || currentTemplate.text || '';
      const leadName = lead.nome || lead.name || '';
      const leadSegment = lead.ramo || lead.segment || '';
      const leadCity = lead.regiao || lead.city || 'sua região';

      // Substitui as variáveis oficiais {nome}, {empresa} e {bairro}
      const replaced = templateContent
        .replace(/\{empresa\}|\{\{empresa\}\}/gi, leadName)
        .replace(/\{nome\}|\{\{nome\}\}/gi, leadName)
        .replace(/\{ramo\}|\{\{ramo\}\}/gi, leadSegment)
        .replace(/\{bairro\}|\{\{bairro\}\}|\{cidade\}|\{\{cidade\}\}/gi, leadCity);

      setMessageText(replaced);
    }
  }, [selectedTemplateId, lead, templates]);

  if (!isOpen || !lead) return null;

  const isOptOut = lead.status === 'nao_contatar';
  const leadDisplayName = lead.nome || lead.name;
  const leadPhone = lead.telefone || lead.phone || lead.whatsapp || '';

  // Sanitiza número para o formato E.164 (ex: 5571999999999)
  const cleanPhone = leadPhone.replace(/\D/g, '');

  // Envio Assistido via Backend (Evolution API)
  const handleConfirmSendBackend = async () => {
    if (isOptOut) {
      alert('Envio bloqueado: Este lead solicitou NÃO ser contatado.');
      return;
    }

    setIsSending(true);
    setFeedback(null);

    try {
      const result = await api.sendWhatsAppMessage(lead.id, messageText);
      setFeedback({
        type: 'success',
        message: `Mensagem enviada com sucesso! Delay aplicado: ${result.appliedDelaySeconds || 15}s. Cota hoje: ${result.todayCount}/${result.limiteDiario}.`
      });
      onSent(lead.id, messageText);
      setIsConfirmOpen(false);
      setTimeout(() => {
        onClose();
        setFeedback(null);
      }, 1800);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Falha ao despachar mensagem pelo WhatsApp.'
      });
      setIsConfirmOpen(false);
    } finally {
      setIsSending(false);
    }
  };

  // Envio alternativo direto via Click-to-Chat no navegador
  const handleOpenWhatsAppWeb = () => {
    if (isOptOut) {
      alert('Envio bloqueado: Este lead solicitou NÃO ser contatado.');
      return;
    }
    const encoded = encodeURIComponent(messageText);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encoded}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    onSent(lead.id, messageText);
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Abordagem no WhatsApp (Evolution API)
              </h3>
              <p className="text-xs text-slate-400">
                {leadDisplayName} · +{cleanPhone}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ALERTA DE OPT-OUT LGPD */}
        {isOptOut && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">Contato Bloqueado (LGPD)</strong>
              Este cliente respondeu "SAIR" ou solicitou remoção de contato. Todo disparo para este lead está estritamente bloqueado.
            </div>
          </div>
        )}

        {/* Feedback de Envio */}
        {feedback && (
          <div className={`mb-4 p-3 rounded-xl border text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
          }`}>
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Seletor de Modelo */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider mb-2">
            Selecione o Modelo de Mensagem
          </label>
          <div className="grid grid-cols-1 gap-2">
            {templates.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setSelectedTemplateId(tpl.id)}
                className={`text-left p-2.5 rounded-xl text-xs font-medium border transition cursor-pointer flex items-center justify-between ${
                  selectedTemplateId === tpl.id
                    ? 'bg-blue-600/15 border-blue-500 text-blue-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <span>{tpl.titulo || tpl.title}</span>
                {selectedTemplateId === tpl.id && <Check className="w-3.5 h-3.5 text-blue-400" />}
              </button>
            ))}
          </div>
        </div>

        {/* Editor da Mensagem */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-350 uppercase tracking-wider">
              Mensagem Personalizada ({`{nome}, {empresa}, {bairro}`})
            </label>
            <span className="text-[11px] text-slate-500 font-mono-numbers">
              {messageText.length} caracteres
            </span>
          </div>
          <textarea
            rows={5}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            disabled={isOptOut}
            className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none transition resize-none font-sans leading-relaxed disabled:opacity-50"
            placeholder="Digite sua mensagem de abordagem..."
          />
        </div>

        {/* Modal de Confirmação Manual Obrigatória */}
        {isConfirmOpen ? (
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/50 mb-4 space-y-3">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>Confirmação Manual Obrigatória</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-normal">
              Você confirma o envio desta mensagem individual para <strong>{leadDisplayName}</strong> (+{cleanPhone})? O sistema aplicará intervalo randômico de segurança. Disparos em lote automáticos são proibidos.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmSendBackend}
                disabled={isSending}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
              >
                {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Confirmar e Despachar</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleCopy}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar Texto'}</span>
            </button>

            <div className="flex items-center gap-2">
              {/* Botão de WhatsApp Web Direto */}
              <button
                type="button"
                onClick={handleOpenWhatsAppWeb}
                disabled={isOptOut}
                title="Abrir diretamente no WhatsApp Web ou App"
                className="py-2.5 px-3 rounded-xl border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition disabled:opacity-40"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir WhatsApp Web</span>
              </button>

              {/* Botão de Envio via Evolution API com Confirmação */}
              <button
                type="button"
                onClick={() => setIsConfirmOpen(true)}
                disabled={isOptOut || isSending}
                className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-600/20 disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
                <span>Enviar (Evolution API)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
