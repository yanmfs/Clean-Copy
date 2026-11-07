import { describe, expect, it } from "vitest";
import { defaultSettings, parseSettings } from "../src/settings";

describe("parseSettings", () => {
  it("returns defaults for missing or invalid data", () => {
    expect(parseSettings(undefined, "macos")).toEqual(defaultSettings("macos"));
    expect(parseSettings("nope", "windows")).toEqual(defaultSettings("windows"));
  });

  it("uses a different default shortcut per system", () => {
    expect(defaultSettings("macos").shortcut).toBe("Control+Alt+Command+V");
    expect(defaultSettings("windows").shortcut).toBe("Control+Alt+Shift+V");
  });

  it("keeps valid fields and replaces invalid ones", () => {
    const parsed = parseSettings(
      { theme: "dark", language: "xx", options: { mode: "keep-lines", fixLigatures: "yes" } },
      "windows",
    );
    expect(parsed.theme).toBe("dark");
    expect(parsed.language).toBe("auto");
    expect(parsed.options.mode).toBe("keep-lines");
    expect(parsed.options.fixLigatures).toBe(true);
  });
});
