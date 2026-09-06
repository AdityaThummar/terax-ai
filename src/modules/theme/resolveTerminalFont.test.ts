import { describe, expect, it } from "vitest";
import { resolveTerminalFont, type TerminalFont } from "./resolveTerminalFont";
import type { Theme } from "./types";

const preferences: TerminalFont = {
  fontFamily: "JetBrains Mono",
  fontWeight: "normal",
  fontSize: 14,
};

describe("resolveTerminalFont", () => {
  it("user preference wins over theme fontFamily when non-empty", () => {
    const theme: Theme = {
      id: "custom-theme",
      name: "Custom",
      variants: {
        dark: {
          terminal: {
            fontFamily: "Iosevka",
            fontSize: 16,
          },
        },
      },
    };

    expect(resolveTerminalFont(preferences, theme, "dark")).toEqual({
      fontFamily: "JetBrains Mono",
      fontWeight: "normal",
      fontSize: 16,
    });
  });

  it("falls back to theme fontFamily when user preference is blank", () => {
    const blankPrefs: TerminalFont = {
      fontFamily: "",
      fontWeight: "normal",
      fontSize: 14,
    };
    const theme: Theme = {
      id: "themed",
      name: "Themed",
      variants: { dark: { terminal: { fontFamily: "Iosevka" } } },
    };
    expect(resolveTerminalFont(blankPrefs, theme, "dark").fontFamily).toBe(
      "Iosevka",
    );
  });

  it("returns empty string when both user and theme have no fontFamily", () => {
    const blankPrefs: TerminalFont = {
      fontFamily: "",
      fontWeight: "normal",
      fontSize: 14,
    };
    const theme: Theme = {
      id: "no-font",
      name: "No font",
      variants: { dark: { terminal: { foreground: "#ffffff" } } },
    };
    expect(resolveTerminalFont(blankPrefs, theme, "dark").fontFamily).toBe("");
  });

  it("restores global preferences when the theme has no font values", () => {
    const theme: Theme = {
      id: "colors-only",
      name: "Colors only",
      variants: { dark: { terminal: { foreground: "#ffffff" } } },
    };

    expect(resolveTerminalFont(preferences, theme, "dark")).toEqual(
      preferences,
    );
  });

  it("uses the same variant fallback order as theme colors", () => {
    const theme: Theme = {
      id: "dark-only",
      name: "Dark only",
      variants: {
        dark: { terminal: { fontWeight: "bold" } },
      },
    };

    expect(resolveTerminalFont(preferences, theme, "light").fontWeight).toBe(
      "bold",
    );
  });
});
