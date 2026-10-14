/**
 * @file tooltip-theme.test.ts
 * @description Guard tooltip text contrast in both resolved themes and prevent fixed dark tooltip surfaces from returning.
 * @author Son Nguyen <hoangson091104@gmail.com>
 */
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { expect, it } from "vitest";

const css = readFileSync(resolve("src/index.css"), "utf8");
function luminance(rgb: number[]) {
  return rgb
    .map((v) => {
      const c = v / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    })
    .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i]!, 0);
}
for (const selector of [":root", ':root[data-theme="light"]']) {
  it(`keeps tooltip foregrounds above 4.5:1 contrast in ${selector}`, () => {
    const start = css.indexOf(`${selector} {`);
    const block = css.slice(start, css.indexOf("}", start));
    const color = (name: string) => {
      const value = block.match(new RegExp(`--${name}: ([0-9 ]+);`))?.[1];
      expect(value, name).toBeDefined();
      return luminance(value!.split(" ").map(Number));
    };
    const background = color("tooltip-bg");
    for (const name of [
      "tooltip-text",
      "tooltip-muted",
      "gray-100",
      "gray-200",
      "gray-300",
      "gray-400",
    ]) {
      const foreground = color(name);
      expect(
        (Math.max(background, foreground) + 0.05) / (Math.min(background, foreground) + 0.05),
        name
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
}
it("does not mix fixed dark tooltip surfaces with theme-aware text", () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory() ? walk(resolve(dir, entry.name)) : [resolve(dir, entry.name)]
    );
  for (const file of walk(resolve("src")).filter(
    (file) => file.endsWith(".tsx") && !file.includes("__tests__")
  )) {
    expect(readFileSync(file, "utf8"), file).not.toMatch(/#12121f|#2a2a4a/i);
  }
});
