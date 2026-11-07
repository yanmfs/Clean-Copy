import { Info, SlidersHorizontal, Settings } from "lucide-react";
import { useEffect } from "react";
import { boot } from "./boot";
import { Button } from "./components/Button";
import { Dialog } from "./components/Dialog";
import { Logo } from "./components/Logo";
import { Toaster } from "./components/Toaster";
import { Tooltip, TooltipProvider } from "./components/Tooltip";
import { MainView } from "./features/editor/MainView";
import { OptionsPanel } from "./features/editor/OptionsPanel";
import { AboutDialog } from "./features/settings/AboutDialog";
import { SettingsDialog } from "./features/settings/SettingsDialog";
import { platform } from "./platform";
import { selectLang, useApp, useT } from "./store";

export default function App() {
  const t = useT();
  const lang = useApp(selectLang);
  const theme = useApp((s) => s.settings.theme);
  const ready = useApp((s) => s.ready);
  const optionsOpen = useApp((s) => s.optionsOpen);
  const setDialog = useApp((s) => s.setDialog);

  useEffect(() => {
    void boot();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") root.removeAttribute("data-theme");
    else root.dataset.theme = theme;
    root.lang = lang;
  }, [theme, lang]);

  if (!ready) return null;

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-surface px-4">
          <div className="flex items-center gap-2.5">
            <Logo />
            <span className="font-display text-[17px] font-semibold tracking-tight">CleanCopy</span>
            {!platform.hasTray && (
              <span className="ml-3 hidden text-xs text-muted min-[900px]:inline">
                {t("web.notice")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Tooltip label={t("options.title")}>
              <Button
                variant="ghost"
                icon
                aria-label={t("options.title")}
                className="min-[780px]:hidden"
                onClick={() => setDialog("optionsOpen", true)}
              >
                <SlidersHorizontal className="size-4" aria-hidden />
              </Button>
            </Tooltip>
            <Tooltip label={t("header.about")}>
              <Button
                variant="ghost"
                icon
                aria-label={t("header.about")}
                onClick={() => setDialog("aboutOpen", true)}
              >
                <Info className="size-4" aria-hidden />
              </Button>
            </Tooltip>
            <Tooltip label={t("header.settings")}>
              <Button
                variant="ghost"
                icon
                aria-label={t("header.settings")}
                onClick={() => setDialog("settingsOpen", true)}
              >
                <Settings className="size-4" aria-hidden />
              </Button>
            </Tooltip>
          </div>
        </header>
        <MainView />
      </div>
      <Dialog
        open={optionsOpen}
        onOpenChange={(o) => setDialog("optionsOpen", o)}
        title={t("options.title")}
      >
        <OptionsPanel />
      </Dialog>
      <SettingsDialog />
      <AboutDialog />
      <Toaster />
    </TooltipProvider>
  );
}
