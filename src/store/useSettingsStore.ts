import { create } from 'zustand';
import { AIProvider } from '../services/aiService';
import { socketService } from '../services/socketService';

interface SettingsStore {
  agentName: string;
  userName: string;
  spotifyLinked: boolean;
  briefingTime: string;
  aiProvider: AIProvider;
  setAgentName: (name: string) => void;
  setUserName: (name: string) => void;
  setSpotifyLinked: (val: boolean) => void;
  setBriefingTime: (time: string) => void;
  setAIProvider: (provider: AIProvider) => void;
}

export const useSettingsStore = create<SettingsStore>(set => ({
  agentName: 'Jarvis',
  userName: 'Vividh',
  spotifyLinked: false,
  briefingTime: '08:00',
  aiProvider: 'groq',
  setAgentName: name => set({ agentName: name }),
  setUserName: name => set({ userName: name }),
  setSpotifyLinked: val => set({ spotifyLinked: val }),
  setBriefingTime: time => set({ briefingTime: time }),
  setAIProvider: provider => {
    set({ aiProvider: provider });
    socketService.send('set_ai_provider', { provider });
  },
}));
