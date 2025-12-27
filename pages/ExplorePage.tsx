
import React from 'react';
import { BookOpen, Play, ChevronRight, Music } from 'lucide-react';

const ExplorePage: React.FC = () => {
  const books = [
    { title: '与神对话', author: '尼尔·唐纳德·沃尔什', image: 'https://picsum.photos/seed/spirit1/300/400' },
    { title: '向宇宙下订单', author: '芭贝尔·摩尔', image: 'https://picsum.photos/seed/spirit2/300/400' },
  ];

  const audios = [
    { title: '财富频率能量波', type: 'Subliminal', duration: '15:00' },
    { title: '全天肯定语循环', type: 'Affirmation', duration: '30:00' },
    { title: '显化冥想指南', type: 'Meditation', duration: '12:45' },
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Empty header block to maintain visual consistency with other modules */}
      <header className="nav-header"></header>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-12 fade-in">
        {/* Reading Section */}
        <section className="space-y-6">
          <div className="flex justify-between items-end border-b border-[#D1D1CF] pb-2">
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-[#EF7C1C]" />
              <h3 className="text-[14px] font-bold uppercase tracking-widest">灵性阅读</h3>
            </div>
            <span className="text-[10px] text-[#8E8E93] font-bold uppercase">View All <ChevronRight size={12} className="inline" /></span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {books.map((book, i) => (
              <div key={i} className="min-w-[160px] space-y-3 group cursor-pointer">
                <div className="aspect-[3/4] border border-[#D1D1CF] overflow-hidden rounded-md shadow-sm">
                  <img src={book.image} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt={book.title} />
                </div>
                <div>
                   <p className="text-[13px] font-bold text-[#2C2C2E] leading-tight uppercase">{book.title}</p>
                   <p className="text-[11px] text-[#8E8E93] mt-1">{book.author}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Audio Section */}
        <section className="space-y-6">
          <div className="flex justify-between items-end border-b border-[#D1D1CF] pb-2">
            <div className="flex items-center gap-2">
              <Music size={18} className="text-[#EF7C1C]" />
              <h3 className="text-[14px] font-bold uppercase tracking-widest">音频能量站</h3>
            </div>
            <span className="text-[10px] text-[#8E8E93] font-bold uppercase">All Tracks <ChevronRight size={12} className="inline" /></span>
          </div>
          <div className="space-y-3">
            {audios.map((audio, i) => (
              <div key={i} className="bg-[#F8F8F6] p-4 border border-[#D1D1CF] rounded-md flex items-center gap-4 active:bg-[#EBEBE9] transition-all cursor-pointer">
                <div className="w-10 h-10 flex items-center justify-center bg-[#2C2C2E] rounded-full text-white shadow-md">
                   <Play size={14} fill="white" />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-bold uppercase tracking-tight text-[#2C2C2E]">{audio.title}</p>
                  <p className="text-[11px] text-[#8E8E93] font-bold uppercase mt-0.5">{audio.type} • {audio.duration}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ExplorePage;
