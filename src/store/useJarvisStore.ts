import { create } from 'zustand';
import { JarvisStatus } from '../types';

interface PCStats {
  git: {
    branch: string;
    commit: string;
    changed: number;
  };
  window: string;
}

interface JarvisStore {
  connected: boolean;
  status: JarvisStatus;
  pcStats: PCStats | null;
  setConnected: (val: boolean) => void;
  setStatus: (val: Partial<JarvisStatus>) => void;
  setPCStats: (val: PCStats) => void;
}

export const useJarvisStore = create<JarvisStore>(set => ({
  connected: false,
  pcStats: null,
  status: {
    connected: false,
    mode: 'idle',
    uptime: '0m',
    model: 'Llama 3.3',
    cpu: 0,
    ram: 0,
  },
  setConnected: val => set({ connected: val }),
  setStatus: val => set(state => ({ status: { ...state.status, ...val } })),
  setPCStats: val => set({ pcStats: val }),
}));
