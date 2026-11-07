import { ClipboardCopy, Trash2 } from "lucide-react";
import { Button } from "../../components/Button";
import { toClipboardText } from "../../core/os";
import { platform } from "../../platform";
import { selectLang, useApp, useT } from "../../store";
import { showToast } from "../../toast";
import { useHistory } from "../clean/history";
import { useEditor } from "./editorStore";

export function RecentList() {
  const t = useT();
  const lang = useApp(selectLang);
  const items = useHistory((s) => s.items);
  const clear = useHistory((s) => s.clear);
  const setInput = useEditor((s) => s.setInput);

  if (items.length === 0) {
    return (
      <p className="rounded-panel border border-dashed border-border p-4 text-sm text-muted">
        {t("recent.empty")}
      </p>
    );
  }

  const time = new Intl.DateTimeFormat(lang, { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-1.5">
        {items.map((item) => (
          <li key={item.id} className="rounded-control border border-border bg-surface p-2.5">
            <div className="flex items-center justify-between text-xs text-muted">
              <span className="tabular-nums">{time.format(item.at)}</span>
              <span>
                {t("recent.words", { count: item.cleaned.split(/\s+/).filter(Boolean).length })}
              </span>
            </div>
            <p className="mt-1 line-clamp-2 text-[13px]">{item.cleaned}</p>
            <div className="mt-2 flex gap-1.5">
              <Button
                className="h-7 px-2 text-xs"
                onClick={() =>
                  platform.writeClipboard(toClipboardText(item.cleaned, platform.os)).then(
                    () => showToast(t("toast.copied")),
                    () => showToast(t("toast.copyFailed"), "error"),
                  )
                }
              >
                <ClipboardCopy className="size-3.5" aria-hidden />
                {t("recent.copy")}
              </Button>
              <Button
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={() => setInput(item.original)}
              >
                {t("recent.open")}
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <Button variant="ghost" className="self-start text-xs" onClick={clear}>
        <Trash2 className="size-3.5" aria-hidden />
        {t("recent.clear")}
      </Button>
      <p className="text-xs text-muted">{t("recent.privacy")}</p>
    </div>
  );
}
