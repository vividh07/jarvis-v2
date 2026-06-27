const get = (key: string, fallback = ''): string =>
  process.env[key] ?? fallback;

export const env = {
  weatherApiKey: get('EXPO_PUBLIC_WEATHER_API_KEY'),
  weatherCity: get('EXPO_PUBLIC_WEATHER_CITY', 'Noida'),
  newsApiKey: get('EXPO_PUBLIC_NEWS_API_KEY'),
  newsCountry: get('EXPO_PUBLIC_NEWS_COUNTRY', 'in'),
  spotifyClientId: get('EXPO_PUBLIC_SPOTIFY_CLIENT_ID'),
  spotifyClientSecret: get('EXPO_PUBLIC_SPOTIFY_CLIENT_SECRET'),
  googleClientId: get('EXPO_PUBLIC_GOOGLE_CLIENT_ID'),
  googleClientSecret: get('EXPO_PUBLIC_GOOGLE_CLIENT_SECRET'),
};
