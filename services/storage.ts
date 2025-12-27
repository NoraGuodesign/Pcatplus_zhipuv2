
import { GratitudeEntry, AffirmationTheme, PracticeCount } from '../types';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

// Utility to compress images if they are base64 strings to save space
const compressImage = async (base64Str: string, maxWidth = 800, quality = 0.6): Promise<string> => {
  if (!base64Str.startsWith('data:image')) return base64Str;
  
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64Str);
  });
};

const safeParse = <T>(key: string, fallback: T): T => {
  try {
    const data = localStorage.getItem(key);
    if (!data || data === 'undefined' || data === 'null') return fallback;
    const parsed = JSON.parse(data);
    
    if (Array.isArray(fallback) && !Array.isArray(parsed)) {
      return fallback;
    }
    
    return parsed as T;
  } catch (e) {
    console.error(`Error parsing localStorage key "${key}":`, e);
    return fallback;
  }
};

const safeSave = (key: string, value: any): boolean => {
  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (e) {
    if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
      console.warn(`Storage quota exceeded for key "${key}". Freeing space...`);
      
      // If we're saving the archive, remove the oldest 50% of entries to make significant room
      if (key === 'gratitude_archive' && Array.isArray(value)) {
        if (value.length > 1) {
          const reducedValue = value.slice(0, Math.max(1, Math.floor(value.length * 0.5)));
          return safeSave(key, reducedValue);
        }
      }
      
      // If saving something else fails, try clearing half the archive to make room for metadata/configs
      const archive = safeParse('gratitude_archive', []);
      if (archive.length > 0) {
        localStorage.setItem('gratitude_archive', JSON.stringify(archive.slice(0, Math.floor(archive.length * 0.5))));
        return safeSave(key, value);
      }
    }
    console.error(`Error saving to localStorage key "${key}":`, e);
    return false;
  }
};

export const StorageService = {
  getGratitudeArchive: (): GratitudeEntry[] => 
    safeParse('gratitude_archive', []),
  
  saveGratitudeEntry: async (entry: GratitudeEntry): Promise<boolean> => {
    // Compress photos before saving to stay within quota
    const compressedPhotos = entry.photos ? await Promise.all(entry.photos.map(p => compressImage(p))) : [];
    const entryToSave = { ...entry, photos: compressedPhotos };
    
    const archive = StorageService.getGratitudeArchive();
    return safeSave('gratitude_archive', [entryToSave, ...archive]);
  },

  getAffirmationThemes: (): AffirmationTheme[] => 
    safeParse('affirm_themes', []),

  saveAffirmationThemes: (themes: AffirmationTheme[]) => 
    safeSave('affirm_themes', themes),

  getPracticeCounts: (): PracticeCount[] => 
    safeParse('affirm_counts', []),

  savePracticeCounts: (counts: PracticeCount[]) => 
    safeSave('affirm_counts', counts),

  getChatHistory: (): ChatMessage[] => 
    safeParse('universe_chat', []),

  saveChatMessage: (msg: ChatMessage) => {
    const history = StorageService.getChatHistory();
    // Keep only last 20 messages to prevent chat history from eating quota
    const truncatedHistory = [...history, msg].slice(-20);
    safeSave('universe_chat', truncatedHistory);
  },
  
  getCounterBg: (): string | null => {
    try {
      return localStorage.getItem('counter_bg');
    } catch {
      return null;
    }
  },
  
  saveCounterBg: async (bg: string) => {
    const compressedBg = await compressImage(bg, 1200, 0.5);
    return safeSave('counter_bg', compressedBg);
  },

  clearChat: () => {
    try {
      localStorage.removeItem('universe_chat');
    } catch {}
  }
};
