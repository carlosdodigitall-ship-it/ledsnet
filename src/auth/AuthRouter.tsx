import { useEffect, useState, type ReactNode } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { LoaderCircle } from 'lucide-react';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { AuthScreen } from './AuthScreens';

const publicScreens = new Set(['/entrar', '/criar-conta', '/verificar-email', '/recuperar-senha', '/configurar-conta', '/termos', '/privacidade']);
function LoadingScreen() {
  return <div style={{minHeight:'100vh',display:'grid',placeItems:'center',fontFamily:'Inter, sans-serif',color:'#0B1F44'}}><div style={{display:'flex',alignItems:'center',gap:10}}><LoaderCircle size={20} className="animate-spin"/> Verificando sua conta...</div></div>;
}
export function AuthRouter({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [path, setPath] = useState(window.location.pathname);
  const [profileLoading, setProfileLoading] = useState(false);
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    if (loading || !user || !user.emailVerified || !['/painel', '/configurar-conta'].includes(path)) return;
    let active = true;
    setProfileLoading(true);
    getDoc(doc(db, 'users', user.uid)).then(snapshot => {
      if (active) setOnboarded(snapshot.exists() && snapshot.data().onboardingCompleted === true);
    }).catch(() => {
      if (active) setOnboarded(false);
    }).finally(() => { if (active) setProfileLoading(false); });
    return () => { active = false; };
  }, [loading, user?.uid, user?.emailVerified, path]);

  useEffect(() => {
    if (loading) return;
    if (!isFirebaseConfigured) return;
    if (['/painel', '/configurar-conta'].includes(path)) {
      if (!user) { window.location.replace('/entrar'); return; }
      if (!user.emailVerified) { window.location.replace('/verificar-email'); return; }
    }
    if (path === '/verificar-email' && !user) { window.location.replace('/entrar'); return; }
    if (path === '/painel' && !profileLoading && !onboarded) window.location.replace('/configurar-conta');
    if (path === '/configurar-conta' && !profileLoading && onboarded) window.location.replace('/painel');
    if (!publicScreens.has(path) && path !== '/painel' && path !== '/') window.location.replace('/');
  }, [loading, user, path, profileLoading, onboarded]);

  if (loading || profileLoading) return <LoadingScreen />;
  if (path === '/painel') {
    if (!user || !user.emailVerified || !onboarded) return <LoadingScreen />;
    return <>{children}</>;
  }
  if (path === '/configurar-conta') {
    if (!user || !user.emailVerified || onboarded) return <LoadingScreen />;
    return <AuthScreen screen="configurar-conta" />;
  }
  if (path === '/verificar-email') return <AuthScreen screen="verificar-email" />;
  if (path === '/entrar') return <AuthScreen screen="entrar" />;
  if (path === '/criar-conta') return <AuthScreen screen="criar-conta" />;
  if (path === '/recuperar-senha') return <AuthScreen screen="recuperar-senha" />;
  if (path === '/termos') return <AuthScreen screen="termos" />;
  if (path === '/privacidade') return <AuthScreen screen="privacidade" />;
  return <LoadingScreen />;
}
