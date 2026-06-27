import { env } from '../config/env';

const GOOGLE_CLIENT_ID = env.googleClientId;
const GOOGLE_CLIENT_SECRET = env.googleClientSecret;
const REDIRECT_URI = 'jarvis://calendar-callback';

let accessToken: string | null = null;
let refreshTokenValue: string | null = null;
let tokenExpiry: number = 0;

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
}

export const getCalendarAuthUrl = (): string => {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
    access_type: 'offline',
    prompt: 'consent',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

export const exchangeCalendarCode = async (code: string): Promise<boolean> => {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      }).toString(),
    });

    if (response.ok) {
      const data = await response.json();
      accessToken = data.access_token;
      refreshTokenValue = data.refresh_token;
      tokenExpiry = Date.now() + data.expires_in * 1000;
      return true;
    }
    return false;
  } catch (e) {
    console.error('Calendar auth error:', e);
    return false;
  }
};

const refreshCalendarToken = async (): Promise<boolean> => {
  if (!refreshTokenValue) return false;
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: refreshTokenValue,
        grant_type: 'refresh_token',
      }).toString(),
    });
    if (response.ok) {
      const data = await response.json();
      accessToken = data.access_token;
      tokenExpiry = Date.now() + data.expires_in * 1000;
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
};

export const getTodayEvents = async (): Promise<CalendarEvent[]> => {
  if (!accessToken) return [];
  if (Date.now() >= tokenExpiry) {
    const refreshed = await refreshCalendarToken();
    if (!refreshed) return [];
  }

  try {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(now.setHours(23, 59, 59, 999)).toISOString();

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${startOfDay}&timeMax=${endOfDay}&singleEvents=true&orderBy=startTime`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return (data.items || []).map((item: any) => ({
      id: item.id,
      title: item.summary || 'Untitled event',
      startTime: item.start.dateTime || item.start.date,
      endTime: item.end.dateTime || item.end.date,
      isAllDay: !item.start.dateTime,
    }));
  } catch (e) {
    console.error('Calendar fetch error:', e);
    return [];
  }
};

export const isCalendarLinked = (): boolean => !!accessToken;
