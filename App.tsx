
import React, { useState } from 'react';
import Layout from './components/Layout';
import GratitudePage from './pages/GratitudePage';
import AffirmationPage from './pages/AffirmationPage';
import ExplorePage from './pages/ExplorePage';
import ProfilePage from './pages/ProfilePage';
import { TabType } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('gratitude');

  const renderContent = () => {
    switch (activeTab) {
      case 'gratitude':
        return <GratitudePage />;
      case 'affirmation':
        return <AffirmationPage />;
      case 'explore':
        return <ExplorePage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <GratitudePage />;
    }
  };

  return (
    <div className="w-full h-full bg-[#F5F5F3] flex justify-center items-center overflow-hidden">
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {renderContent()}
      </Layout>
    </div>
  );
};

export default App;
