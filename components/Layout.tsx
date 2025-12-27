
import React from 'react';
import { Heart, Stars, Compass, User } from 'lucide-react';
import { TabType } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'gratitude', icon: Heart, label: '感恩' },
    { id: 'affirmation', icon: Stars, label: '肯定' },
    { id: 'explore', icon: Compass, label: '探索' },
    { id: 'profile', icon: User, label: '我的' },
  ];

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden">
      <main className="flex-1 overflow-hidden relative bg-white">
        {children}
      </main>

      {/* iPhone Balanced Tab Bar */}
      <nav className="bg-[#F7F7F5] border-t border-[#D1D1CF] flex justify-around items-center pt-2.5 pb-[var(--ios-indicator)] px-2 z-50">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className="flex flex-col items-center justify-center w-16 transition-all"
            >
              <div className={`p-1.5 transition-all ${isActive ? 'text-[#EF7C1C] scale-110' : 'text-[#8E8E93]'}`}>
                <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-bold mt-0.5 tracking-tighter ${isActive ? 'text-[#EF7C1C]' : 'text-[#8E8E93]'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Layout;
