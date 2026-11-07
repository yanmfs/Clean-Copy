import { defaultOptions, type CleanOptions } from "./core/clean";
import { defaultShortcut, type Os } from "./core/os";
import type { LangSetting } from "./i18n";

export type ThemeSetting = "system" | "light" | "dark";

export interface Settings {
  shortcut: string;
  showConfirmation: boolean;
  autostart: boolean;
  language: LangSetting;
  theme: ThemeSetting;
  options: CleanOptions;
  trayNoticeSeen: boolean;
}

export const defaultSettings = (os: Os): Settings => ({
  shortcut: defaultShortcut(os),
  showConfirmation: true,
  autostart: false,
  language: "auto",
  theme: "system",
  options: defaultOptions,
  trayNoticeSeen: false,
});

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const pick = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback;
const flag = (value: unknown, fallback: boolean) => (typeof value === "boolean" ? value : fallback);

// Stored settings can be missing fields (older versions) or hand-edited; fall back per field.
export function parseSettings(raw: unknown, os: Os): Settings {
  const base = defaultSettings(os);
  if (!isRecord(raw)) return base;
  const rawOptions = isRecord(raw.options) ? raw.options : {};
  const d = defaultOptions;
  return {
    shortcut: typeof raw.shortcut === "string" && raw.shortcut ? raw.shortcut : base.shortcut,
    showConfirmation: flag(raw.showConfirmation, base.showConfirmation),
    autostart: flag(raw.autostart, base.autostart),
    language: pick(raw.language, ["auto", "pt-BR", "en"], base.language),
    theme: pick(raw.theme, ["system", "light", "dark"], base.theme),
    trayNoticeSeen: flag(raw.trayNoticeSeen, base.trayNoticeSeen),
    options: {
      mode: pick(
        rawOptions.mode,
        ["paragraphs", "single-line", "spaces-only", "keep-lines"],
        d.mode,
      ),
      removePageNumbers: flag(rawOptions.removePageNumbers, d.removePageNumbers),
      removeRepeatedHeaders: flag(rawOptions.removeRepeatedHeaders, d.removeRepeatedHeaders),
      removeLineNumbers: flag(rawOptions.removeLineNumbers, d.removeLineNumbers),
      fixHyphenation: flag(rawOptions.fixHyphenation, d.fixHyphenation),
      fixLigatures: flag(rawOptions.fixLigatures, d.fixLigatures),
      paragraphSeparator: pick(
        rawOptions.paragraphSeparator,
        ["blank-line", "newline"],
        d.paragraphSeparator,
      ),
    },
  };
}
