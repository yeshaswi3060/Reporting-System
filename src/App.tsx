import React, { useState } from 'react';
import { AuthPage } from './pages/AuthPage';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'login' | 'signup'>('login');

  return (
    <div>
      <AuthPage onSwitchToSignup={() => setCurrentPage('signup')} />
    </div>
  );
};

export default App;