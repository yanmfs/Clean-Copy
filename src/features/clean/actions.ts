import { cleanText } from "../../core/clean";
import { toClipboardText } from "../../core/os";
import { summarize } from "../../i18n";
import { platform } from "../../platform";
import { selectLang, tNow, useApp } from "../../store";

const UNDO_WINDOW_MS = 5000;

let lastClean: { original: string; at: number } | null = null;

async function confirm(message: string) {
  const { showConfirmation, confirmationStyle } = useApp.getState().settings;
  if (!showConfirmation) return;
  const hud = confirmationStyle === "hud" && platform.hasHud;
  // If the small window cannot open, the system notification still gets the message across.
  if (
    hud &&
    (await platform.showHud(message).then(
      () => true,
      () => false,
    ))
  )
    return;
  await platform.notify(message).catch(() => undefined);
}

// With `paste`, Ctrl/Cmd+V is pressed as soon as the clipboard is ready, before any confirmation
// shows up, so nothing new can take the focus away from the app that should receive the text.
export async function cleanClipboard(options: { paste?: boolean } = {}): Promise<void> {
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

  if (options.paste) {
    const pasted = await platform.simulatePaste().then(
      () => true,
      () => false,
    );
    if (!pasted) return confirm(tNow("notify.pasteFailed"));
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

// Pressing the shortcut again right after cleaning undoes it, unless it also pastes: then every
// press is meant to put text in the app, and an undo of the clipboard would only confuse.
export async function runCleanShortcut(): Promise<void> {
  const { cleanAndPaste } = useApp.getState().settings;
  const pasting = cleanAndPaste && platform.hasPaste;
  if (!pasting && lastClean && Date.now() - lastClean.at < UNDO_WINDOW_MS) return restoreOriginal();
  return cleanClipboard({ paste: pasting });
}

// Turning the option on is what asks macOS for the Accessibility permission.
export async function changeCleanAndPaste(enabled: boolean): Promise<boolean> {
  if (enabled && !(await platform.pasteAllowed(true).catch(() => false))) return false;
  useApp.getState().update({ cleanAndPaste: enabled });
  return true;
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
