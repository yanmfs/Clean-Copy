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
import { useHistory } from "../clean/history";
import { useEditor } from "./editorStore";
import { OptionsPanel } from "./OptionsPanel";
import { RecentList } from "./RecentList";

const countWords = (text: string) => text.split(/\s+/).filter(Boolean).length;

function Counter({ text }: { text: string }) {
  const t = useT();
  if (text === "") return <span aria-hidden>&nbsp;</span>;
  return (
    <span className="tabular-nums">
      {t("count.words", { count: countWords(text) })} · {t("count.chars", { count: text.length })}
    </span>
  );
}

export function MainView() {
  const t = useT();
  const lang = useApp(selectLang);
  const options = useApp((s) => s.settings.options);
  const shortcut = useApp((s) => s.settings.shortcut);
  const input = useEditor((st) => st.input);
  const setInput = useEditor((st) => st.setInput);
  const welcomeSeen = useApp((st) => st.settings.welcomeSeen);
  const update = useApp((st) => st.update);
  const recentCount = useHistory((st) => st.items.length);
  const [tab, setTab] = useState<"options" | "recent">("options");
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
  }, [t, setInput]);

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
              <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
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
            <p className="h-4 text-xs text-muted">
              <Counter text={input} />
            </p>
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
            <p className="h-4 text-xs text-muted">
              <Counter text={result.text} />
            </p>
          </div>
        </div>

        {!welcomeSeen && empty && (
          <section
            aria-label={t("welcome.title")}
            className="anim-fade rounded-panel border border-border-strong/60 bg-surface p-4"
          >
            <h2 className="font-display text-lg font-semibold tracking-tight">
              {t("welcome.title")}
            </h2>
            <ol className="mt-2 grid gap-2 text-[13px] sm:grid-cols-3">
              {(["welcome.step1", "welcome.step2", "welcome.step3"] as const).map((key, i) => (
                <li key={key} className="flex gap-2.5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-contrast">
                    {i + 1}
                  </span>
                  <span>{t(key, { shortcut: shortcutLabel })}</span>
                </li>
              ))}
            </ol>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-muted">{t("welcome.hint")}</p>
              <Button onClick={() => update({ welcomeSeen: true })}>{t("welcome.dismiss")}</Button>
            </div>
          </section>
        )}

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
        className="hidden w-72 shrink-0 overflow-y-auto border-l border-border bg-surface p-4 min-[780px]:block"
      >
        <div role="tablist" className="mb-4 flex gap-1 border-b border-border">
          {(["options", "recent"] as const).map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`-mb-px h-8 border-b-2 px-2.5 text-[13px] font-medium ${tab === id ? "border-accent text-text" : "border-transparent text-muted hover:text-text"}`}
            >
              {id === "options" ? t("options.title") : t("recent.tab")}
              {id === "recent" && recentCount > 0 && (
                <span className="ml-1.5 rounded bg-surface-2 px-1.5 text-[11px] tabular-nums">
                  {recentCount}
                </span>
              )}
            </button>
          ))}
        </div>
        {tab === "options" ? <OptionsPanel /> : <RecentList />}
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
