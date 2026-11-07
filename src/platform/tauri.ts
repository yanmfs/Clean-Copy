import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { disable, enable } from "@tauri-apps/plugin-autostart";
import { readText, writeText } from "@tauri-apps/plugin-clipboard-manager";
import { register, unregister } from "@tauri-apps/plugin-global-shortcut";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { openUrl } from "@tauri-apps/plugin-opener";
import { load, type Store } from "@tauri-apps/plugin-store";
import { detectOs } from "../core/os";
import type { Platform, TrayAction } from "./types";

let store: Promise<Store> | undefined;
const settingsStore = () => (store ??= load("settings.json", { autoSave: false, defaults: {} }));

async function canNotify(): Promise<boolean> {
  if (await isPermissionGranted()) return true;
  return (await requestPermission()) === "granted";
}

export const tauri: Platform = {
  os: detectOs(navigator.userAgent),
  systemLocale: navigator.language,
  hasGlobalShortcut: true,
  hasTray: true,
  hasHud: true,
  readClipboard: async () => (await readText()) ?? "",
  writeClipboard: (text) => writeText(text),
  registerShortcut: (accelerator, onPressed) =>
    register(accelerator, (event) => {
      if (event.state === "Pressed") onPressed();
    }),
  unregisterShortcut: (accelerator) => unregister(accelerator),
  showHud: (message) => invoke("show_hud", { message }),
  onHudMessage: (handler) => listen<string>("hud-message", (event) => handler(event.payload)),
  notify: async (message) => {
    if (await canNotify()) sendNotification({ title: "CleanCopy", body: message });
  },
  loadSettings: async () => (await settingsStore()).get("settings"),
  saveSettings: async (settings) => {
    const s = await settingsStore();
    await s.set("settings", settings);
    await s.save();
  },
  setAutostart: (enabled) => (enabled ? enable() : disable()),
  setTrayLabels: (labels) => invoke("set_tray_labels", { labels }),
  onTrayAction: (handler) => listen<TrayAction>("tray-action", (e) => handler(e.payload)),
  onHiddenToTray: (handler) => listen("hidden-to-tray", () => handler()),
  onFileDrop: ({ hover, text, failed }) =>
    getCurrentWebview().onDragDropEvent((event) => {
      const { type } = event.payload;
      if (type === "enter" || type === "over") hover(true);
      else hover(false);
      if (type !== "drop") return;
      const path = event.payload.paths.find((p) => p.toLowerCase().endsWith(".txt"));
      if (!path) return failed();
      invoke<string>("read_text_file", { path }).then(text, failed);
    }),
  openUrl: (url) => openUrl(url),
};
