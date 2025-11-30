import { useState, useEffect, Suspense, lazy } from 'react';
import { LoadingScreen } from './components/LoadingScreen';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

import { TitleBar } from './components/TitleBar';

// Lazy Loading dos componentes principais
const Login = lazy(() => import('./components/Login').then(module => ({ default: module.Login })));
const Dashboard = lazy(() => import('./components/Dashboard').then(module => ({ default: module.Dashboard })));
const ResetPassword = lazy(() => import('./components/ResetPassword').then(module => ({ default: module.ResetPassword })));

import { usePresence } from './hooks/usePresence';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resetCode, setResetCode] = useState(null);

  // Ativar rastreamento de presença
  usePresence(user?.uid);

  useEffect(() => {
    // Verificar se há código de redefinição de senha na URL
    const params = new URLSearchParams(window.location.search);
    const oobCode = params.get('oobCode');
    if (oobCode) {
      setResetCode(oobCode);
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // Pequeno delay artificial para mostrar a animação (opcional, mas legal para UX rápida demais)
      setTimeout(() => setLoading(false), 1500);
    });

    return () => unsubscribe();
  }, []);

  const handleBackToLogin = () => {
    setResetCode(null);
    // Limpar URL sem recarregar
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <TitleBar />
      <div style={{ paddingTop: '32px', height: '100vh', boxSizing: 'border-box' }}>
        <Suspense fallback={<LoadingScreen />}>
          {resetCode ? (
            <ResetPassword oobCode={resetCode} onBackToLogin={handleBackToLogin} />
          ) : user ? (
            <Dashboard user={user} />
          ) : (
            <Login />
          )}
        </Suspense>
      </div>
    </>
  );
}

export default App;;
