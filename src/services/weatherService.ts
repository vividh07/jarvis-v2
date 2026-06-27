import { env } from '../config/env';

const API_KEY = env.weatherApiKey;
const CITY = env.weatherCity;
const UNITS = 'metric';

export interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  wind: number;
  condition: string;
  city: string;
  icon: string;
}

const getWeatherIcon = (condition: string): string => {
  const c = condition.toLowerCase();
  if (c.includes('clear')) return '☀️';
  if (c.includes('cloud')) return '⛅';
  if (c.includes('rain')) return '🌧️';
  if (c.includes('thunder')) return '⛈️';
  if (c.includes('snow')) return '❄️';
  if (c.includes('mist') || c.includes('fog')) return '🌫️';
  if (c.includes('haze')) return '🌫️';
  return '🌤️';
};

export const fetchWeather = async (): Promise<WeatherData | null> => {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${API_KEY}&units=${UNITS}`
    );

    if (!response.ok) {
      console.error('Weather API error:', response.status);
      return null;
    }

    const data = await response.json();

    return {
      temp: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      wind: Math.round(data.wind.speed * 3.6),
      condition: data.weather[0].description,
      city: data.name,
      icon: getWeatherIcon(data.weather[0].description),
    };
  } catch (e) {
    console.error('Weather fetch error:', e);
    return null;
  }
};
