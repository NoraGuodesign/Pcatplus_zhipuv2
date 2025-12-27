
export type TabType = 'gratitude' | 'affirmation' | 'explore' | 'profile';

export interface GratitudeEntry {
  id: string;
  date: string;
  items: string[];
  photos: string[];
  universeLetter?: string;
}

export interface AffirmationTheme {
  id: string;
  title: string;
  affirmations: string[];
  createdAt: string;
}

export interface PracticeCount {
  themeId: string;
  count: number;
}
