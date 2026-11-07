import { detectOs, type Os } from "../core/os";
import { showToast } from "../toast";
import type { Platform } from "./types";

const KEY = "cleancopy:settings";

function osFromQuery(): Os | null {
  const value = new URLSearchParams(window.location.search).get("os");
  return value === "windows" || value === "macos" ? value : null;
}

// Used by the browser demo, the screenshots and the UI tests.
export const web: Platform = {
  os: osFromQuery() ?? detectOs(navigator.userAgent),
  systemLocale: navigator.language,
  hasGlobalShortcut: false,
  hasTray: false,
  hasHud: false,
  hasPaste: false,
  pasteAllowed: () => Promise.resolve(false),
  simulatePaste: () => Promise.resolve(),
  readClipboard: () => navigator.clipboard.readText(),
  writeClipboard: (text) => navigator.clipboard.writeText(text),
  registerShortcut: () => Promise.reject(new Error("unsupported")),
  unregisterShortcut: () => Promise.resolve(),
  showHud: () => Promise.resolve(),
  onHudMessage: () => Promise.resolve(() => undefined),
  notify: (message) => {
    showToast(message);
    return Promise.resolve();
  },
  loadSettings: () => {
    try {
      return Promise.resolve(JSON.parse(localStorage.getItem(KEY) ?? "null"));
    } catch {
      return Promise.resolve(null);
    }
  },
  saveSettings: (settings) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch {
      // Private mode or full storage: settings just won't survive a reload.
    }
    return Promise.resolve();
  },
  setAutostart: () => Promise.resolve(),
  setTrayLabels: () => Promise.resolve(),
  onTrayAction: () => Promise.resolve(() => {}),
  onHiddenToTray: () => Promise.resolve(() => {}),
  onFileDrop: ({ hover, text, failed }) => {
    const over = (e: DragEvent) => {
      e.preventDefault();
      hover(true);
    };
    const leave = () => hover(false);
    const drop = (e: DragEvent) => {
      e.preventDefault();
      hover(false);
      const file = e.dataTransfer?.files[0];
      if (!file) return;
      file.text().then(text, failed);
    };
    window.addEventListener("dragover", over);
    window.addEventListener("dragleave", leave);
    window.addEventListener("drop", drop);
    return Promise.resolve(() => {
      window.removeEventListener("dragover", over);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("drop", drop);
    });
  },
  openUrl: (url) => {
    window.open(url, "_blank", "noopener");
    return Promise.resolve();
  },
};
