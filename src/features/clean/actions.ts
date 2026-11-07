import { cleanText } from "../../core/clean";
import { toClipboardText } from "../../core/os";
import { summarize } from "../../i18n";
import { platform } from "../../platform";
import { selectLang, tNow, useApp } from "../../store";

const UNDO_WINDOW_MS = 5000;

let lastClean: { original: string; at: number } | null = null;

async function confirm(message: string) {
  if (!useApp.getState().settings.showConfirmation) return;
  await platform.notify(message).catch(() => undefined);
}

export async function cleanClipboard(): Promise<void> {
  const { settings } = useApp.getState();
  let original: string;
  try {
    original = await platform.readClipboard();
  } catch {
    return confirm(tNow("notify.clipboardFailed"));
  }
  if (original.trim() === "") return confirm(tNow("notify.empty"));

  const { text, stats } = cleanText(original, settings.options);
  const unchanged = text === original.replace(/\r\n?/g, "\n");
  if (!unchanged) {
    lastClean = { original, at: Date.now() };
    try {
      await platform.writeClipboard(toClipboardText(text, platform.os));
    } catch {
      return confirm(tNow("notify.clipboardFailed"));
    }
  }

  if (stats.looksLikeCode && settings.options.mode === "paragraphs") {
    return confirm(tNow("chips.code"));
  }
  if (unchanged) return confirm(tNow("notify.alreadyClean"));

  const lang = selectLang(useApp.getState());
  await confirm([tNow("notify.cleaned"), ...summarize(lang, stats)].join(" · "));
}

export async function restoreOriginal(): Promise<void> {
  if (!lastClean) return confirm(tNow("notify.nothingToRestore"));
  const { original } = lastClean;
  lastClean = null;
  try {
    await platform.writeClipboard(original);
  } catch {
    return confirm(tNow("notify.clipboardFailed"));
  }
  await confirm(tNow("notify.restored"));
}

// Pressing the shortcut again right after cleaning undoes it.
export async function runCleanShortcut(): Promise<void> {
  if (lastClean && Date.now() - lastClean.at < UNDO_WINDOW_MS) return restoreOriginal();
  return cleanClipboard();
}

export async function changeShortcut(accelerator: string): Promise<boolean> {
  const { settings, update, setShortcutError } = useApp.getState();
  const previous = settings.shortcut;
  await platform.unregisterShortcut(previous).catch(() => undefined);
  try {
    await platform.registerShortcut(accelerator, runCleanShortcut);
    setShortcutError(null);
    update({ shortcut: accelerator });
    return true;
  } catch {
    setShortcutError(accelerator);
    await platform.registerShortcut(previous, runCleanShortcut).catch(() => undefined);
    return false;
  }
}

export async function changeAutostart(enabled: boolean): Promise<boolean> {
  try {
    await platform.setAutostart(enabled);
    useApp.getState().update({ autostart: enabled });
    return true;
  } catch {
    return false;
  }
}
