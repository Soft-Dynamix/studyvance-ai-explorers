// Zustand store for the StudyVance learner app.
import { create } from 'zustand';
import { isOnline, getQueueCount } from './offline';
import type { MissionId } from './curriculum';

export type Screen =
  | 'welcome' | 'signin' | 'avatar-select' | 'mission-map'
  | 'm1-lesson' | 'm1-sort' | 'm1-privacy' | 'm1-quiz' | 'm1-portfolio' | 'm1-reward'
  | 'lesson' | 'game' | 'quiz' | 'portfolio' | 'reward'
  | 'tutor';

export type LearnerProfile = {
  id: string; learnerCode: string; nickname: string; grade: string; avatarId: string;
  cohort: { id: string; name: string; gradeBand: string } | null;
};
export type LearnerState = {
  missions: Record<string, any>; badges: string[]; lastSyncAt: string | null; contentVersion?: string;
};

type AppState = {
  screen: Screen; currentMission: MissionId;
  learner: LearnerProfile | null; state: LearnerState | null;
  soundOn: boolean; reducedMotion: boolean; online: boolean; queueCount: number; forceOffline: boolean;
  setScreen: (s: Screen) => void; setCurrentMission: (m: MissionId) => void;
  setLearner: (l: LearnerProfile | null) => void; setState: (s: LearnerState | null) => void;
  setSoundOn: (on: boolean) => void; setReducedMotion: (on: boolean) => void;
  setOnline: (on: boolean) => void; setQueueCount: (n: number) => void;
  setForceOffline: (on: boolean) => void; refreshQueueCount: () => void;
};

export const useApp = create<AppState>((set) => ({
  screen: 'welcome', currentMission: 'm1', learner: null, state: null,
  soundOn: true, reducedMotion: false, online: true, queueCount: 0, forceOffline: false,
  setScreen: (screen) => set({ screen }),
  setCurrentMission: (currentMission) => set({ currentMission }),
  setLearner: (learner) => set({ learner }),
  setState: (state) => set({ state }),
  setSoundOn: (soundOn) => set({ soundOn }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setOnline: (online) => set({ online }),
  setQueueCount: (queueCount) => set({ queueCount }),
  setForceOffline: (forceOffline) => set({ forceOffline, online: !forceOffline }),
  refreshQueueCount: () => set({ queueCount: getQueueCount() }),
}));

export function initPrefsFromStorage() {
  if (typeof window === 'undefined') return;
  const savedSound = window.localStorage.getItem('sv_sound_on');
  if (savedSound !== null) useApp.getState().setSoundOn(savedSound === '1');
  const rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  useApp.getState().setReducedMotion(rm);
  useApp.getState().setOnline(isOnline());
  useApp.getState().refreshQueueCount();
  if ('ononline' in window) {
    window.addEventListener('online', () => useApp.getState().setOnline(isOnline()));
    window.addEventListener('offline', () => useApp.getState().setOnline(isOnline()));
  }
}

export function nextScreenFor(mission: MissionId, current: Screen): Screen {
  if (mission === 'm1') {
    const flow: Screen[] = ['m1-lesson', 'm1-sort', 'm1-privacy', 'm1-quiz', 'm1-portfolio', 'm1-reward'];
    const idx = flow.indexOf(current);
    return idx >= 0 && idx < flow.length - 1 ? flow[idx + 1] : 'mission-map';
  }
  const flow: Screen[] = ['lesson', 'game', 'quiz', 'portfolio', 'reward'];
  const idx = flow.indexOf(current);
  return idx >= 0 && idx < flow.length - 1 ? flow[idx + 1] : 'mission-map';
}
