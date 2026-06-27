import { create } from 'zustand';
import { CalendarEvent, getTodayEvents, isCalendarLinked } from '../services/calendarService';

interface CalendarStore {
  events: CalendarEvent[];
  linked: boolean;
  loading: boolean;
  fetchEvents: () => Promise<void>;
  setLinked: (val: boolean) => void;
}

export const useCalendarStore = create<CalendarStore>(set => ({
  events: [],
  linked: false,
  loading: false,

  setLinked: val => set({ linked: val }),

  fetchEvents: async () => {
    if (!isCalendarLinked()) return;
    set({ loading: true });
    const events = await getTodayEvents();
    set({ events, loading: false });
  },
}));
