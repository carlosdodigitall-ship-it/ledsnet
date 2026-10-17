import React, { useState } from 'react';
import { KeyRound, ShieldCheck, ArrowRight, Lock, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface KeyModalProps {
  onUnlock: (key: string) => void;
  isOpen: boolean;
}

export const KeyModal: React.FC<KeyModalProps> = ({ onUnlock, isOpen }) => {
  const [inputKey, setInputKey] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const key = inputKey.trim();
    if (!key) {
      setError('Por favor, informe a chave de acesso privada.');
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      const result = await api.validateKey(key);
      if (result.valid) {
        onUnlock(key);
      } else {
        setError(result.error || 'Chave de acesso incorreta. Verifique a variável ACCESS_KEY no servidor.');
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao conectar ao servidor para validar a chave.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleUseDemo = async () => {
    const demoKey = 'LEDS-PRO-2026';
    setInputKey(demoKey);
    setIsValidating(true);
    setError('');

    try {
      const result = await api.validateKey(demoKey);
      if (result.valid) {
        onUnlock(demoKey);
      } else {
        setError('A chave padrão LEDS-PRO-2026 foi alterada no servidor. Insira a sua chave personalizada.');
      }
    } catch {
      onUnlock(demoKey);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        {/* Glow de fundo */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 mb-4">
            <KeyRound className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">LedsNet</h2>
          <p className="text-sm text-slate-400 mt-1">
            Acesso privado ao painel de prospecção comercial
          </p>
        </div>

        <div className="bg-slate-850/80 rounded-xl p-3 border border-slate-800 text-xs text-slate-350 mb-6 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            Segurança Zero-Trust: O sistema não utiliza login de múltiplos usuários. Todo acesso aos dados do Firestore é validado pela sua chave privada definida no servidor.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Chave de Acesso Privada
            </label>
            <div className="relative">
              <input
                type="text"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="Ex: LEDS-PRO-2026"
                disabled={isValidating}
                className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition font-mono-numbers disabled:opacity-50"
                autoFocus
              />
              <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5 pointer-events-none" />
            </div>
            {error && (
              <div className="flex items-center gap-1.5 text-xs text-rose-400 mt-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isValidating}
            className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            {isValidating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Validando Chave...</span>
              </>
            ) : (
              <>
                <span>Desbloquear Painel</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-800/80 text-center">
          <button
            type="button"
            onClick={handleUseDemo}
            disabled={isValidating}
            className="text-xs text-blue-400 hover:text-blue-300 transition underline underline-offset-4 cursor-pointer"
          >
            Usar Chave Padrão (LEDS-PRO-2026)
          </button>
        </div>
      </div>
    </div>
  );
};
