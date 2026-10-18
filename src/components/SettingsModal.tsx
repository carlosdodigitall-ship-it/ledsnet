import React, { useState } from 'react';
import {
  X,
  Download,
  Upload,
  LogOut,
  Shield,
  FileSpreadsheet,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';
import { MessageTemplate, Lead } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  accessKey: string;
  onClose: () => void;
  onLogout: () => void;
  onExportCSV: () => void;
  leads: Lead[];
  onImportBackup: (importedLeads: Lead[]) => void;
  templates: MessageTemplate[];
  onUpdateTemplates: (updated: MessageTemplate[]) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  accessKey,
  onClose,
  onLogout,
  onExportCSV,
  leads,
  onImportBackup,
  templates,
  onUpdateTemplates,
}) => {
  const [activeTab, setActiveTab] = useState<'access' | 'templates' | 'backup'>('access');

  if (!isOpen) return null;

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
                Conta Firebase, backups e templates de abordagem
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
            Conta Firebase
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

        {/* Aba 1: Segurança Firebase */}
        {activeTab === 'access' && (
          <div className="space-y-5">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
              <span className="font-semibold text-white block mb-2">Autenticação e banco de dados</span>
              <p className="text-sm text-slate-300">
                O acesso é protegido pelo Firebase Authentication. Cada pessoa deve entrar com sua própria conta; um link compartilhado não substitui o login.
              </p>
              <p className="text-xs text-slate-400 mt-3">
                Os leads, tarefas, interações, modelos e configurações ficam no Cloud Firestore, separados por usuário.
              </p>
            </div>
            <div className="flex items-center justify-between gap-3 border border-slate-800 rounded-xl p-3">
              <div>
                <p className="text-xs text-slate-400">Conta conectada</p>
                <p className="text-sm text-white break-all">{accessKey || 'Conta Firebase autenticada'}</p>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Sair
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
