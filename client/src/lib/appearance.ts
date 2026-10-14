/**
 * @file appearance.ts
 * @description Browser-local appearance preferences, shared across tabs and applied before React mounts.
 * @author Son Nguyen <hoangson091104@gmail.com>
 */
import { useSyncExternalStore } from "react";

export type Theme = "dark" | "light" | "system";
export const FONT_SCALES = [90, 100, 110, 125] as const;
export type FontScale = (typeof FONT_SCALES)[number];
interface Appearance {
  theme: Theme;
  fontScale: FontScale;
}
const KEY = "agent-monitor-appearance";
const defaults: Appearance = { theme: "dark", fontScale: 100 };
const listeners = new Set<() => void>();

function read(): Appearance {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || "null");
    return {
      theme: ["dark", "light", "system"].includes(value?.theme) ? value.theme : defaults.theme,
      fontScale: FONT_SCALES.includes(value?.fontScale) ? value.fontScale : defaults.fontScale,
    };
  } catch {
    return { ...defaults };
  }
}
let current = read();
let media: MediaQueryList | undefined;

function apply() {
  document.documentElement.dataset.theme =
    current.theme === "system" ? (media?.matches ? "dark" : "light") : current.theme;
  document.documentElement.style.fontSize = `${current.fontScale}%`;
}
function notify() {
  apply();
  listeners.forEach((listener) => listener());
}

/** Initialize once before mount; return cleanup for tests and hot module replacement. */
export function initializeAppearance() {
  media = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystem = () => apply();
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY || event.key === null) {
      current = read();
      notify();
    }
  };
  media.addEventListener("change", onSystem);
  window.addEventListener("storage", onStorage);
  apply();
  return () => {
    media?.removeEventListener("change", onSystem);
    window.removeEventListener("storage", onStorage);
  };
}
export function setAppearance(patch: Partial<Appearance>) {
  current = { ...current, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* Still apply in this tab. */
  }
  notify();
}
export function useAppearance() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => current
  );
}
