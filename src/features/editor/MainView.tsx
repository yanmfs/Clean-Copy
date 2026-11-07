import { Copy, Diff, Eraser, FileDown } from "lucide-react";
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { Button } from "../../components/Button";
import { Chip } from "../../components/Chip";
import { Tooltip } from "../../components/Tooltip";
import { cleanText } from "../../core/clean";
import { diffText } from "../../core/diff";
import { formatShortcut, modKeyLabel, toClipboardText } from "../../core/os";
import { summarize } from "../../i18n";
import { platform } from "../../platform";
import { selectLang, useApp, useT } from "../../store";
import { showToast } from "../../toast";
import { DiffPane } from "./DiffPane";
import { OptionsPanel } from "./OptionsPanel";

export function MainView() {
  const t = useT();
  const lang = useApp(selectLang);
  const options = useApp((s) => s.settings.options);
  const shortcut = useApp((s) => s.settings.shortcut);
  const [input, setInput] = useState("");
  const [dragging, setDragging] = useState(false);
  const [showChanges, setShowChanges] = useState(false);

  const deferred = useDeferredValue(input);
  const result = useMemo(() => cleanText(deferred, options), [deferred, options]);
  const segments = useMemo(
    () =>
      showChanges && deferred.trim() !== ""
        ? diffText(deferred.replace(/\r\n?/g, "\n"), result.text)
        : null,
    [showChanges, deferred, result.text],
  );

  const copy = useCallback(async () => {
    if (result.text === "") return;
    try {
      await platform.writeClipboard(toClipboardText(result.text, platform.os));
      showToast(t("toast.copied"));
    } catch {
      showToast(t("toast.copyFailed"), "error");
    }
  }, [result.text, t]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        void copy();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [copy]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let cancelled = false;
    void platform
      .onFileDrop({
        hover: setDragging,
        text: setInput,
        failed: () => showToast(t("drop.error"), "error"),
      })
      .then((fn) => (cancelled ? fn() : (unlisten = fn)));
    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [t]);

  const chips = summarize(lang, result.stats);
  const empty = deferred.trim() === "";
  const alreadyClean = !empty && result.text === deferred.replace(/\r\n?/g, "\n").trim();
  const shortcutLabel = formatShortcut(shortcut, platform.os);

  return (
    <div className="flex min-h-0 flex-1">
      <section className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
          <div className="flex min-h-0 flex-col gap-2">
            <div className="flex h-8 items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
                {t("pane.original")}
              </h2>
              {input !== "" && (
                <Tooltip label={t("pane.clear")}>
                  <Button
                    variant="ghost"
                    icon
                    aria-label={t("pane.clear")}
                    onClick={() => setInput("")}
                  >
                    <Eraser className="size-4" aria-hidden />
                  </Button>
                </Tooltip>
              )}
            </div>
            {segments ? (
              <DiffPane label={t("pane.original")} segments={segments} side="original" />
            ) : (
              <textarea
                aria-label={t("pane.original")}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("pane.originalPlaceholder", { shortcut: shortcutLabel })}
                spellCheck={false}
                className="min-h-0 flex-1 resize-none rounded-panel border border-border bg-surface p-3.5 leading-relaxed placeholder:text-muted"
              />
            )}
          </div>
          <div className="flex min-h-0 flex-col gap-2">
            <div className="flex h-8 items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
                {t("pane.clean")}
              </h2>
              <Button
                variant={showChanges ? "subtle" : "ghost"}
                aria-pressed={showChanges}
                onClick={() => setShowChanges((v) => !v)}
                className="h-8 px-2.5"
              >
                <Diff className="size-4" aria-hidden />
                {t("pane.showChanges")}
              </Button>
            </div>
            {segments ? (
              <DiffPane label={t("pane.clean")} segments={segments} side="clean" />
            ) : (
              <textarea
                aria-label={t("pane.clean")}
                readOnly
                value={result.text}
                placeholder={t("pane.cleanPlaceholder")}
                spellCheck={false}
                className="min-h-0 flex-1 resize-none rounded-panel border border-border bg-surface-2 p-3.5 leading-relaxed placeholder:text-muted"
              />
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex min-h-9 flex-wrap items-center gap-2">
            {empty && <Chip>{t("chips.nothing")}</Chip>}
            {alreadyClean && !result.stats.looksLikeCode && (
              <Chip tone="success">{t("chips.alreadyClean")}</Chip>
            )}
            {result.stats.looksLikeCode && <Chip tone="warning">{t("chips.code")}</Chip>}
            {!empty && chips.map((chip) => <Chip key={chip}>{chip}</Chip>)}
            {showChanges && !empty && !segments && (
              <Chip tone="warning">{t("pane.tooManyChanges")}</Chip>
            )}
          </div>
          <Tooltip label={t("action.copy")} hint={`${modKeyLabel(platform.os)}+Enter`}>
            <Button variant="primary" onClick={copy} disabled={result.text === ""}>
              <Copy className="size-4" aria-hidden />
              {t("action.copy")}
            </Button>
          </Tooltip>
        </div>
      </section>

      <aside
        aria-label={t("options.title")}
        className="hidden w-64 shrink-0 overflow-y-auto border-l border-border bg-surface p-4 min-[780px]:block"
      >
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
          {t("options.title")}
        </h2>
        <OptionsPanel />
      </aside>

      {dragging && (
        <div
          role="presentation"
          className="anim-fade pointer-events-none fixed inset-3 z-30 flex flex-col items-center justify-center gap-2 rounded-panel border-2 border-dashed border-accent bg-bg/90 text-lg font-medium"
        >
          <FileDown className="size-8 text-accent-text" aria-hidden />
          {t("drop.title")}
        </div>
      )}
    </div>
  );
}
