import React, { useState } from 'react';
import { KeyRound, ShieldCheck, ArrowRight, Lock, Loader2, AlertCircle, Mail, UserRound, Eye, EyeOff } from 'lucide-react';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface KeyModalProps {
  onUnlock: () => void;
  isOpen: boolean;
}

export const KeyModal: React.FC<KeyModalProps> = ({ onUnlock, isOpen }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) { setError('Informe seu e-mail.'); return; }
    if (mode !== 'reset' && password.length < 6) { setError('A senha precisa ter pelo menos 6 caracteres.'); return; }
    if (mode === 'register' && !name.trim()) { setError('Informe seu nome.'); return; }

    setBusy(true);
    try {
      if (mode === 'register') {
        const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
        await updateProfile(credential.user, { displayName: name.trim() });
        onUnlock();
      } else if (mode === 'login') {
        await signInWithEmailAndPassword(auth, normalizedEmail, password);
        onUnlock();
      } else {
        await sendPasswordResetEmail(auth, normalizedEmail);
        setNotice('Enviamos um link de recuperação para o e-mail informado.');
      }
    } catch (cause: any) {
      const messages: Record<string, string> = {
        'auth/email-already-in-use': 'Este e-mail já possui uma conta. Entre com sua senha.',
        'auth/invalid-credential': 'E-mail ou senha incorretos.',
        'auth/invalid-email': 'O formato do e-mail é inválido.',
        'auth/weak-password': 'Escolha uma senha com pelo menos 6 caracteres.',
        'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
        'auth/network-request-failed': 'Sem conexão com o serviço de autenticação. Verifique sua internet.',
        'auth/operation-not-allowed': 'Ative E-mail/Senha em Firebase Console → Authentication → Sign-in method.',
      };
      setError(messages[cause?.code] || cause?.message || 'Não foi possível autenticar. Confira a configuração do Firebase Authentication.');
    } finally {
      setBusy(false);
    }
  };

  const heading = mode === 'register' ? 'Crie sua conta' : mode === 'reset' ? 'Recuperar senha' : 'Bem-vindo de volta';
  const subtitle = mode === 'register' ? 'Comece a encontrar oportunidades na sua região.' : mode === 'reset' ? 'Enviaremos um link para redefinir sua senha.' : 'Entre para acessar seu painel de prospecção.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050914]/95 backdrop-blur-xl p-4">
      <div className="w-full max-w-md bg-slate-900/95 border border-slate-700/80 rounded-3xl p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-56 h-56 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-7">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-400/30 text-blue-300 flex items-center justify-center">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">LedsNet</h1>
              <p className="text-xs text-slate-400">Prospecção inteligente de empresas</p>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-white">{heading}</h2>
          <p className="text-sm text-slate-400 mt-1 mb-6">{subtitle}</p>
          <div className="bg-blue-500/5 border border-blue-400/15 rounded-xl p-3 text-xs text-slate-300 mb-5 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Autenticação Firebase. Seus dados de acesso não ficam gravados no navegador como uma chave compartilhada.</span>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nome completo</label>
              <div className="relative"><UserRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" /><input value={name} onChange={e => setName(e.target.value)} autoComplete="name" placeholder="Seu nome" className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none" /></div>
            </div>}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">E-mail</label>
              <div className="relative"><Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" /><input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" placeholder="voce@empresa.com.br" className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none" /></div>
            </div>
            {mode !== 'reset' && <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Senha</label>
              <div className="relative"><Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" /><input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} placeholder="Mínimo de 6 caracteres" className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl pl-10 pr-11 py-3 text-sm text-white outline-none" /><button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} className="absolute right-3 top-3 text-slate-500 hover:text-white">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div>
            </div>}
            {error && <div className="flex items-start gap-2 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3"><AlertCircle className="w-4 h-4 shrink-0" /><span>{error}</span></div>}
            {notice && <div className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">{notice}</div>}
            <button type="submit" disabled={busy} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-60">
              {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Aguarde...</> : <>{mode === 'register' ? 'Criar conta grátis' : mode === 'reset' ? 'Enviar link de recuperação' : 'Entrar na plataforma'} <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
          <div className="flex flex-wrap justify-between gap-3 mt-5 text-xs">
            {mode === 'login' && <><button type="button" onClick={() => { setMode('register'); setError(''); setNotice(''); }} className="text-blue-300 hover:text-blue-200">Criar uma conta</button><button type="button" onClick={() => { setMode('reset'); setError(''); setNotice(''); }} className="text-slate-400 hover:text-white">Esqueci minha senha</button></>}
            {mode !== 'login' && <button type="button" onClick={() => { setMode('login'); setError(''); setNotice(''); }} className="text-blue-300 hover:text-blue-200">Voltar para entrar</button>}
          </div>
        </div>
      </div>
    </div>
  );
};
