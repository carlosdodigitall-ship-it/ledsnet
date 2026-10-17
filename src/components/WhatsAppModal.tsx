import React, { useState, useEffect } from 'react';
import { X, Send, MessageSquare, Copy, Check, Sparkles } from 'lucide-react';
import { Lead, MessageTemplate } from '../types';

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

  useEffect(() => {
    if (templates.length > 0 && !selectedTemplateId) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [templates, selectedTemplateId]);

  useEffect(() => {
    if (!lead || !templates.length) return;
    const currentTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];
    if (currentTemplate) {
      const replaced = currentTemplate.text
        .replace(/\{\{empresa\}\}/g, lead.name)
        .replace(/\{\{nome\}\}/g, lead.name)
        .replace(/\{\{ramo\}\}/g, lead.segment)
        .replace(/\{\{cidade\}\}/g, lead.city || 'sua região');
      setMessageText(replaced);
    }
  }, [selectedTemplateId, lead, templates]);

  if (!isOpen || !lead) return null;

  // Sanitiza número para o formato E.164 (ex: 5571999999999)
  const rawDigits = (lead.whatsapp || lead.phone || '').replace(/\D/g, '');
  const cleanPhone = rawDigits.startsWith('55')
    ? rawDigits
    : rawDigits.length >= 10
    ? `55${rawDigits}`
    : rawDigits;

  const handleSend = () => {
    if (!cleanPhone) {
      alert('Este lead não possui um número de telefone válido registrado.');
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
                Abordagem no WhatsApp
              </h3>
              <p className="text-xs text-slate-400">
                {lead.name} · {lead.phone}
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

        {/* Seletor de Modelo */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider mb-2">
            Selecione o Modelo de Mensagem
          </label>
          <div className="grid grid-cols-1 gap-1.5">
            {templates.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setSelectedTemplateId(tpl.id)}
                className={`text-left px-3 py-2 rounded-xl text-xs font-medium border transition cursor-pointer flex items-center justify-between ${
                  selectedTemplateId === tpl.id
                    ? 'bg-blue-600/15 border-blue-500/40 text-blue-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <span>{tpl.title}</span>
                {selectedTemplateId === tpl.id && (
                  <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Caixa de Edição da Mensagem */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-350 uppercase tracking-wider">
              Mensagem Pronta (Editável)
            </label>
            <button
              type="button"
              onClick={handleCopy}
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copiar texto</span>
                </>
              )}
            </button>
          </div>
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            rows={7}
            className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl p-3 text-xs text-slate-200 leading-relaxed outline-none transition font-sans resize-none"
          />
        </div>

        {/* Rodapé com Ações */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
          <span className="text-xs text-slate-400 font-mono-numbers">
            Destino: +{cleanPhone || 'Não configurado'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-white transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleSend}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Abrir WhatsApp Web</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
