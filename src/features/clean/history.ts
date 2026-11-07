import { create } from "zustand";

export interface Recent {
  id: number;
  at: number;
  original: string;
  cleaned: string;
}

interface HistoryState {
  items: Recent[];
  add: (original: string, cleaned: string) => void;
  clear: () => void;
}

export const HISTORY_LIMIT = 10;

let nextId = 1;

// Kept in memory only: nothing the person copied is written to disk, and it is gone when the app quits.
export const useHistory = create<HistoryState>((set) => ({
  items: [],
  add: (original, cleaned) =>
    set((s) => ({
      items: [{ id: nextId++, at: Date.now(), original, cleaned }, ...s.items].slice(
        0,
        HISTORY_LIMIT,
      ),
    })),
  clear: () => set({ items: [] }),
}));
