import { create } from 'zustand';
import {
  getCurrentTrack,
  play,
  pause,
  next,
  previous,
  searchAndPlay,
  searchTracks,
  playTrackUri,
  syncMusicFace,
  isAuthenticated,
  SpotifyResult,
  SpotifySearchTrack,
} from '../services/spotifyService';

let lastFaceSyncKey = '';

interface SpotifyStore {
  playing: boolean;
  trackName: string;
  artistName: string;
  imageUrl: string | null;
  progressMs: number;
  durationMs: number;
  linked: boolean;
  searchResults: SpotifySearchTrack[];
  searching: boolean;
  setLinked: (val: boolean) => void;
  fetchTrack: () => Promise<void>;
  tickProgress: () => void;
  play: () => Promise<SpotifyResult>;
  pause: () => Promise<SpotifyResult>;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  search: (query: string) => Promise<string | false>;
  searchTracks: (query: string) => Promise<void>;
  playTrack: (uri: string) => Promise<SpotifyResult>;
  clearSearch: () => void;
}

export const useSpotifyStore = create<SpotifyStore>((set, get) => ({
  playing: false,
  trackName: 'Not playing',
  artistName: '',
  imageUrl: null,
  progressMs: 0,
  durationMs: 0,
  linked: false,
  searchResults: [],
  searching: false,

  setLinked: val => set({ linked: val }),

  fetchTrack: async () => {
    if (!isAuthenticated()) return;
    const track = await getCurrentTrack();
    if (track) {
      set({
        trackName: track.name,
        artistName: track.artist,
        playing: track.playing,
        imageUrl: track.image,
        progressMs: track.progressMs,
        durationMs: track.durationMs,
      });
      const syncKey = `${track.id}:${track.playing}`;
      if (syncKey !== lastFaceSyncKey) {
        lastFaceSyncKey = syncKey;
        await syncMusicFace(track.playing, track.id);
      }
    } else if (lastFaceSyncKey !== 'stopped') {
      lastFaceSyncKey = 'stopped';
      await syncMusicFace(false);
    }
  },

  tickProgress: () => {
    const { playing, progressMs, durationMs } = get();
    if (playing && durationMs > 0 && progressMs < durationMs) {
      set({ progressMs: Math.min(progressMs + 1000, durationMs) });
    }
  },

  play: async () => {
    const result = await play();
    if (result.ok) {
      set({ playing: true });
      setTimeout(() => get().fetchTrack(), 500);
    }
    return result;
  },

  pause: async () => {
    const result = await pause();
    if (result.ok) {
      set({ playing: false });
      lastFaceSyncKey = 'stopped';
      await syncMusicFace(false);
    }
    return result;
  },

  next: async () => {
    await next();
    setTimeout(() => get().fetchTrack(), 500);
  },

  previous: async () => {
    await previous();
    setTimeout(() => get().fetchTrack(), 500);
  },

  search: async (query: string) => {
    return await searchAndPlay(query);
  },

  searchTracks: async (query: string) => {
    set({ searching: true });
    const results = await searchTracks(query);
    set({ searchResults: results, searching: false });
  },

  playTrack: async (uri: string) => {
    const result = await playTrackUri(uri);
    if (result.ok) {
      set({ playing: true, searchResults: [] });
      setTimeout(() => get().fetchTrack(), 800);
    }
    return result;
  },

  clearSearch: () => set({ searchResults: [] }),
}));
