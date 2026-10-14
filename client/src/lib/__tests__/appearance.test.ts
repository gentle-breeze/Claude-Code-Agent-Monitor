/**
 * @file appearance.test.ts
 * @description Verify persisted appearance, operating-system changes, cross-tab reset, and unavailable storage.
 * @author Son Nguyen <hoangson091104@gmail.com>
 */
import { afterEach, beforeEach, expect, it, vi } from "vitest";
let cleanup: (() => void) | undefined;
let dark = false;
let systemChange: (() => void) | undefined;
beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
  dark = false;
  vi.stubGlobal("matchMedia", () => ({
    get matches() {
      return dark;
    },
    addEventListener: (_: string, fn: () => void) => {
      systemChange = fn;
    },
    removeEventListener: vi.fn(),
  }));
});
afterEach(() => {
  cleanup?.();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it("restores preferences and follows system changes only in system mode", async () => {
  localStorage.setItem(
    "agent-monitor-appearance",
    JSON.stringify({ theme: "system", fontScale: 125 })
  );
  const appearance = await import("../appearance");
  cleanup = appearance.initializeAppearance();
  expect(document.documentElement.dataset.theme).toBe("light");
  expect(document.documentElement.style.fontSize).toBe("125%");
  dark = true;
  systemChange?.();
  expect(document.documentElement.dataset.theme).toBe("dark");
  appearance.setAppearance({ theme: "light" });
  systemChange?.();
  expect(document.documentElement.dataset.theme).toBe("light");
  expect(JSON.parse(localStorage.getItem("agent-monitor-appearance")!).theme).toBe("light");
});
it("rejects invalid stored preferences and handles cross-tab reset", async () => {
  localStorage.setItem(
    "agent-monitor-appearance",
    JSON.stringify({ theme: "invalid", fontScale: 999 })
  );
  const appearance = await import("../appearance");
  cleanup = appearance.initializeAppearance();
  expect(document.documentElement.dataset.theme).toBe("dark");
  expect(document.documentElement.style.fontSize).toBe("100%");
  appearance.setAppearance({ theme: "light", fontScale: 110 });
  localStorage.clear();
  window.dispatchEvent(new StorageEvent("storage", { key: null }));
  expect(document.documentElement.dataset.theme).toBe("dark");
  expect(document.documentElement.style.fontSize).toBe("100%");
});
it("still applies changes when storage throws", async () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  const appearance = await import("../appearance");
  cleanup = appearance.initializeAppearance();
  appearance.setAppearance({ theme: "light", fontScale: 90 });
  expect(document.documentElement.dataset.theme).toBe("light");
  expect(document.documentElement.style.fontSize).toBe("90%");
});
