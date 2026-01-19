import React, { useState } from 'react';
import { AppProvider } from './context';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Deals } from './components/Deals';
import { Expenses } from './components/Expenses';
import { Activities } from './components/Activities';
import { Settings } from './components/Settings';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'deals': return <Deals />;
      case 'expenses': return <Expenses />;
      case 'activities': return <Activities />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <AppProvider>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {renderContent()}
      </Layout>
    </AppProvider>
  );
}