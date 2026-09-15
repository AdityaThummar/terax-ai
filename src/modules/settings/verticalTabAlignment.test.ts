import { describe, expect, it } from "vitest";
import {
  DEFAULT_PREFERENCES,
  isVerticalTabAlignment,
  VERTICAL_TAB_ALIGNMENT_LABELS,
  VERTICAL_TAB_ALIGNMENTS,
} from "./store";

describe("verticalTabAlignment preferences", () => {
  it("defaults to top", () => {
    expect(DEFAULT_PREFERENCES.verticalTabAlignment).toBe("top");
  });

  it("validates allowed alignment values", () => {
    expect(VERTICAL_TAB_ALIGNMENTS).toEqual(["top", "center", "bottom"]);
    expect(isVerticalTabAlignment("top")).toBe(true);
    expect(isVerticalTabAlignment("center")).toBe(true);
    expect(isVerticalTabAlignment("bottom")).toBe(true);
    expect(isVerticalTabAlignment("left")).toBe(false);
    expect(isVerticalTabAlignment("right")).toBe(false);
    expect(isVerticalTabAlignment("invalid")).toBe(false);
    expect(isVerticalTabAlignment(null)).toBe(false);
    expect(isVerticalTabAlignment(undefined)).toBe(false);
    expect(isVerticalTabAlignment(123)).toBe(false);
  });

  it("has descriptive labels for each option", () => {
    for (const alignment of VERTICAL_TAB_ALIGNMENTS) {
      expect(VERTICAL_TAB_ALIGNMENT_LABELS[alignment]).toBeDefined();
      expect(typeof VERTICAL_TAB_ALIGNMENT_LABELS[alignment]).toBe("string");
    }
  });
});
