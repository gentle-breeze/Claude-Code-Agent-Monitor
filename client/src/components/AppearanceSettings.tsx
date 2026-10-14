/**
 * @file AppearanceSettings.tsx
 * @description Accessible theme and text-size controls for browser-local dashboard preferences.
 * @author Son Nguyen <hoangson091104@gmail.com>
 */
import { useTranslation } from "react-i18next";
import { FONT_SCALES, setAppearance, useAppearance, type Theme } from "../lib/appearance";

export function AppearanceSettings() {
  const { t } = useTranslation("settings");
  const prefs = useAppearance();
  return (
    <>
      <h3 className="mb-1 text-sm font-medium text-gray-300">{t("appearance.title")}</h3>
      <p className="mb-4 text-xs text-gray-500">{t("appearance.description")}</p>
      <div className="card p-4 grid gap-5 sm:grid-cols-2">
        <label className="min-w-0 text-sm text-gray-300">
          {t("appearance.theme")}
          <select
            className="input mt-2 block w-full"
            value={prefs.theme}
            onChange={(event) => setAppearance({ theme: event.target.value as Theme })}
          >
            {(["dark", "light", "system"] as const).map((theme) => (
              <option key={theme} value={theme}>
                {t(`appearance.${theme}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-0 text-sm text-gray-300">
          {t("appearance.fontSize")}
          <select
            className="input mt-2 block w-full"
            value={prefs.fontScale}
            onChange={(event) =>
              setAppearance({ fontScale: Number(event.target.value) as typeof prefs.fontScale })
            }
          >
            {FONT_SCALES.map((scale) => (
              <option key={scale} value={scale}>
                {scale}%
              </option>
            ))}
          </select>
        </label>
        <p className="sm:col-span-2 text-sm text-gray-200">{t("appearance.preview")}</p>
      </div>
    </>
  );
}
