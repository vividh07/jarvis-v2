import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { socketService } from './socketService';

WebBrowser.maybeCompleteAuthSession();

import { env } from '../config/env';

const CLIENT_ID = env.spotifyClientId;
const CLIENT_SECRET = env.spotifyClientSecret;
const REDIRECT_URI = 'jarvis://callback';
const SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'streaming',
  'playlist-read-private',
  'user-library-read',
].join(' ');

const ACCESS_TOKEN_KEY = 'spotify_access_token';
const REFRESH_TOKEN_KEY = 'spotify_refresh_token';
const EXPIRY_KEY = 'spotify_token_expiry';

let accessToken: string | null = null;
let refreshTokenValue: string | null = null;
let tokenExpiry: number = 0;
let audioFeaturesBlocked = false;

const saveTokens = async () => {
  if (!accessToken) return;
  await AsyncStorage.multiSet([
    [ACCESS_TOKEN_KEY, accessToken],
    [REFRESH_TOKEN_KEY, refreshTokenValue || ''],
    [EXPIRY_KEY, String(tokenExpiry)],
  ]);
};

const clearStoredTokens = async () => {
  accessToken = null;
  refreshTokenValue = null;
  tokenExpiry = 0;
  await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, EXPIRY_KEY]);
};

export const loadStoredTokens = async (): Promise<boolean> => {
  try {
    const pairs = await AsyncStorage.multiGet([
      ACCESS_TOKEN_KEY,
      REFRESH_TOKEN_KEY,
      EXPIRY_KEY,
    ]);
    const storedAccess = pairs[0][1];
    const storedRefresh = pairs[1][1];
    const storedExpiry = pairs[2][1];

    if (!storedAccess) return false;

    accessToken = storedAccess;
    refreshTokenValue = storedRefresh || null;
    tokenExpiry = storedExpiry ? Number(storedExpiry) : 0;

    if (Date.now() >= tokenExpiry && refreshTokenValue) {
      return await refreshToken(refreshTokenValue);
    }

    return isAuthenticated();
  } catch (e) {
    console.error('Spotify token load error:', e);
    return false;
  }
};

export const getAuthUrl = (): string => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
  });
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
};

export const exchangeCode = async (code: string): Promise<boolean> => {
  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + btoa(`${CLIENT_ID}:${CLIENT_SECRET}`),
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
      }).toString(),
    });

    if (response.ok) {
      const data = await response.json();
      accessToken = data.access_token;
      refreshTokenValue = data.refresh_token || refreshTokenValue;
      tokenExpiry = Date.now() + data.expires_in * 1000;
      await saveTokens();
      return true;
    }
    return false;
  } catch (e) {
    console.error('Spotify auth error:', e);
    return false;
  }
};

export const refreshToken = async (refresh: string): Promise<boolean> => {
  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + btoa(`${CLIENT_ID}:${CLIENT_SECRET}`),
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refresh,
      }).toString(),
    });

    if (response.ok) {
      const data = await response.json();
      accessToken = data.access_token;
      tokenExpiry = Date.now() + data.expires_in * 1000;
      if (data.refresh_token) {
        refreshTokenValue = data.refresh_token;
      }
      await saveTokens();
      return true;
    }
    return false;
  } catch (e) {
    console.error('Spotify refresh error:', e);
    return false;
  }
};

export const linkSpotify = async (): Promise<boolean> => {
  const result = await WebBrowser.openAuthSessionAsync(getAuthUrl(), REDIRECT_URI);
  if (result.type !== 'success' || !result.url) return false;

  const parsed = Linking.parse(result.url);
  const code = parsed.queryParams?.code;
  if (typeof code !== 'string') return false;

  return exchangeCode(code);
};

export const unlinkSpotify = async (): Promise<void> => {
  await clearStoredTokens();
};

const spotifyFetch = async (
  endpoint: string,
  method: string = 'GET',
  body?: object
): Promise<any | null> => {
  if (!accessToken) return null;

  if (Date.now() >= tokenExpiry && refreshTokenValue) {
    const refreshed = await refreshToken(refreshTokenValue);
    if (!refreshed) return null;
  }

  try {
    const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 204) {
      return method === 'GET' ? null : { success: true };
    }
    if (response.status === 403 && endpoint.includes('/audio-features')) {
      if (!audioFeaturesBlocked) {
        console.warn('Spotify audio-features blocked (403) — face sync uses 120 BPM');
        audioFeaturesBlocked = true;
      }
      return null;
    }
    if (response.ok) {
      const text = await response.text();
      if (!text) return { success: true };
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    }
    console.warn('Spotify API error:', response.status, endpoint);
    return null;
  } catch (e) {
    console.error('Spotify fetch error:', e);
    return null;
  }
};

const isUnsupportedDevice = (device: { id: string; type: string }) =>
  device.id.includes('amzn') || device.type === 'Speaker';

const getActiveDeviceId = async (): Promise<string | null> => {
  const data = await spotifyFetch('/me/player/devices');
  if (!data?.devices?.length) return null;

  const devices = data.devices.filter((d: { id: string; type: string }) => !isUnsupportedDevice(d));
  const pool = devices.length ? devices : data.devices;

  const active = pool.find((d: { is_active: boolean }) => d.is_active);
  if (active) return active.id;

  const computer = pool.find((d: { type: string }) => d.type === 'Computer');
  if (computer) return computer.id;

  const phone = pool.find((d: { type: string }) => d.type === 'Smartphone');
  if (phone) return phone.id;

  return pool[0].id;
};

export interface SpotifySearchTrack {
  id: string;
  uri: string;
  name: string;
  artist: string;
  image: string | null;
  durationMs: number;
}

export const searchTracks = async (query: string): Promise<SpotifySearchTrack[]> => {
  if (!query.trim() || !isAuthenticated()) return [];

  const data = await spotifyFetch(
    `/search?q=${encodeURIComponent(query)}&type=track&limit=8`
  );
  if (!data?.tracks?.items) return [];

  return data.tracks.items.map((item: any) => ({
    id: item.id,
    uri: item.uri,
    name: item.name,
    artist: item.artists?.[0]?.name || 'Unknown',
    image: item.album?.images?.[1]?.url || item.album?.images?.[0]?.url || null,
    durationMs: item.duration_ms,
  }));
};

export const playTrackUri = async (uri: string): Promise<SpotifyResult> => {
  if (!isAuthenticated()) return { ok: false, error: 'not_linked' };

  const deviceId = await getActiveDeviceId();
  if (!deviceId) return { ok: false, error: 'no_device' };

  const result = await spotifyFetch(`/me/player/play?device_id=${deviceId}`, 'PUT', {
    uris: [uri],
  });
  return result ? { ok: true } : { ok: false, error: 'api_failed' };
};

export type SpotifyResult = { ok: boolean; error?: 'not_linked' | 'no_device' | 'api_failed' };

export const play = async (): Promise<SpotifyResult> => {
  if (!isAuthenticated()) return { ok: false, error: 'not_linked' };

  const deviceId = await getActiveDeviceId();
  if (!deviceId) return { ok: false, error: 'no_device' };

  const result = await spotifyFetch(`/me/player/play?device_id=${deviceId}`, 'PUT');
  return result ? { ok: true } : { ok: false, error: 'api_failed' };
};

export const pause = async (): Promise<SpotifyResult> => {
  if (!isAuthenticated()) return { ok: false, error: 'not_linked' };

  const deviceId = await getActiveDeviceId();
  const endpoint = deviceId
    ? `/me/player/pause?device_id=${deviceId}`
    : '/me/player/pause';
  const result = await spotifyFetch(endpoint, 'PUT');
  return result ? { ok: true } : { ok: false, error: 'api_failed' };
};

export const getCurrentTrack = async () => {
  const data = await spotifyFetch('/me/player/currently-playing');
  if (!data?.item) return null;
  return {
    id: data.item.id as string,
    name: data.item.name,
    artist: data.item.artists[0].name,
    playing: data.is_playing,
    image: data.item.album.images[0]?.url || data.item.album.images[1]?.url || null,
    progressMs: data.progress_ms ?? 0,
    durationMs: data.item.duration_ms ?? 0,
  };
};

export const getTrackTempo = async (_trackId: string): Promise<number> => {
  if (audioFeaturesBlocked) return 120;

  const data = await spotifyFetch(`/audio-features/${_trackId}`);
  if (data?.tempo) return Math.round(data.tempo);

  return 120;
};

export const next = async () => {
  return await spotifyFetch('/me/player/next', 'POST');
};

export const previous = async () => {
  return await spotifyFetch('/me/player/previous', 'POST');
};

export const setVolume = async (percent: number) => {
  return await spotifyFetch(`/me/player/volume?volume_percent=${percent}`, 'PUT');
};

export const searchAndPlay = async (query: string) => {
  const deviceId = await getActiveDeviceId();
  if (!deviceId) return false;

  const data = await spotifyFetch(`/search?q=${encodeURIComponent(query)}&type=track,playlist&limit=1`);

  if (!data) return false;

  const playEndpoint = `/me/player/play?device_id=${deviceId}`;

  if (data.tracks?.items?.length > 0) {
    const uri = data.tracks.items[0].uri;
    const result = await spotifyFetch(playEndpoint, 'PUT', { uris: [uri] });
    return result ? data.tracks.items[0].name : false;
  }

  if (data.playlists?.items?.length > 0) {
    const uri = data.playlists.items[0].uri;
    const result = await spotifyFetch(playEndpoint, 'PUT', { context_uri: uri });
    return result ? data.playlists.items[0].name : false;
  }

  return false;
};

export const isAuthenticated = (): boolean => {
  if (!accessToken) return false;
  if (Date.now() < tokenExpiry) return true;
  return !!refreshTokenValue;
};

export const syncMusicFace = async (playing: boolean, trackId?: string | null) => {
  if (!socketService.isConnected()) return;
  if (!playing) {
    socketService.send('music_sync', { playing: false });
    return;
  }
  const tempo = trackId ? await getTrackTempo(trackId) : 120;
  socketService.send('music_sync', { playing: true, tempo });
};
