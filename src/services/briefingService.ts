import { fetchWeather } from './weatherService';
import { fetchTopNews } from './newsService';

export interface Briefing {
  greeting: string;
  weather: string;
  reminders: string;
  news: string[];
}

export const generateBriefing = async (): Promise<Briefing> => {
  const hour = new Date().getHours();

  const greeting =
    hour < 12 ? 'Good morning' :
    hour < 17 ? 'Good afternoon' :
    'Good evening';

  const weather = await fetchWeather();
  const weatherText = weather
    ? `It's ${weather.temp}°C in ${weather.city}, ${weather.condition}.`
    : 'Weather unavailable.';

  const news = await fetchTopNews();
  const newsArr = news.map(n => n.title);

  return {
    greeting,
    weather: weatherText,
    reminders: 'You have 3 reminders today.',
    news: newsArr,
  };
};
