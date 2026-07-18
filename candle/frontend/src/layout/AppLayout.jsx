import React, { useState } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';
import Dashboard from '../pages/Dashboard';
import Stocks from '../pages/Stocks';
import Predictions from '../pages/Predictions';
import MyPredictions from '../pages/MyPredictions';
import Leaderboard from '../pages/Leaderboard';
import Analytics from '../pages/Analytics';
import LearningCenter from '../pages/LearningCenter';
import Community from '../pages/Community';

function AppLayout() {
  // Navigation state
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedStock, setSelectedStock] = useState(null);
  const [learningSection, setLearningSection] = useState('stock-basics');

  // Navigation handlers
  const navigateTo = (page, data = null) => {
    setCurrentPage(page);
    if (page === 'predictions' && data?.selectedStock) {
      setSelectedStock(data.selectedStock);
    }
    if (page === 'learning' && data?.section) {
      setLearningSection(data.section);
    }
  };

  // Render current page
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={navigateTo} />;
      case 'stocks':
        return <Stocks onNavigate={navigateTo} />;
      case 'predictions':
        return <Predictions selectedStock={selectedStock} onNavigate={navigateTo} />;
      case 'myPredictions':
        return <MyPredictions onNavigate={navigateTo} />;
      case 'leaderboard':
        return <Leaderboard onNavigate={navigateTo} />;
      case 'analytics':
        return <Analytics onNavigate={navigateTo} />;
      case 'learning':
        return (
          <LearningCenter
            activeSection={learningSection}
            onSectionChange={(sectionId) => setLearningSection(sectionId)}
          />
        );
         case 'community':
      return <Community onNavigate={navigateTo} />;
      case 'admin':
        return <AdminPanel onNavigate={navigateTo} />;
      default:
        return <Dashboard onNavigate={navigateTo} />;
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar
          currentPage={currentPage}
          currentLearningSection={learningSection}
          onNavigate={navigateTo}
        />
        <SidebarInset className="flex-1">
          <AppHeader />
          {renderPage()}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export default AppLayout;