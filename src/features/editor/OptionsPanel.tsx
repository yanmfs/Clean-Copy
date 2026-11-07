import type { CleanOptions } from "../../core/clean";
import { Select } from "../../components/Select";
import { Toggle } from "../../components/Toggle";
import { useApp, useT } from "../../store";

const TOGGLES = [
  "removePageNumbers",
  "removeRepeatedHeaders",
  "removeLineNumbers",
  "fixHyphenation",
  "fixLigatures",
] as const;

const MODES: CleanOptions["mode"][] = ["paragraphs", "single-line", "keep-lines", "spaces-only"];

export function OptionsPanel() {
  const t = useT();
  const options = useApp((s) => s.settings.options);
  const setOptions = useApp((s) => s.setOptions);

  return (
    <div className="flex flex-col gap-4">
      <Select
        label={t("options.mode")}
        value={options.mode}
        onChange={(mode) => setOptions({ mode })}
      >
        {MODES.map((mode) => (
          <option key={mode} value={mode}>
            {t(`mode.${mode}`)}
          </option>
        ))}
      </Select>
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
    </div>
  );
}
