/**
 * @file Tip.theme.test.tsx
 * @description Regression coverage for the health-page concurrency tooltip's hover lifecycle and theme-aware surface.
 * @author Son Nguyen <hoangson091104@gmail.com>
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Tip } from "../Tip";

it("shows the concurrency detail on hover and removes it on mouse leave", () => {
  render(
    <Tip block raw={"Peak: 757 parallel sessions\nActive intervals: 6\nAvg: 283.2"}>
      <div>Concurrency bars</div>
    </Tip>
  );
  const trigger = screen.getByText("Concurrency bars");
  fireEvent.mouseEnter(trigger, { clientX: 100, clientY: 100 });
  const tooltip = screen.getByRole("tooltip");
  expect(tooltip).toHaveTextContent("Peak: 757 parallel sessions");
  expect(tooltip).toHaveClass("bg-tooltip", "border-tooltip-border");
  expect(tooltip.parentElement).toBe(document.body);
  fireEvent.mouseLeave(trigger);
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
});
