import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
  createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail,
  signInWithEmailAndPassword, signInWithPopup, updateProfile, signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Eye, EyeOff, KeyRound, Mail, ShieldCheck, Sparkles, Target, Users, Zap } from 'lucide-react';
import { auth, db, googleProvider, isFirebaseConfigured } from '../lib/firebase';
import { useAuth } from './AuthContext';
import './auth.css';

type Screen = 'entrar' | 'criar-conta' | 'verificar-email' | 'recuperar-senha' | 'configurar-conta' | 'termos' | 'privacidade';
const friendlyErrors: Record<string, string> = {
  'auth/invalid-email': 'Confira o formato do e-mail e tente novamente.',
  'auth/missing-password': 'Digite sua senha para continuar.',
  'auth/weak-password': 'Sua senha precisa ter pelo menos 8 caracteres, incluindo uma letra e um número.',
  'auth/email-already-in-use': 'Não foi possível criar a conta com esses dados. Tente entrar ou recuperar sua senha.',
  'auth/invalid-credential': 'E-mail ou senha incorretos. Confira os dados e tente novamente.',
  'auth/user-not-found': 'E-mail ou senha incorretos. Confira os dados e tente novamente.',
  'auth/wrong-password': 'E-mail ou senha incorretos. Confira os dados e tente novamente.',
  'auth/too-many-requests': 'Muitas tentativas foram feitas. Por segurança, o acesso foi temporariamente limitado. Aguarde alguns minutos e tente novamente.',
  'auth/network-request-failed': 'Não foi possível conectar. Verifique sua internet e tente novamente.',
  'auth/popup-closed-by-user': 'A janela do Google foi fechada antes de concluir o acesso.',
  'auth/popup-blocked': 'Seu navegador bloqueou a janela do Google. Permita pop-ups e tente novamente.',
  'auth/operation-not-allowed': 'Este método de acesso ainda não está ativado no Firebase. Ative e-mail/senha e Google no Console do Firebase.',
  'auth/unauthorized-domain': 'Este domínio ainda não está autorizado no Firebase Authentication.',
  'auth/invalid-api-key': 'A configuração pública do Firebase está inválida. Revise as variáveis VITE_FIREBASE_*.',
  'auth/requires-recent-login': 'Por segurança, saia da conta e entre novamente antes de repetir esta ação.',
  'auth/user-disabled': 'Esta conta foi desativada. Entre em contato com o suporte.',
  'auth/expired-action-code': 'Este link expirou. Solicite um novo e-mail e tente novamente.',
  'auth/invalid-action-code': 'Este link não é válido ou já foi utilizado. Solicite um novo link.',
};
function errorMessage(error: unknown) {
  const code = (error as { code?: string })?.code || '';
  const message = (error as { message?: string })?.message || '';
  if (message === 'terms-required') return 'Aceite os Termos de Uso e a Política de Privacidade para criar sua conta.';
  if (message === 'password-mismatch') return 'As senhas digitadas não coincidem.';
  return friendlyErrors[code] || 'Não foi possível concluir a operação. Tente novamente em instantes.';
}
function go(path: string) { window.location.assign(path); }
function Brand() {
  return <a className="auth-logo" href="/" aria-label="LedsNet — página inicial"><span className="leds">Leds</span><span className="net">Net</span><span className="led" aria-hidden="true" /></a>;
}
function Shell({ children, note }: { children: ReactNode; note?: ReactNode }) {
  return <div className="auth-root"><header className="auth-top"><Brand />{note && <div className="auth-top-note">{note}</div>}</header><main className="auth-main"><section className="auth-story"><div className="auth-eyebrow"><Sparkles size={14} /> Prospecção mais inteligente</div><h1>Transforme buscas em <span>novas oportunidades.</span></h1><p>Organize seus leads, acompanhe conversas e construa seu funil comercial em um único lugar.</p><div className="auth-benefits"><div className="auth-benefit"><span className="auth-benefit-icon"><Target size={17}/></span> Encontre empresas por região e segmento</div><div className="auth-benefit"><span className="auth-benefit-icon"><Zap size={17}/></span> Priorize oportunidades com inteligência</div><div className="auth-benefit"><span className="auth-benefit-icon"><ShieldCheck size={17}/></span> Seus dados ficam separados por conta</div></div></section><section className="auth-card">{children}</section></main><footer className="auth-footer-bar"><a href="/termos">Termos de Uso</a><a href="/privacidade">Privacidade</a><span>© {new Date().getFullYear()} LedsNet</span></footer></div>;
}
function Alert({ children, success = false }: { children: ReactNode; success?: boolean }) {
  return <div className={'auth-alert ' + (success ? 'auth-alert-success' : 'auth-alert-error')} role={success ? 'status' : 'alert'}>{children}</div>;
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="auth-field"><label>{label}</label>{children}</div>;
}
function PasswordField({ label, value, onChange, placeholder = 'Mínimo de 8 caracteres', autoComplete }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; autoComplete?: string }) {
  const [visible, setVisible] = useState(false);
  return <Field label={label}><div className="auth-input-wrap"><input type={visible ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete} required /><button className="auth-eye" type="button" onClick={() => setVisible(v => !v)} aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}>{visible ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></Field>;
}
function GoogleButton({ busy, onClick }: { busy: boolean; onClick: () => void }) {
  return <button type="button" className="auth-btn auth-btn-google" disabled={busy} onClick={onClick}><svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 37.08 46.98 31.36 46.98 24.55z"/><path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>{busy ? 'Conectando...' : 'Continuar com Google'}</button>;
}
async function afterSignIn() {
  const user = auth.currentUser;
  if (!user) return go('/entrar');
  await user.reload();
  if (!user.emailVerified) return go('/verificar-email');
  const snap = await getDoc(doc(db, 'users', user.uid));
  go(snap.exists() && snap.data().onboardingCompleted ? '/painel' : '/configurar-conta');
}
async function googleSignIn(setError: (message: string) => void, setBusy: (busy: boolean) => void) {
  setError(''); setBusy(true);
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const profileRef = doc(db, 'users', user.uid);
    const profile = await getDoc(profileRef);
    if (!profile.exists()) await setDoc(profileRef, {
      uid: user.uid, ownerId: user.uid, name: user.displayName || '', email: user.email || '',
      photoURL: user.photoURL || null, onboardingCompleted: false, createdAt: new Date().toISOString(),
    });
    await afterSignIn();
  } catch (error) { setError(errorMessage(error)); setBusy(false); }
}
export function AuthScreen({ screen }: { screen: Screen }) {
  const { user, refreshUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [company, setCompany] = useState('');
  const [industry, setIndustry] = useState('');
  const [otherIndustry, setOtherIndustry] = useState('');
  const [region, setRegion] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [evolutionUrl, setEvolutionUrl] = useState('');
  const [evolutionInstance, setEvolutionInstance] = useState('');
  const passwordRules = useMemo(() => ({ length: password.length >= 8, letter: /[A-Za-zÀ-ÿ]/.test(password), number: /\d/.test(password) }), [password]);
  const strong = passwordRules.length && passwordRules.letter && passwordRules.number;
  const passwordScore = [passwordRules.length, passwordRules.letter, passwordRules.number].filter(Boolean).length;
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);
  useEffect(() => { if (user?.email) setEmail(user.email); }, [user?.email]);
  useEffect(() => { if (screen === 'verificar-email') setCooldown(60); }, [screen]);

  if (!isFirebaseConfigured && !['termos', 'privacidade'].includes(screen)) {
    return <Shell><div className="auth-success-icon"><KeyRound size={27}/></div><h2>Configuração necessária</h2><p className="auth-subtitle">O código de autenticação está preparado, mas as variáveis públicas do Firebase ainda não estão configuradas neste ambiente.</p><Alert>Configure VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID e os demais valores no ambiente de publicação.</Alert><p className="auth-footer">Nenhuma credencial foi inventada ou exposta no navegador.</p></Shell>;
  }

  const submit = async (event: FormEvent, action: () => Promise<void>) => {
    event.preventDefault(); setError(''); setNotice(''); setBusy(true);
    try { await action(); } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  };
  const handleGoogle = () => { void googleSignIn(setError, setBusy); };

  if (screen === 'entrar') return <Shell note={<>Ainda não tem conta? <a href="/criar-conta">Criar conta</a></>}><h2>Boas-vindas de volta</h2><p className="auth-subtitle">Entre para continuar sua prospecção no LedsNet.</p>{error && <Alert>{error}</Alert>}<form className="auth-form" onSubmit={e => submit(e, async () => { await signInWithEmailAndPassword(auth, email.trim(), password); await afterSignIn(); })}><Field label="E-mail"><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@empresa.com.br" autoComplete="email" required /></Field><PasswordField label="Senha" value={password} onChange={setPassword} placeholder="Sua senha" autoComplete="current-password"/><div className="auth-row"><span></span><a className="auth-link" href="/recuperar-senha">Esqueci minha senha</a></div><button className="auth-btn auth-btn-primary" disabled={busy}>{busy ? 'Entrando...' : 'Entrar'} <ArrowRight size={16}/></button><div className="auth-divider">ou</div><GoogleButton busy={busy} onClick={handleGoogle}/></form><p className="auth-footer">Ao continuar, você concorda com nossos <a href="/termos">Termos de Uso</a> e nossa <a href="/privacidade">Política de Privacidade</a>.</p></Shell>;

  if (screen === 'criar-conta') return <Shell note={<>Já tem conta? <a href="/entrar">Entrar</a></>}><h2>Crie sua conta</h2><p className="auth-subtitle">Comece a organizar suas oportunidades comerciais.</p>{error && <Alert>{error}</Alert>}<form className="auth-form" onSubmit={e => submit(e, async () => { if (!accepted) throw new Error('terms-required'); if (!strong) throw new Error('auth/weak-password'); if (password !== confirmPassword) throw new Error('password-mismatch'); const credential = await createUserWithEmailAndPassword(auth, email.trim(), password); await updateProfile(credential.user, { displayName: name.trim() }); await setDoc(doc(db, 'users', credential.user.uid), { uid: credential.user.uid, ownerId: credential.user.uid, name: name.trim(), email: email.trim(), marketingOptIn: marketing, termsAcceptedAt: new Date().toISOString(), onboardingCompleted: false, createdAt: new Date().toISOString() }); await sendEmailVerification(credential.user, { url: window.location.origin + '/verificar-email', handleCodeInApp: false }); go('/verificar-email'); })}><Field label="Nome completo"><input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome e sobrenome" autoComplete="name" required /></Field><Field label="E-mail"><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@empresa.com.br" autoComplete="email" required /></Field><PasswordField label="Senha" value={password} onChange={setPassword} autoComplete="new-password"/><div className="auth-strength"><div className="auth-strength-track"><div className="auth-strength-fill" style={{width: (passwordScore / 3 * 100) + '%', background: passwordScore === 3 ? '#16a34a' : passwordScore === 2 ? '#f59e0b' : '#ef4444'}}/></div><span className="auth-strength-copy">{passwordScore === 3 ? 'Senha atende aos requisitos' : 'Força da senha: ' + (passwordScore === 0 ? 'informe sua senha' : passwordScore === 1 ? 'fraca' : 'razoável')}</span><div className="auth-password-rules"><span className={passwordRules.length ? 'ok' : ''}>{passwordRules.length ? '✓' : '○'} 8 caracteres</span><span className={passwordRules.letter ? 'ok' : ''}>{passwordRules.letter ? '✓' : '○'} Uma letra</span><span className={passwordRules.number ? 'ok' : ''}>{passwordRules.number ? '✓' : '○'} Um número</span></div></div><PasswordField label="Confirmar senha" value={confirmPassword} onChange={setConfirmPassword} placeholder="Digite a senha novamente" autoComplete="new-password"/>{confirmPassword && password !== confirmPassword && <div className="auth-alert auth-alert-error">As senhas não coincidem.</div>}<label className="auth-check"><input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} required/><span>Li e aceito os <a className="auth-link" href="/termos">Termos de Uso</a> e a <a className="auth-link" href="/privacidade">Política de Privacidade</a>.</span></label><label className="auth-check auth-marketing"><input type="checkbox" checked={marketing} onChange={e => setMarketing(e.target.checked)}/><span>Quero receber dicas e novidades do LedsNet.</span></label><button className="auth-btn auth-btn-primary" disabled={busy || !accepted || !strong || password !== confirmPassword}>{busy ? 'Criando conta...' : 'Criar conta'} <ArrowRight size={16}/></button><div className="auth-divider">ou</div><GoogleButton busy={busy} onClick={handleGoogle}/></form><p className="auth-footer">Enviaremos um link para confirmar seu e-mail antes de liberar o painel.</p></Shell>;

  if (screen === 'recuperar-senha') return <Shell note={<a href="/entrar">Voltar ao login</a>}><div className="auth-success-icon"><Mail size={27}/></div><h2>Recuperar senha</h2><p className="auth-subtitle">Informe seu e-mail e, se houver uma conta elegível, enviaremos um link para redefinir sua senha.</p>{error && <Alert>{error}</Alert>}{notice && <Alert success>{notice}</Alert>}<form className="auth-form" onSubmit={e => submit(e, async () => { try { await sendPasswordResetEmail(auth, email.trim()); } catch (err) { const code = (err as {code?: string})?.code; if (code !== 'auth/user-not-found' && code !== 'auth/invalid-email') throw err; } setNotice('Se existir uma conta associada a esse e-mail, você receberá as instruções em instantes. Verifique também a pasta de spam.'); })}><Field label="E-mail cadastrado"><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@empresa.com.br" autoComplete="email" required /></Field><button className="auth-btn auth-btn-primary" disabled={busy}>{busy ? 'Enviando...' : 'Enviar link'} <ArrowRight size={16}/></button></form><p className="auth-footer"><a href="/entrar">Voltar para entrar</a></p></Shell>;

  if (screen === 'verificar-email') return <Shell><div className="auth-success-icon"><Mail size={27}/></div><h2>Confirme seu e-mail</h2><p className="auth-subtitle">Enviamos um link de verificação para <strong>{user?.email || email || 'seu e-mail'}</strong>. Abra a mensagem e clique no link para liberar sua conta. Confira também o spam.</p>{error && <Alert>{error}</Alert>}{notice && <Alert success>{notice}</Alert>}<div className="auth-form"><button className="auth-btn auth-btn-primary" disabled={busy} onClick={async () => {setBusy(true);setError('');try {const current = await refreshUser();if (current?.emailVerified) go('/configurar-conta');else setNotice('Ainda não detectamos a confirmação. Abra o link enviado e tente novamente.');}catch(e){setError(errorMessage(e));}finally{setBusy(false);}}}>{busy ? 'Verificando...' : 'Já verifiquei, continuar'} <CheckCircle2 size={16}/></button><button className="auth-btn auth-btn-google" disabled={busy || cooldown > 0 || !user} onClick={async () => {setBusy(true);setError('');try{await sendEmailVerification(user!);setCooldown(60);setNotice('Novo e-mail enviado. Você poderá solicitar outro em 60 segundos.');}catch(e){setError(errorMessage(e));}finally{setBusy(false);}}}>{cooldown ? 'Reenviar em ' + cooldown + 's' : 'Reenviar e-mail'}</button><button className="auth-mini-link" onClick={async () => {await signOut(auth);go('/entrar');}}>Usar outra conta</button></div><p className="auth-footer">O painel permanece bloqueado até a confirmação do endereço.</p></Shell>;

  if (screen === 'configurar-conta') return <Shell><div className="auth-eyebrow"><Check size={14}/> Último passo</div><h2>Configure sua conta</h2><p className="auth-subtitle">Essas informações personalizam suas buscas. Você poderá alterá-las depois.</p>{error && <Alert>{error}</Alert>}<form className="auth-form" onSubmit={e => submit(e, async () => {const uid = auth.currentUser?.uid;if (!uid) return go('/entrar');await setDoc(doc(db,'users',uid),{uid,ownerId:uid,name:auth.currentUser?.displayName || name,email:auth.currentUser?.email || email,companyName:company.trim(),industry:industry === 'Outro' ? otherIndustry.trim() : industry,defaultRegion:region.trim(),contactWhatsApp:whatsapp.replace(/\D/g,''),evolutionUrl:evolutionUrl.trim() || null,evolutionInstance:evolutionInstance.trim() || null,onboardingCompleted:true,configuredAt:new Date().toISOString()},{merge:true});go('/painel');})}><Field label="Nome da empresa"><input value={company} onChange={e=>setCompany(e.target.value)} placeholder="Sua empresa" required/></Field><Field label="Ramo de atuação"><select value={industry} onChange={e=>setIndustry(e.target.value)} required><option value="">Selecione um ramo</option>{['Climatização e refrigeração','Agência de marketing','Imobiliária','Contabilidade','Saúde e clínicas','Restaurantes','Varejo e lojas','Construção e reformas','Serviços profissionais','Tecnologia','Outro'].map(v=><option key={v}>{v}</option>)}</select></Field>{industry==='Outro'&&<Field label="Qual é o ramo?"><input value={otherIndustry} onChange={e=>setOtherIndustry(e.target.value)} required/></Field>}<Field label="Cidade ou região padrão"><input value={region} onChange={e=>setRegion(e.target.value)} placeholder="Ex.: Salvador, BA" required/></Field><Field label="WhatsApp de contato (com DDI)"><input type="tel" value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} placeholder="Ex.: +55 71 99999-9999" required/></Field><div style={{borderTop:'1px solid #e8edf5',paddingTop:15}}><strong style={{fontSize:13}}>Evolution API <span style={{fontWeight:400,color:'#64748b'}}>(opcional)</span></strong><p className="auth-subtitle" style={{margin:'6px 0 14px'}}>Pode deixar para depois. Nunca informe tokens ou chaves nesses campos.</p><Field label="URL da instância"><input type="url" value={evolutionUrl} onChange={e=>setEvolutionUrl(e.target.value)} placeholder="https://evolution.suaempresa.com"/></Field><Field label="Nome da instância"><input value={evolutionInstance} onChange={e=>setEvolutionInstance(e.target.value)} placeholder="minha-instancia"/></Field></div><button className="auth-btn auth-btn-primary" disabled={busy}>{busy?'Salvando...':'Salvar e ir para o painel'} <ArrowRight size={16}/></button></form></Shell>;

  const isTerms = screen === 'termos';
  return <Shell note={<a href="/criar-conta">Criar conta</a>}><a className="auth-top-back" href="/"><ArrowLeft size={14} style={{display:'inline',verticalAlign:'middle'}}/> Voltar para o início</a><h2 style={{marginTop:20}}>{isTerms?'Termos de Uso':'Política de Privacidade'}</h2><p className="auth-subtitle">Documento informativo do LedsNet. Revise com assessoria jurídica antes de usar como documento legal definitivo.</p><h3 style={{fontSize:16,margin:'20px 0 8px'}}>Uso da plataforma</h3><p style={{fontSize:13,lineHeight:1.7,color:'#52637b'}}>{isTerms?'Você é responsável por manter a segurança da sua conta, usar os dados de forma lícita e respeitar os termos dos provedores integrados. O acesso pode ser suspenso em caso de uso abusivo.':'Utilizamos os dados de conta e configuração para operar o serviço. Os dados da sua conta são separados por identificador de usuário e protegidos por regras de acesso. Não compartilhe credenciais ou tokens de integração.'}</p><h3 style={{fontSize:16,margin:'20px 0 8px'}}>{isTerms?'Responsabilidades':'Dados e segurança'}</h3><p style={{fontSize:13,lineHeight:1.7,color:'#52637b'}}>{isTerms?'Não use a plataforma para enviar comunicações ilegais, abusivas ou sem base legal. Integrações externas dependem das configurações e condições de seus fornecedores.':'As credenciais de API devem permanecer no servidor. Solicitações de acesso, correção ou exclusão de dados devem ser encaminhadas ao suporte do serviço. Este texto é uma versão inicial e não substitui revisão jurídica.'}</p><a className="auth-btn auth-btn-primary" style={{marginTop:22}} href="/criar-conta">Voltar ao cadastro <ArrowRight size={16}/></a></Shell>;
}
