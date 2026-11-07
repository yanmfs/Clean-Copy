import { platform } from "./platform";
import { runCleanShortcut, cleanClipboard, restoreOriginal } from "./features/clean/actions";
import { selectLang, tNow, useApp } from "./store";
import { translate } from "./i18n";

let started: Promise<void> | undefined;

function trayLabels() {
  const lang = selectLang(useApp.getState());
  return {
    clean: translate(lang, "tray.clean"),
    restore: translate(lang, "tray.restore"),
    open: translate(lang, "tray.open"),
    settings: translate(lang, "tray.settings"),
    quit: translate(lang, "tray.quit"),
  };
}

async function start() {
  const app = useApp.getState();
  await app.hydrate();

  if (platform.hasGlobalShortcut) {
    const { shortcut } = useApp.getState().settings;
    await platform.registerShortcut(shortcut, runCleanShortcut).catch(() => {
      useApp.getState().setShortcutError(shortcut);
    });
  }

  if (platform.hasTray) {
    await platform.setTrayLabels(trayLabels());
    let lang = selectLang(useApp.getState());
    useApp.subscribe((state) => {
      const next = selectLang(state);
      if (next === lang) return;
      lang = next;
      void platform.setTrayLabels(trayLabels());
    });

    await platform.onTrayAction((action) => {
      if (action === "clean") void cleanClipboard();
      else if (action === "restore") void restoreOriginal();
      else useApp.getState().setDialog("settingsOpen", true);
    });

    await platform.onHiddenToTray(() => {
      const { settings, update } = useApp.getState();
      if (settings.trayNoticeSeen) return;
      update({ trayNoticeSeen: true });
      const key = platform.os === "macos" ? "notify.trayNotice.macos" : "notify.trayNotice.windows";
      void platform.notify(tNow(key));
    });
  }
}

// React StrictMode mounts twice in development; listeners must only be registered once.
export const boot = () => (started ??= start());
