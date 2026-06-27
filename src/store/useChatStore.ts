import { create } from 'zustand';
import { Message } from '../types';

interface ChatStore {
  messages: Message[];
  addMessage: (message: Message) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>(set => ({
  messages: [
    {
      id: '1',
      role: 'jarvis',
      text: 'Good morning! Ready when you are.',
      timestamp: Date.now(),
    },
  ],
  addMessage: message =>
    set(state => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [] }),
}));
