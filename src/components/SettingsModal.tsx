import React, { useState } from 'react';
import {
  X,
  KeyRound,
  Download,
  Upload,
  LogOut,
  Shield,
  Copy,
  Check,
  FileSpreadsheet,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';
import { MessageTemplate, Lead } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessKey: string;
  onUpdateKey: (newKey: string) => void;
  onLogout: () => void;
  onExportCSV: () => void;
  leads: Lead[];
  onImportBackup: (importedLeads: Lead[]) => void;
  templates: MessageTemplate[];
  onUpdateTemplates: (updated: MessageTemplate[]) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  accessKey,
  onUpdateKey,
  onLogout,
  onExportCSV,
  leads,
  onImportBackup,
  templates,
  onUpdateTemplates,
}) => {
  const [keyInput, setKeyInput] = useState(accessKey);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'access' | 'templates' | 'backup'>('access');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?key=${encodeURIComponent(accessKey)}` : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;
    onUpdateKey(keyInput.trim());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(leads, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_ledsnet_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportBackup(parsed);
          alert(`Backup importado com sucesso! ${parsed.length} leads restaurados.`);
          onClose();
        } else {
          alert('Formato de arquivo inválido. Deve ser um array de leads.');
        }
      } catch (err) {
        alert('Erro ao ler arquivo JSON de backup.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Configurações & Segurança
              </h3>
              <p className="text-xs text-slate-400">
                Chave de acesso privado, backups e templates de abordagem
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

        {/* Abas */}
        <div className="flex items-center border-b border-slate-800 mb-5 gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('access')}
            className={`pb-2.5 border-b-2 transition cursor-pointer ${
              activeTab === 'access'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Acesso & Link Privado
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`pb-2.5 border-b-2 transition cursor-pointer ${
              activeTab === 'templates'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Templates de Mensagens
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`pb-2.5 border-b-2 transition cursor-pointer ${
              activeTab === 'backup'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Exportação & Backup
          </button>
        </div>

        {/* Aba 1: Acesso Privado */}
        {activeTab === 'access' && (
          <div className="space-y-5">
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-350">
              <span className="font-semibold text-white block mb-1">Como funciona o acesso do LedsNet:</span>
              <span>
                Você e sua equipe não precisam de usuário nem senha. O link privado abaixo concede acesso instantâneo ao painel. Guarde-o ou compartilhe apenas com sua equipe comercial.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider mb-1.5">
                Link de Acesso Direto com Token
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={currentUrl}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400 font-mono-numbers outline-none select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveKey} className="space-y-3 pt-2 border-t border-slate-800">
              <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider">
                Alterar Chave Mestra
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="Defina uma chave personalizada..."
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono-numbers"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer shrink-0"
                >
                  Salvar Chave
                </button>
              </div>
              {savedSuccess && (
                <p className="text-xs text-emerald-400">Chave de acesso atualizada com sucesso!</p>
              )}
            </form>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">Sair deste navegador com segurança:</span>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Deseja encerrar a sessão neste navegador? Você precisará inserir a chave para entrar novamente.')) {
                    onLogout();
                    onClose();
                  }
                }}
                className="px-3 py-1.5 rounded-lg border border-rose-800/60 text-rose-400 hover:bg-rose-950/40 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Encerrar Sessão</span>
              </button>
            </div>
          </div>
        )}

        {/* Aba 2: Templates WhatsApp */}
        {activeTab === 'templates' && (
          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
            <p className="text-xs text-slate-400">
              Personalize os textos pré-definidos de abordagem rápida. Você pode usar as variáveis <code>{'{{empresa}}'}</code>, <code>{'{{cidade}}'}</code> e <code>{'{{ramo}}'}</code>.
            </p>
            {templates.map((tpl, idx) => (
              <div key={tpl.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{tpl.title}</span>
                  <span className="text-[10px] text-slate-500 uppercase font-mono-numbers">{tpl.category}</span>
                </div>
                <textarea
                  rows={4}
                  value={tpl.text}
                  onChange={(e) => {
                    const newTemplates = [...templates];
                    newTemplates[idx] = { ...tpl, text: e.target.value };
                    onUpdateTemplates(newTemplates);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-blue-500 resize-none"
                />
              </div>
            ))}
          </div>
        )}

        {/* Aba 3: Exportação e Backup */}
        {activeTab === 'backup' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Exportar Base de Leads (CSV)</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Planilha completa com telefones, notas, histórico, status e scores.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onExportCSV}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar CSV</span>
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-blue-400" />
                  <span>Backup Completo em JSON</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Gera um arquivo de segurança contendo todos os dados para restaurar a qualquer momento.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Salvar Arquivo JSON</span>
                </button>

                <label className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Restaurar JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
