export type AIProvider = 'groq' | 'claude' | 'gemini';

export interface AIConfig {
  provider: AIProvider;
  name: string;
  description: string;
  icon: string;
}

export const AI_PROVIDERS: AIConfig[] = [
  {
    provider: 'groq',
    name: 'Groq · Llama 3.3 70B',
    description: 'Free, smarter replies (slower than 8B)',
    icon: '🆓',
  },
  {
    provider: 'gemini',
    name: 'Gemini Flash',
    description: 'Balanced speed and quality',
    icon: '⚡',
  },
];
