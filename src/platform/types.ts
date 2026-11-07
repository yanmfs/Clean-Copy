import type { Os } from "../core/os";
import type { Settings } from "../settings";

export type TrayAction = "clean" | "restore" | "settings";
export type Unlisten = () => void;

export interface TrayLabels {
  clean: string;
  restore: string;
  open: string;
  settings: string;
  quit: string;
}

export interface DropHandlers {
  hover: (over: boolean) => void;
  text: (text: string) => void;
  failed: () => void;
}

export interface Platform {
  os: Os;
  systemLocale: string;
  hasGlobalShortcut: boolean;
  hasTray: boolean;
  hasHud: boolean;
  readClipboard(): Promise<string>;
  writeClipboard(text: string): Promise<void>;
  registerShortcut(accelerator: string, onPressed: () => void): Promise<void>;
  unregisterShortcut(accelerator: string): Promise<void>;
  notify(message: string): Promise<void>;
  showHud(message: string): Promise<void>;
  // The small window gets later messages while it is still on screen.
  onHudMessage(handler: (message: string) => void): Promise<Unlisten>;
  loadSettings(): Promise<unknown>;
  saveSettings(settings: Settings): Promise<void>;
  setAutostart(enabled: boolean): Promise<void>;
  setTrayLabels(labels: TrayLabels): Promise<void>;
  onTrayAction(handler: (action: TrayAction) => void): Promise<Unlisten>;
  onHiddenToTray(handler: () => void): Promise<Unlisten>;
  onFileDrop(handlers: DropHandlers): Promise<Unlisten>;
  openUrl(url: string): Promise<void>;
}
