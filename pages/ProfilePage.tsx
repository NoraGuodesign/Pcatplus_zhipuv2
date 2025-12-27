
import React from 'react';
import { Shield, FileText, Bell, Smartphone, Languages, ChevronRight, LogOut, Heart } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const menuItems = [
    { icon: Bell, label: '活动通知', extra: '3' },
    { icon: Smartphone, label: '设置 (绑定手机号)', extra: '138****8888' },
    { icon: Languages, label: '语言设置', extra: '中文' },
    { icon: Shield, label: '隐私协议', extra: '' },
    { icon: FileText, label: '服务协议', extra: '' },
  ];

  return (
    <div className="flex flex-col h-full bg-white font-sans overflow-hidden">
      {/* Empty header block to maintain visual consistency with other modules */}
      <header className="nav-header"></header>

      {/* User Header Section - Reduced height and avatar size */}
      <div className="px-8 py-6 flex items-center gap-5 border-b border-[#D1D1CF] bg-[#F7F7F5]">
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-2 border-[#2C2C2E] p-0.5 bg-white shadow-md overflow-hidden">
            <img src="https://picsum.photos/seed/innerh/200" className="w-full h-full object-cover rounded-full" alt="Avatar" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 bg-[#EF7C1C] p-1.5 rounded-full border border-white shadow-sm">
             <Heart size={10} fill="white" color="white" />
          </div>
        </div>
        <div className="flex-1">
          <h1 className="text-[18px] font-bold tracking-tight text-[#2C2C2E] leading-none font-serif">觉醒旅人 #0124</h1>
          <p className="text-[10px] text-[#8E8E93] font-bold uppercase tracking-[0.2em] mt-2">连续显化 12 天</p>
        </div>
      </div>

      {/* Main Content Area - Optimized for single-page presentation */}
      <div className="flex-1 px-5 py-6 flex flex-col justify-between fade-in overflow-hidden">
        {/* Menu Section */}
        <div className="space-y-4">
          <p className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-[0.3em] ml-1">个人中心 / Profile Control</p>
          <div className="border border-[#D1D1CF] rounded-lg bg-white overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            {menuItems.map((item, i) => (
              <div 
                key={i} 
                className={`flex items-center gap-4 px-5 py-3.5 active:bg-[#F7F7F5] transition-all cursor-pointer ${i !== menuItems.length-1 ? 'border-b border-[#EDEDEB]' : ''}`}
              >
                <div className="text-[#2C2C2E] opacity-60"><item.icon size={17} /></div>
                <span className="flex-1 text-[14px] font-semibold text-[#2C2C2E] tracking-tight">{item.label}</span>
                {item.extra && <span className="text-[11px] font-mono font-bold text-[#EF7C1C]">{item.extra}</span>}
                <ChevronRight size={14} className="text-[#D1D1CF]" />
              </div>
            ))}
          </div>
        </div>
        
        {/* Logout Button - Anchored at the bottom but clearly visible */}
        <div className="pb-4">
          <button className="w-full py-4 border-2 border-[#2C2C2E] text-[12px] font-bold uppercase tracking-[0.3em] rounded-md flex items-center justify-center gap-3 hover:bg-[#2C2C2E] hover:text-white active:scale-[0.98] transition-all text-[#2C2C2E]">
            <LogOut size={16} /> 退出登录
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
