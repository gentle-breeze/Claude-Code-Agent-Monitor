/**
 * @file notice-theme.test.ts
 * @description Verify amber notice foreground contrast over tinted surfaces in both themes.
 * @author Son Nguyen <hoangson091104@gmail.com>
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import postcss from "postcss";
import colors from "tailwindcss/colors";
import { expect, it } from "vitest";

const css = readFileSync(resolve("src/index.css"), "utf8");
const tree = postcss.parse(css);
const blend = (fg: number[], bg: number[], alpha: number) =>
  fg.map((v, i) => v * alpha + bg[i]! * (1 - alpha));
const rgb = (hex: string) =>
  hex
    .slice(1)
    .match(/../g)!
    .map((v) => parseInt(v, 16));
const lum = (values: number[]) =>
  values
    .map((v) => {
      const c = v / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    })
    .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i]!, 0);
for (const light of [false, true]) {
  it(`keeps notice text and icons readable in ${light ? "light" : "dark"} mode`, () => {
    const selector = light ? ':root[data-theme="light"]' : ":root";
    const palette = tree.nodes.find((n) => n.type === "rule" && n.selector === selector)!;
    const block = palette.toString();
    for (const shade of [100, 200, 300, 400] as const) {
      for (const opacity of [1, 0.9]) {
        // Only 300/400 have opacity variants in the configuration notices.
        if (opacity < 1 && shade < 300) continue;
        let foreground = rgb(colors.amber[shade]);
        let alpha = opacity;
        if (light) {
          const className = `.text-amber-${shade}${opacity < 1 ? "\\/90" : ""}`;
          let declaration = "";
          tree.walkRules((rule) => {
            if (rule.selectors.includes(`${selector} ${className}`))
              rule.walkDecls("color", (decl) => {
                declaration = decl.value;
              });
          });
          expect(declaration, className).not.toBe("");
          foreground = declaration.match(/\d+/g)!.map(Number);
          alpha = 1;
        }
        for (let surface = 0; surface <= 5; surface++) {
          const background = block
            .match(new RegExp(`--surface-${surface}: ([0-9 ]+)`))![1]!
            .split(" ")
            .map(Number);
          for (const tint of [0, 0.04, 0.05, 0.1, 0.2]) {
            const bg = blend(rgb(colors.amber[500]), background, tint);
            const a = lum(blend(foreground, bg, alpha));
            const b = lum(bg);
            expect(
              (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
              `${shade}/${opacity} on surface-${surface} tint ${tint}`
            ).toBeGreaterThanOrEqual(4.5);
          }
        }
      }
    }
  });
}
