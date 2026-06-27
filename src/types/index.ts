export interface Message {
  id: string;
  role: 'user' | 'jarvis';
  text: string;
  timestamp: number;
}

export interface Reminder {
  id: string;
  title: string;
  time: string;
  color: string;
}

export interface JarvisStatus {
  connected: boolean;
  mode: 'idle' | 'listening' | 'thinking' | 'speaking';
  uptime: string;
  model: string;
  cpu: number;
  ram: number;
}

export interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  wind: number;
  condition: string;
  city: string;
}

export interface HistoryItem {
  id: string;
  title: string;
  preview: string;
  timestamp: number;
}

export interface Settings {
  agentName: string;
  userName: string;
  connected: boolean;
  spotifyLinked: boolean;
}
