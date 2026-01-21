
import React, { useState } from 'react';
import { AppProvider } from './context';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Deals } from './components/Deals';
import { Settings } from './components/Settings';
import { LandingPage } from './components/LandingPage';

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'deals': return <Deals />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  if (showLanding) {
    return <LandingPage onEnter={() => setShowLanding(false)} />;
  }

  return (
    <AppProvider>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {renderContent()}
      </Layout>
    </AppProvider>
  );
}
