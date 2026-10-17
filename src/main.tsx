import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './auth/AuthContext';
import { AuthRouter } from './auth/AuthRouter';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <AuthRouter>
      <App />
    </AuthRouter>
  </AuthProvider>,
);
