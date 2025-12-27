
import React, { useState, useEffect, useRef } from 'react';
import { Lightbulb, Trash2, Plus, BarChart2, X, Zap, Volume2, Save, Download, Droplet, Camera, Music, Sparkles, Edit3, Check, RotateCcw } from 'lucide-react';
import { aiService } from '../services/aiService';
import { AffirmationTheme, PracticeCount } from '../types';
import { StorageService } from '../services/storage';

type AffirmSubTab = 'theme' | 'generate' | 'practice';
type PracticeMode = 'counter' | 'water';

interface StarParticle {
  id: number;
  x: number;
  y: number;
  size: number;
}

const AffirmationPage: React.FC = () => {
  const [subTab, setSubTab] = useState<AffirmSubTab>('generate');
  const [genMode, setGenMode] = useState<'AI' | 'Manual'>('AI');
  const [themes, setThemes] = useState<AffirmationTheme[]>([]);
  const [themeInput, setThemeInput] = useState('');
  const [manualLines, setManualLines] = useState<string[]>(['']);
  const [generatedList, setGeneratedList] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedToSave, setSelectedToSave] = useState<number[]>([]);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('counter');
  const [activeThemeId, setActiveThemeId] = useState<string | null>(null);
  const [counts, setCounts] = useState<PracticeCount[]>([]);
  const [bulbLit, setBulbLit] = useState(false);
  const [floatingAffirm, setFloatingAffirm] = useState<{ text: string, x: number, y: number } | null>(null);
  const [showStats, setShowStats] = useState(false);
  // Initial level at 75% (1/4 below the rim)
  const [waterLevel, setWaterLevel] = useState(75);
  const [selectedAffirmations, setSelectedAffirmations] = useState<string[]>([]);
  const [isDrinking, setIsDrinking] = useState(false);
  const [customBg, setCustomBg] = useState<string | null>(StorageService.getCounterBg());
  const [stars, setStars] = useState<StarParticle[]>([]);
  
  // States for theme management
  const [isSpeakingThemeId, setIsSpeakingThemeId] = useState<string | null>(null);
  const speakingIndexRef = useRef<number>(0);
  const [editingAffIndex, setEditingAffIndex] = useState<{ themeId: string, index: number } | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    setThemes(StorageService.getAffirmationThemes() || []);
    setCounts(StorageService.getPracticeCounts() || []);
  }, [subTab]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleGenerate = async () => {
    if (!themeInput.trim()) return;
    setIsGenerating(true);
    try {
      const result = await aiService.generateAffirmations(themeInput);
      setGeneratedList(result || []);
      setSelectedToSave([]);
    } catch (e) { console.error(e); } finally { setIsGenerating(false); }
  };

  const saveAffirmations = () => {
    let itemsToSave: string[] = [];
    if (genMode === 'AI') {
      itemsToSave = selectedToSave.map(idx => generatedList[idx]);
    } else {
      itemsToSave = manualLines.filter(line => line && line.trim() !== '');
    }
    if (itemsToSave.length === 0 || !themeInput.trim()) return;

    const currentThemes = themes || [];
    const existingIdx = currentThemes.findIndex(t => t.title === themeInput);
    let updated: AffirmationTheme[];
    if (existingIdx > -1) {
      updated = [...currentThemes];
      const existingAffs = updated[existingIdx].affirmations || [];
      updated[existingIdx].affirmations = Array.from(new Set([...existingAffs, ...itemsToSave]));
    } else {
      const newTheme: AffirmationTheme = {
        id: Date.now().toString(),
        title: themeInput,
        affirmations: itemsToSave,
        createdAt: new Date().toISOString()
      };
      updated = [newTheme, ...currentThemes];
    }
    setThemes(updated);
    StorageService.saveAffirmationThemes(updated);
    setGeneratedList([]); setThemeInput(''); setManualLines(['']); setSubTab('theme');
  };

  const speakAffirmationsLoop = (themeId: string, affirmations: string[]) => {
    if (isSpeakingThemeId === themeId) {
      window.speechSynthesis.cancel();
      setIsSpeakingThemeId(null);
      return;
    }

    window.speechSynthesis.cancel();
    setIsSpeakingThemeId(themeId);
    speakingIndexRef.current = 0;

    const playCycle = () => {
      setIsSpeakingThemeId((currentId) => {
        if (currentId !== themeId) return currentId;
        if (affirmations.length === 0) return null;

        const utterance = new SpeechSynthesisUtterance(affirmations[speakingIndexRef.current]);
        utterance.rate = 0.9;
        utterance.onend = () => {
          speakingIndexRef.current = (speakingIndexRef.current + 1) % affirmations.length;
          setTimeout(playCycle, 1000);
        };
        utterance.onerror = () => setIsSpeakingThemeId(null);
        window.speechSynthesis.speak(utterance);
        return currentId;
      });
    };
    if (affirmations.length > 0) playCycle();
  };

  const handleDeleteTheme = (id: string) => {
    if (isSpeakingThemeId === id) {
      window.speechSynthesis.cancel();
      setIsSpeakingThemeId(null);
    }
    const u = themes.filter(t => t.id !== id);
    setThemes(u);
    StorageService.saveAffirmationThemes(u);
  };

  const handleDeleteAffirmationLine = (themeId: string, affIndex: number) => {
    const updatedThemes = themes.map(t => {
      if (t.id === themeId) {
        return {
          ...t,
          affirmations: t.affirmations.filter((_, i) => i !== affIndex)
        };
      }
      return t;
    });
    setThemes(updatedThemes);
    StorageService.saveAffirmationThemes(updatedThemes);
  };

  const handleStartEdit = (themeId: string, index: number, value: string) => {
    setEditingAffIndex({ themeId, index });
    setEditValue(value);
  };

  const handleSaveEdit = (themeId: string, index: number) => {
    const updatedThemes = themes.map(t => {
      if (t.id === themeId) {
        const newAffs = [...t.affirmations];
        newAffs[index] = editValue;
        return { ...t, affirmations: newAffs };
      }
      return t;
    });
    setThemes(updatedThemes);
    StorageService.saveAffirmationThemes(updatedThemes);
    setEditingAffIndex(null);
  };

  const triggerCounter = () => {
    if (!activeThemeId) { alert("请先在实践页面选择一个主题包"); return; }
    const theme = (themes || []).find(t => t.id === activeThemeId);
    if (!theme || !theme.affirmations || theme.affirmations.length === 0) {
       alert("该主题包下暂无肯定语");
       return;
    }
    setBulbLit(true);
    
    const randomIdx = Math.floor(Math.random() * theme.affirmations.length);
    
    const rangeX = 60; 
    const rangeY = 40; 
    
    setFloatingAffirm({
      text: theme.affirmations[randomIdx],
      x: 50 + (Math.random() - 0.5) * rangeX,
      y: 40 + (Math.random() - 0.5) * rangeY
    });

    const newStars: StarParticle[] = Array.from({ length: 10 }).map(() => ({
      id: Math.random(),
      x: 50 + (Math.random() - 0.5) * 70,
      y: 50 + (Math.random() - 0.5) * 60,
      size: 4 + Math.random() * 8
    }));
    setStars(newStars);

    const updatedCounts = [...(counts || [])];
    const cIdx = updatedCounts.findIndex(c => c.themeId === activeThemeId);
    if (cIdx > -1) updatedCounts[cIdx].count += 1;
    else updatedCounts.push({ themeId: activeThemeId, count: 1 });
    setCounts(updatedCounts);
    StorageService.savePracticeCounts(updatedCounts);
    
    setTimeout(() => {
      setBulbLit(false);
      setFloatingAffirm(null);
      setStars([]);
    }, 1400);
  };

  const handleSpeakToWater = () => {
    if (!activeThemeId) { alert("请先选择一个主题包"); return; }
    const theme = themes.find(t => t.id === activeThemeId);
    if (!theme || !theme.affirmations || theme.affirmations.length === 0) {
      alert("该主题包下暂无肯定语");
      return;
    }
    const picked = [...theme.affirmations].sort(() => 0.5 - Math.random()).slice(0, 5);
    setSelectedAffirmations(picked);
  };

  const handleDrinkWater = () => {
    if (isDrinking) return;
    setIsDrinking(true);
    
    const interval = setInterval(() => {
      setWaterLevel(prev => {
        if (prev <= 0) {
          clearInterval(interval);
          setTimeout(() => {
            setWaterLevel(75); // Reset to 3/4 full
            setIsDrinking(false);
            setSelectedAffirmations([]);
          }, 1000);
          return 0;
        }
        return prev - 1.5; // Slightly slower/smoother descent
      });
    }, 40);
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setCustomBg(reader.result as string);
          StorageService.saveCounterBg(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const resetBg = () => {
    setCustomBg(null);
    localStorage.removeItem('counter_bg');
  };

  const currentCount = counts.find(c => c.themeId === activeThemeId)?.count || 0;
  const countStr = currentCount.toString();
  const displayCount = countStr.length < 6 ? countStr.padStart(6, '0') : countStr;

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="nav-header">
        <button onClick={() => setSubTab('theme')} className={`nav-tab-item ${subTab === 'theme' ? 'active' : ''}`}>主题</button>
        <button onClick={() => setSubTab('generate')} className={`nav-tab-item ${subTab === 'generate' ? 'active' : ''}`}>生成</button>
        <button onClick={() => setSubTab('practice')} className={`nav-tab-item ${subTab === 'practice' ? 'active' : ''}`}>实践</button>
      </header>

      <div className="flex-1 overflow-hidden p-5 flex flex-col fade-in">
        {subTab === 'generate' && (
          <div className="flex-1 flex flex-col gap-5 overflow-hidden">
            <div className="flex bg-[#F7F7F5] p-1 border border-[#D1D1CF] rounded-md shadow-inner">
              <button onClick={() => setGenMode('AI')} className={`flex-1 py-2 text-[12px] font-bold rounded ${genMode === 'AI' ? 'bg-[#2C2C2E] text-white shadow-sm' : 'text-[#8E8E93]'}`}>宇宙自动生成</button>
              <button onClick={() => setGenMode('Manual')} className={`flex-1 py-2 text-[12px] font-bold rounded ${genMode === 'Manual' ? 'bg-[#2C2C2E] text-white shadow-sm' : 'text-[#8E8E93]'}`}>自定义填写</button>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">显化主题</p>
              <input 
                type="text" 
                value={themeInput} 
                onChange={(e) => setThemeInput(e.target.value)} 
                placeholder="想要肯定的目标主题..." 
                className="braun-input font-bold" 
              />
            </div>

            {genMode === 'AI' ? (
              <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                <button 
                  onClick={handleGenerate} 
                  disabled={isGenerating}
                  className="w-full py-3.5 bg-[#2C2C2E] text-white text-[13px] font-bold uppercase tracking-widest rounded active:scale-[0.98] transition-all"
                >
                  {isGenerating ? '显化场对齐中...' : '生成肯定语'}
                </button>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {(generatedList || []).map((item, i) => (
                    <div 
                      key={i} 
                      onClick={() => setSelectedToSave(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])} 
                      className={`p-4 rounded border text-[13px] leading-relaxed cursor-pointer transition-all ${selectedToSave.includes(i) ? 'border-[#EF7C1C] bg-[#EF7C1C]/5 font-bold' : 'border-[#D1D1CF] bg-[#F7F7F5]'}`}
                    >
                      {item}
                    </div>
                  ))}
                </div>
                {generatedList && generatedList.length > 0 && (
                  <button onClick={saveAffirmations} className="w-full py-4 bg-[#EF7C1C] text-white text-[13px] font-bold rounded shadow-lg">
                    保存选中肯定语 ({selectedToSave.length})
                  </button>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {manualLines.map((line, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input 
                        type="text" 
                        value={line} 
                        onChange={(e) => { const n = [...manualLines]; n[idx] = e.target.value; setManualLines(n); }} 
                        className="braun-input flex-1" 
                        placeholder={`肯定语条目 ${idx + 1}...`} 
                      />
                      <button onClick={() => setManualLines(manualLines.filter((_, i) => i !== idx))} className="text-[#D1D1CF]"><Trash2 size={16} /></button>
                    </div>
                  ))}
                  <button onClick={() => setManualLines([...manualLines, ''])} className="text-[12px] font-bold text-[#EF7C1C] flex items-center gap-1 py-1">+ 添加新条目</button>
                </div>
                <button onClick={saveAffirmations} className="w-full py-4 bg-[#2C2C2E] text-white text-[14px] font-bold rounded shadow-lg">存入主题库</button>
              </div>
            )}
          </div>
        )}

        {subTab === 'theme' && (
          <div className="flex-1 overflow-y-auto space-y-5 pr-1 pb-10">
            {(!themes || themes.length === 0) ? (
              <div className="text-center py-20 opacity-20">
                <Music size={48} className="mx-auto" />
                <p className="mt-4 text-[12px] uppercase font-bold tracking-widest">暂无主题包</p>
              </div>
            ) : themes.map((theme) => (
              <div key={theme.id} className="bg-[#F7F7F5] border border-[#D1D1CF] rounded-lg shadow-sm flex flex-col h-[280px]">
                <div className="p-4 flex justify-between items-center border-b border-[#D1D1CF] bg-white rounded-t-lg">
                  <h3 className="font-bold text-[14px] text-[#2C2C2E] uppercase tracking-wide truncate pr-2">{theme.title}</h3>
                  <div className="flex gap-3 flex-shrink-0">
                    <button 
                      onClick={() => speakAffirmationsLoop(theme.id, theme.affirmations)} 
                      className={`transition-colors p-1 ${isSpeakingThemeId === theme.id ? 'text-[#EF7C1C] animate-pulse' : 'text-[#8E8E93] hover:text-[#2C2C2E]'}`}
                    >
                      <Volume2 size={20} />
                    </button>
                    <button onClick={() => handleDeleteTheme(theme.id)} className="p-1">
                      <Trash2 size={18} className="text-[#8E8E93] hover:text-red-500" />
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {(theme.affirmations || []).map((aff, i) => (
                    <div key={i} className="flex flex-col gap-2 group p-2.5 rounded hover:bg-white/60 transition-colors border border-transparent hover:border-[#EDEDEB]">
                      {editingAffIndex?.themeId === theme.id && editingAffIndex?.index === i ? (
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={editValue} 
                            onChange={(e) => setEditValue(e.target.value)}
                            className="flex-1 text-[13px] bg-white border border-[#2C2C2E] px-2 py-1 rounded"
                            autoFocus
                          />
                          <button onClick={() => handleSaveEdit(theme.id, i)} className="text-[#EF7C1C]"><Check size={18} /></button>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-[13px] text-[#2C2C2E] leading-relaxed flex-1 font-medium italic">“{aff}”</p>
                          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleStartEdit(theme.id, i, aff)} className="p-1 text-[#8E8E93] hover:text-[#2C2C2E]"><Edit3 size={16} /></button>
                            <button onClick={() => handleDeleteAffirmationLine(theme.id, i)} className="p-1 text-[#8E8E93] hover:text-red-500"><Trash2 size={16} /></button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 border-t border-[#D1D1CF] bg-white/50 rounded-b-lg flex justify-between items-center">
                   <span className="text-[9px] font-mono text-[#8E8E93] font-bold uppercase tracking-tighter">Capacity: {theme.affirmations.length} items</span>
                   <div className="flex gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${isSpeakingThemeId === theme.id ? 'bg-[#EF7C1C] animate-pulse' : 'bg-[#D1D1CF]'}`} />
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {subTab === 'practice' && (
          <div className="flex-1 flex flex-col gap-5 overflow-hidden relative">
            {showStats && (
              <div className="absolute inset-0 z-50 bg-white fade-in p-6 flex flex-col">
                <div className="flex justify-between items-center border-b border-[#2C2C2E] pb-3 mb-6">
                  <span className="text-[14px] font-bold uppercase tracking-widest">能量档案馆</span>
                  <button onClick={() => setShowStats(false)}><X size={24} /></button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-6">
                  {(counts || []).map(c => {
                    const theme = themes.find(t => t.id === c.themeId);
                    return (
                      <div key={c.themeId} className="space-y-2">
                        <div className="flex justify-between text-[13px] font-bold"><span>{theme?.title || 'Unknown'}</span><span className="text-[#EF7C1C]">{c.count} 次</span></div>
                        <div className="h-2.5 bg-[#F7F7F5] border border-[#D1D1CF] rounded-full overflow-hidden shadow-inner">
                           <div className="h-full bg-[#EF7C1C] transition-all duration-500" style={{ width: `${Math.min(100, (c.count / 100) * 100)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex bg-[#F7F7F5] p-1 border border-[#D1D1CF] rounded-md">
              <button onClick={() => setPracticeMode('counter')} className={`flex-1 py-2 text-[12px] font-bold rounded ${practiceMode === 'counter' ? 'bg-[#2C2C2E] text-white shadow-sm' : 'text-[#8E8E93]'}`}>计数器</button>
              <button onClick={() => setPracticeMode('water')} className={`flex-1 py-2 text-[12px] font-bold rounded ${practiceMode === 'water' ? 'bg-[#2C2C2E] text-white shadow-sm' : 'text-[#8E8E93]'}`}>能量水</button>
            </div>

            <select 
              className="w-full bg-white border border-[#D1D1CF] px-4 py-3 text-[13px] font-bold rounded shadow-sm" 
              value={activeThemeId || ''} 
              onChange={(e) => setActiveThemeId(e.target.value)}
            >
              <option value="">选择一个肯定主题...</option>
              {(themes || []).map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>

            {practiceMode === 'counter' ? (
              <div className={`flex-1 border border-[#D1D1CF] rounded-xl flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 ${!customBg ? 'dot-pattern' : 'bg-white'}`}>
                {customBg && <img src={customBg} className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none" />}
                
                <div className="absolute inset-0 z-50 pointer-events-none">
                   {stars.map(star => (
                     <Sparkles 
                       key={star.id} 
                       size={star.size} 
                       className="absolute text-white drop-shadow-[0_0_12px_rgba(255,255,255,1)] fade-static" 
                       style={{ left: `${star.x}%`, top: `${star.y}%` }}
                     />
                   ))}
                   {floatingAffirm && (
                     <div 
                       className="absolute text-center px-4 fade-static" 
                       style={{ 
                         left: `${floatingAffirm.x}%`, 
                         top: `${floatingAffirm.y}%`, 
                         transform: 'translate(-50%, -50%)',
                         width: 'max-content',
                         maxWidth: '320px',
                         zIndex: 99 
                       }}
                     >
                       <p className="text-[20px] font-bold text-[#EF7C1C] font-serif italic drop-shadow-[0_2px_15px_rgba(0,0,0,0.3)] bg-white/40 backdrop-blur-[6px] py-2 px-5 rounded-2xl border border-white/50 shadow-2xl scale-110">
                         “{floatingAffirm.text}”
                       </p>
                     </div>
                   )}
                </div>

                <div className="flex flex-col items-center gap-16 z-20 mt-16">
                  <button 
                    onClick={triggerCounter}
                    className={`group w-36 h-36 rounded-full border-4 flex items-center justify-center transition-all duration-300 active:scale-90 shadow-lg ${bulbLit ? 'border-[#EF7C1C] bg-white shadow-[0_0_60px_rgba(239,124,28,0.5)]' : 'border-[#D1D1CF] bg-white hover:border-[#8E8E93]'}`}
                  >
                    <Lightbulb size={68} className={bulbLit ? 'text-[#EF7C1C] fill-[#EF7C1C]' : 'text-[#D1D1CF] transition-colors group-hover:text-[#8E8E93]'} />
                  </button>

                  <div className="flex flex-col items-center gap-2">
                    <div className={`digital-counter min-w-[110px] text-center transition-all border border-[#EF7C1C]/30 ${displayCount.length > 7 ? 'text-[16px]' : displayCount.length > 5 ? 'text-[19px]' : 'text-[21px]'}`}>
                      {displayCount}
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-4 left-4 right-4 flex justify-between z-30">
                   <div className="flex gap-2">
                     <label className="cursor-pointer p-3.5 bg-white/95 rounded-full border border-[#D1D1CF] shadow-md hover:bg-white active:scale-95 transition-all">
                        <Camera size={19} className="text-[#2C2C2E]" />
                        <input type="file" className="hidden" onChange={handleBgUpload} />
                     </label>
                     {customBg && (
                        <button 
                          onClick={resetBg}
                          className="p-3.5 bg-white/95 rounded-full border border-[#D1D1CF] shadow-md hover:bg-white active:scale-95 transition-all"
                        >
                          <RotateCcw size={19} className="text-[#EF7C1C]" />
                        </button>
                     )}
                   </div>
                   <button 
                    onClick={() => setShowStats(true)} 
                    className="p-3.5 bg-white/95 rounded-full border border-[#D1D1CF] shadow-md hover:bg-white active:scale-95 transition-all"
                   >
                    <BarChart2 size={19} className="text-[#2C2C2E]" />
                   </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-10 py-4">
                <div 
                  className="relative flex flex-col items-center justify-end w-[180px] h-[210px]"
                >
                  {/* Flat Style Cup Background and Outline - Slightly shorter */}
                  <div 
                    className="absolute inset-0 bg-[#F7F7F5] border-[3px] border-[#D1D1CF] rounded-b-sm overflow-hidden" 
                    style={{ clipPath: 'polygon(0% 0%, 100% 0%, 85% 100%, 15% 100%)' }} 
                  >
                    {/* Solid Flat Color Water Layer - Contained within the cup's clip area */}
                    <div 
                      className="absolute bottom-0 left-0 right-0 w-full transition-all duration-700 ease-in-out" 
                      style={{ 
                        height: `${waterLevel}%`, 
                        backgroundColor: '#5ddbfd',
                      }}
                    >
                      {selectedAffirmations.length > 0 && waterLevel > 15 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-[#2C2C2E] text-center font-serif italic fade-in">
                          {selectedAffirmations.map((a, idx) => (
                            <p key={idx} className="text-[11px] leading-tight font-bold opacity-80 animate-pulse" style={{ animationDelay: `${idx * 200}ms` }}>
                              “{a}”
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={selectedAffirmations.length === 0 ? handleSpeakToWater : handleDrinkWater} 
                  disabled={isDrinking}
                  className="px-10 py-3.5 bg-[#2C2C2E] text-white text-[13px] font-bold tracking-[0.2em] shadow-lg uppercase rounded-full active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center min-w-[160px]"
                >
                  {isDrinking ? '能量吸收中...' : (selectedAffirmations.length > 0 ? '饮尽能量' : '对水说')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AffirmationPage;
