import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthGate from './auth/AuthGate';
import LoadingScreen from './auth/LoadingScreen';
import AppLayout from './layout/AppLayout';
import './App.css';

function MainApp() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <AuthGate />;
  }

  return <AppLayout />;
}

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;