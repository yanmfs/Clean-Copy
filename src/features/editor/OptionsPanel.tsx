import type { CleanOptions } from "../../core/clean";
import { Toggle } from "../../components/Toggle";
import { useApp, useT } from "../../store";

const TOGGLES = [
  "removePageNumbers",
  "removeRepeatedHeaders",
  "removeLineNumbers",
  "fixHyphenation",
  "fixLigatures",
] as const;

// Opt-in tidying for text that came from papers and slides.
const EXTRAS = ["removeCitations", "normalizeBullets"] as const;

const MODES: CleanOptions["mode"][] = ["paragraphs", "single-line", "keep-lines", "spaces-only"];

export function OptionsPanel() {
  const t = useT();
  const options = useApp((s) => s.settings.options);
  const setOptions = useApp((s) => s.setOptions);

  return (
    <div className="flex flex-col gap-5">
      <fieldset>
        <legend className="mb-1.5 text-xs font-medium text-muted">{t("options.mode")}</legend>
        <div role="radiogroup" className="flex flex-col gap-1">
          {MODES.map((mode) => {
            const active = options.mode === mode;
            return (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setOptions({ mode })}
                className={`rounded-control border px-3 py-2 text-left transition-colors ${active ? "border-accent bg-accent-soft" : "border-transparent hover:bg-surface-2"}`}
              >
                <span className="block text-[13px] font-semibold">{t(`mode.${mode}`)}</span>
                <span className="block text-xs text-muted">{t(`mode.${mode}.hint`)}</span>
              </button>
            );
          })}
        </div>
      </fieldset>
      <div className="flex flex-col">
        {TOGGLES.map((name) => (
          <Toggle
            key={name}
            label={t(`options.${name}`)}
            checked={options[name]}
            onChange={(checked) => setOptions({ [name]: checked })}
          />
        ))}
      </div>
      <div className="flex flex-col border-t border-border pt-3">
        <p className="mb-1 text-xs font-medium text-muted">{t("options.extras")}</p>
        {EXTRAS.map((name) => (
          <Toggle
            key={name}
            label={t(`options.${name}`)}
            checked={options[name]}
            onChange={(checked) => setOptions({ [name]: checked })}
          />
        ))}
      </div>
    </div>
  );
}
