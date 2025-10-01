import React, { useEffect, useState } from 'react';
import { AuthPage } from './pages/AuthPage';
import { SignupPage } from './pages/SignupPage';
import { Dashboard } from './pages/Dashboard';
import { ImagePage } from './pages/ImagePage';
import { useAuth } from './contexts/AuthContext';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'login' | 'signup'>('login');
  const { isAuthenticated } = useAuth();

  const [hash, setHash] = useState<string>(typeof window !== 'undefined' ? window.location.hash : '');

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  if (isAuthenticated) {
    if (hash.startsWith('#/image')) {
      return <ImagePage />;
    }
    return <Dashboard />;
  }

  return (
    <div>
      {currentPage === 'login' ? (
        <AuthPage onSwitchToSignup={() => setCurrentPage('signup')} />
      ) : (
        <SignupPage onSwitchToLogin={() => setCurrentPage('login')} />
      )}
    </div>
  );
};

export default App;