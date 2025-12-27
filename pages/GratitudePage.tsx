
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Mail, Send, Camera, Calendar, MessageCircle, X, ChevronRight, Mail as MailIcon, Loader2, CheckCircle2 } from 'lucide-react';
import { aiService } from '../services/aiService';
import { GratitudeEntry } from '../types';
import { StorageService } from '../services/storage';

type GratitudeSubTab = 'chat' | 'record' | 'archive';

const GratitudePage: React.FC = () => {
  const [subTab, setSubTab] = useState<GratitudeSubTab>('record');
  const [items, setItems] = useState<string[]>(['']);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [universeLetter, setUniverseLetter] = useState<string | null>(null);
  const [archive, setArchive] = useState<GratitudeEntry[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setArchive(StorageService.getGratitudeArchive());
    setChatMessages(StorageService.getChatHistory());
  }, [subTab]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleAddItem = () => { if (items.length < 10) setItems([...items, '']); };
  const handleItemChange = (idx: number, val: string) => {
    const newItems = [...items];
    newItems[idx] = val;
    setItems(newItems);
  };
  const handleRemoveItem = (idx: number) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== idx));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    files.forEach(file => {
      // Basic check to keep base64 strings manageable
      if (file.size > 5 * 1024 * 1024) {
        alert("图片太大，请选择 5MB 以下的图片");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setPhotos(prev => [...prev, reader.result as string].slice(0, 9));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const generateLetter = async () => {
    const content = items.filter(i => i && i.trim() !== '').join('; ');
    if (!content) {
      alert("请先输入一些值得感恩的事物");
      return;
    }
    setIsGenerating(true);
    setUniverseLetter(null); 
    try {
      const letter = await aiService.generateUniverseLetter(content);
      setUniverseLetter(letter);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setIsGenerating(false); 
    }
  };

  const saveEntry = async () => {
    const filteredItems = items.filter(it => it && it.trim() !== '');
    if (filteredItems.length === 0 && photos.length === 0) {
      alert("请至少记录一件感恩的小事或上传一张照片");
      return;
    }

    setIsSaving(true);
    const newEntry: GratitudeEntry = {
      id: `grat-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      date: new Date().toISOString(),
      items: filteredItems,
      photos: [...photos],
      universeLetter: universeLetter || undefined
    };

    const success = await StorageService.saveGratitudeEntry(newEntry);
    
    if (success) {
      setShowSuccess(true);
      setTimeout(() => {
        setArchive(StorageService.getGratitudeArchive());
        setItems(['']); 
        setPhotos([]); 
        setUniverseLetter(null);
        setIsSaving(false);
        setShowSuccess(false);
        setSubTab('archive');
      }, 800);
    } else {
      alert("保存失败，存储空间已满。系统已尝试自动清理，请再次尝试保存。");
      setIsSaving(false);
    }
  };

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: 'user' as const, text: chatInput, timestamp: Date.now() };
    const updatedHistory = [...chatMessages, userMsg];
    setChatMessages(updatedHistory);
    StorageService.saveChatMessage(userMsg);
    setChatInput('');
    try {
      const response = await aiService.chatWithUniverse(updatedHistory, userMsg.text);
      const modelMsg = { role: 'model' as const, text: response, timestamp: Date.now() };
      setChatMessages(prev => [...prev, modelMsg]);
      StorageService.saveChatMessage(modelMsg);
    } catch (e) { 
      console.error(e); 
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="nav-header">
        <button onClick={() => setSubTab('chat')} className={`nav-tab-item ${subTab === 'chat' ? 'active' : ''}`}>交流</button>
        <button onClick={() => setSubTab('record')} className={`nav-tab-item ${subTab === 'record' ? 'active' : ''}`}>记录</button>
        <button onClick={() => setSubTab('archive')} className={`nav-tab-item ${subTab === 'archive' ? 'active' : ''}`}>档案</button>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col fade-in">
        {subTab === 'record' && (
          <div className="flex-1 overflow-y-auto p-5 flex flex-col">
            <div className="space-y-6 flex-shrink-0">
              <div className="bg-[#F7F7F5] p-3 border-l-3 border-[#EF7C1C] rounded-r">
                <p className="text-[13px] text-[#2C2C2E] font-medium leading-relaxed">生活的点滴感恩都值得被记录。</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93]">Gratitude List</span>
                    <button onClick={handleAddItem} className="text-[#EF7C1C] p-1"><Plus size={18} /></button>
                  </div>
                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex gap-2 group">
                        <input 
                          type="text" 
                          value={item} 
                          onChange={(e) => handleItemChange(idx, e.target.value)} 
                          placeholder={`记录第 ${idx + 1} 件值得感恩的小事...`} 
                          className="braun-input flex-1"
                        />
                        {items.length > 1 && (
                          <button onClick={() => handleRemoveItem(idx)} className="text-[#D1D1CF] hover:text-[#2C2C2E] transition-colors"><Trash2 size={16} /></button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93]">Visuals ({photos.length}/9)</span>
                  <div className="grid grid-cols-3 gap-2">
                    {photos.map((p, i) => (
                      <div key={i} className="aspect-square relative rounded border border-[#EBEBE9] overflow-hidden">
                        <img src={p} className="w-full h-full object-cover" alt="" />
                        <button onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))} className="absolute top-0.5 right-0.5 bg-white/90 rounded-full p-0.5"><X size={10} /></button>
                      </div>
                    ))}
                    {photos.length < 9 && (
                      <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-[#D1D1CF] rounded cursor-pointer hover:border-[#EF7C1C] bg-[#F7F7F5]">
                        <Camera size={20} className="text-[#D1D1CF]" />
                        <input type="file" className="hidden" multiple accept="image/*" onChange={handlePhotoUpload} />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-end space-y-6 pt-16 pb-16 px-2">
              <div className="flex flex-col items-center gap-6">
                <button 
                  onClick={generateLetter} 
                  disabled={isGenerating || isSaving}
                  className="flex items-center gap-2 px-8 py-2.5 bg-[#F7F7F5] border border-[#D1D1CF] rounded-full text-[13px] font-bold active:scale-95 transition-all disabled:opacity-50"
                >
                  <Mail size={18} className={isGenerating ? 'text-[#EF7C1C] animate-bounce' : 'text-[#2C2C2E]'} />
                  {isGenerating ? '信件投递中...' : '获取宇宙来信'}
                </button>
                
                {isGenerating && (
                  <div className="bg-[#F7F7F5] w-full p-6 rounded-lg border border-dashed border-[#D1D1CF] flex flex-col items-center justify-center gap-3 fade-in">
                    <Loader2 size={24} className="text-[#EF7C1C] animate-spin" />
                    <p className="text-[12px] text-[#8E8E93] font-serif italic text-center animate-pulse">
                      正在拨动星辰的弦，为你感应宇宙的回响...
                    </p>
                  </div>
                )}

                {universeLetter && !isGenerating && (
                  <div className="w-full bg-[#2C2C2E] p-5 rounded-lg border-t-2 border-[#EF7C1C] shadow-lg fade-in relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none"><MailIcon size={40} className="text-white" /></div>
                    <p className="text-[14px] text-white/90 font-serif italic leading-relaxed text-center relative z-10">
                      “{universeLetter}”
                    </p>
                  </div>
                )}
              </div>

              <div className="relative">
                <button 
                  onClick={saveEntry} 
                  disabled={isSaving}
                  className={`w-full py-4 bg-[#2C2C2E] text-white text-[15px] font-bold uppercase tracking-[0.3em] rounded active:scale-[0.98] shadow-xl transition-all flex items-center justify-center gap-3 ${showSuccess ? 'bg-[#EF7C1C]' : ''}`}
                >
                  {isSaving ? (
                    showSuccess ? <><CheckCircle2 size={20} /> 已存入档案</> : <><Loader2 size={20} className="animate-spin" /> 归档中...</>
                  ) : '保存感恩瞬间'}
                </button>
              </div>
            </div>
          </div>
        )}

        {subTab === 'archive' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-[#EDEDEB] bg-[#F7F7F5] flex justify-between items-center shadow-sm z-10">
               <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-[#EF7C1C]" />
                  <span className="text-[14px] font-bold text-[#2C2C2E]">感恩档案</span>
               </div>
               <span className="text-[10px] font-mono font-bold text-[#8E8E93] uppercase tracking-widest">
                 {archive.length} 条记录
               </span>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#FDFDFB]">
              {archive.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 opacity-30">
                  <Calendar size={48} className="text-[#8E8E93]" />
                  <p className="mt-4 text-[12px] uppercase font-bold tracking-[0.2em] text-[#2C2C2E]">暂无档案记录</p>
                </div>
              ) : (
                archive.map((entry) => (
                  <div key={entry.id} className="bg-white border border-[#EDEDEB] p-5 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4 fade-in">
                    <div className="flex justify-between items-center pb-3 border-b border-[#F7F7F5]">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#EF7C1C]" />
                        <span className="text-[11px] font-mono font-bold text-[#2C2C2E]">
                          {entry.date ? new Date(entry.date).toLocaleString('zh-CN', { 
                            year: 'numeric',
                            month: 'long', 
                            day: 'numeric', 
                          }) : '未知日期'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#8E8E93]">
                         {entry.date ? new Date(entry.date).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {entry.items?.map((it, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <span className="text-[11px] font-bold text-[#EF7C1C] mt-0.5">#{idx + 1}</span>
                          <p className="text-[14px] text-[#2C2C2E] leading-relaxed flex-1">
                            {it}
                          </p>
                        </div>
                      ))}
                    </div>

                    {entry.photos && entry.photos.length > 0 && (
                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        {entry.photos.map((p, i) => (
                          <div key={i} className="aspect-square rounded overflow-hidden border border-[#F0F0EE]">
                            <img src={p} className="w-full h-full object-cover" alt="感恩瞬间" />
                          </div>
                        ))}
                      </div>
                    )}

                    {entry.universeLetter && (
                      <div className="mt-4 bg-[#2C2C2E] p-4 rounded-lg relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                            <MailIcon size={40} className="text-white" />
                         </div>
                         <div className="relative z-10">
                            <span className="block text-[9px] font-bold uppercase tracking-[0.2em] mb-2 text-[#EF7C1C]">宇宙回响 / RESPONSE</span>
                            <p className="text-[12.5px] italic text-white/90 font-serif leading-relaxed">
                              “{entry.universeLetter}”
                            </p>
                         </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {subTab === 'chat' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="flex justify-start">
                <div className="bg-[#F7F7F5] p-4 rounded-2xl rounded-tl-none text-[14px] border border-[#D1D1CF] max-w-[85%] font-serif leading-relaxed shadow-sm">
                  我是你的宇宙共鸣。在忙碌的缝隙里，有什么微小而闪光的事让你心生喜悦吗？
                </div>
              </div>
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-4 rounded-2xl text-[14px] max-w-[85%] shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-[#2C2C2E] text-white rounded-tr-none' 
                      : 'bg-[#F7F7F5] border border-[#D1D1CF] rounded-tl-none font-serif italic leading-relaxed'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="p-4 bg-white border-t border-[#EDEDEB]">
              <div className="flex gap-2 p-1.5 bg-[#F7F7F5] border border-[#2C2C2E] rounded-full shadow-sm">
                <input 
                  type="text" 
                  value={chatInput} 
                  onChange={(e) => setChatInput(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && sendChat()} 
                  placeholder="与宇宙深处对话..." 
                  className="flex-1 px-4 py-2 text-[13px] bg-transparent outline-none font-bold" 
                />
                <button onClick={sendChat} className="p-2.5 bg-[#2C2C2E] text-white rounded-full hover:bg-black transition-colors"><Send size={18} /></button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GratitudePage;
