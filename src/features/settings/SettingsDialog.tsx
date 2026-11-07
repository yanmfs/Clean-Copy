import { useState } from "react";
import { Dialog } from "../../components/Dialog";
import { Select } from "../../components/Select";
import { Toggle } from "../../components/Toggle";
import { platform } from "../../platform";
import type { ThemeSetting } from "../../settings";
import type { LangSetting } from "../../i18n";
import { useApp, useT } from "../../store";
import { changeAutostart } from "../clean/actions";
import { ShortcutRecorder } from "./ShortcutRecorder";

export function SettingsDialog() {
  const t = useT();
  const open = useApp((s) => s.settingsOpen);
  const setDialog = useApp((s) => s.setDialog);
  const settings = useApp((s) => s.settings);
  const update = useApp((s) => s.update);
  const setOptions = useApp((s) => s.setOptions);
  const [autostartFailed, setAutostartFailed] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => setDialog("settingsOpen", o)}
      title={t("settings.title")}
    >
      <div className="flex flex-col gap-5">
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">{t("settings.shortcut")}</h3>
          <ShortcutRecorder />
        </section>

        <div className="flex flex-col">
          <Toggle
            label={t("settings.confirmation")}
            checked={settings.showConfirmation}
            onChange={(showConfirmation) => update({ showConfirmation })}
          />
          {platform.hasHud && settings.showConfirmation && (
            <div className="py-1">
              <Select
                label={t("settings.confirmationStyle")}
                value={settings.confirmationStyle}
                onChange={(confirmationStyle: "notification" | "hud") =>
                  update({ confirmationStyle })
                }
              >
                <option value="notification">{t("settings.confirmationStyle.notification")}</option>
                <option value="hud">{t("settings.confirmationStyle.hud")}</option>
              </Select>
            </div>
          )}
          {platform.hasTray && (
            <Toggle
              label={t("settings.autostart")}
              checked={settings.autostart}
              onChange={async (enabled) => setAutostartFailed(!(await changeAutostart(enabled)))}
            />
          )}
          {autostartFailed && (
            <p role="alert" className="text-xs text-danger">
              {t("settings.autostartFailed")}
            </p>
          )}
        </div>

        <Select
          label={t("settings.separator")}
          value={settings.options.paragraphSeparator}
          onChange={(paragraphSeparator) => setOptions({ paragraphSeparator })}
        >
          <option value="blank-line">{t("settings.separator.blank-line")}</option>
          <option value="newline">{t("settings.separator.newline")}</option>
        </Select>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label={t("settings.language")}
            value={settings.language}
            onChange={(language: LangSetting) => update({ language })}
          >
            <option value="auto">{t("settings.language.auto")}</option>
            <option value="pt-BR">{t("settings.language.pt-BR")}</option>
            <option value="en">{t("settings.language.en")}</option>
          </Select>
          <Select
            label={t("settings.theme")}
            value={settings.theme}
            onChange={(theme: ThemeSetting) => update({ theme })}
          >
            <option value="system">{t("settings.theme.system")}</option>
            <option value="light">{t("settings.theme.light")}</option>
            <option value="dark">{t("settings.theme.dark")}</option>
          </Select>
        </div>
      </div>
    </Dialog>
  );
}
