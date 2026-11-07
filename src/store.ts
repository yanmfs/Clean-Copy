import { useCallback } from "react";
import { create } from "zustand";
import { resolveLang, translate, type Key, type Lang } from "./i18n";
import { platform } from "./platform";
import { defaultSettings, parseSettings, type Settings } from "./settings";

interface AppState {
  settings: Settings;
  ready: boolean;
  shortcutError: string | null;
  settingsOpen: boolean;
  aboutOpen: boolean;
  optionsOpen: boolean;
  hydrate: () => Promise<void>;
  update: (patch: Partial<Settings>) => void;
  setOptions: (patch: Partial<Settings["options"]>) => void;
  setShortcutError: (shortcut: string | null) => void;
  setDialog: (dialog: "settingsOpen" | "aboutOpen" | "optionsOpen", open: boolean) => void;
}

export const useApp = create<AppState>((set, get) => ({
  settings: defaultSettings(platform.os),
  ready: false,
  shortcutError: null,
  settingsOpen: false,
  aboutOpen: false,
  optionsOpen: false,

  hydrate: async () => {
    const saved = parseSettings(await platform.loadSettings().catch(() => null), platform.os);
    set({ settings: saved, ready: true });
  },

  update: (patch) => {
    const settings = { ...get().settings, ...patch };
    set({ settings });
    void platform.saveSettings(settings);
  },

  setOptions: (patch) => get().update({ options: { ...get().settings.options, ...patch } }),
  setShortcutError: (shortcutError) => set({ shortcutError }),
  setDialog: (dialog, open) => set({ [dialog]: open }),
}));

export const selectLang = (s: { settings: Settings }): Lang =>
  resolveLang(s.settings.language, platform.systemLocale);

type Vars = Record<string, string | number>;

export function useT() {
  const lang = useApp(selectLang);
  return useCallback((key: Key, vars?: Vars) => translate(lang, key, vars), [lang]);
}

export const tNow = (key: Key, vars?: Vars) => translate(selectLang(useApp.getState()), key, vars);
