import { create } from 'zustand';
import { WeatherData, fetchWeather } from '../services/weatherService';

interface WeatherStore {
  weather: WeatherData | null;
  loading: boolean;
  lastUpdated: number | null;
  fetchWeather: () => Promise<void>;
}

export const useWeatherStore = create<WeatherStore>(set => ({
  weather: null,
  loading: false,
  lastUpdated: null,

  fetchWeather: async () => {
    set({ loading: true });
    const data = await fetchWeather();
    set({
      weather: data,
      loading: false,
      lastUpdated: Date.now(),
    });
  },
}));
