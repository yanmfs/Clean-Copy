import { describe, expect, it } from "vitest";
import { emptyStats } from "../src/core/clean/types";
import en from "../src/i18n/en.json";
import { resolveLang, summarize, translate } from "../src/i18n";
import ptBR from "../src/i18n/pt-BR.json";

describe("dictionaries", () => {
  it("define the same keys in both languages", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(ptBR).sort());
  });

  it("use the same placeholders in both languages", () => {
    const vars = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
    for (const [key, value] of Object.entries(ptBR)) {
      expect(vars(en[key as keyof typeof en]), key).toEqual(vars(value));
    }
  });
});

describe("translate", () => {
  it("picks the plural form", () => {
    expect(translate("pt-BR", "chips.joined", { count: 1 })).toBe("1 quebra unida");
    expect(translate("pt-BR", "chips.joined", { count: 14 })).toBe("14 quebras unidas");
    expect(translate("en", "chips.hyphens", { count: 1 })).toBe("1 hyphenation fixed");
  });

  it("falls back to the key when it is unknown", () => {
    expect(translate("en", "missing.key")).toBe("missing.key");
  });
});

describe("summarize", () => {
  it("lists only what changed", () => {
    const stats = { ...emptyStats(), joinedBreaks: 14, fixedHyphens: 2 };
    expect(summarize("pt-BR", stats)).toEqual(["14 quebras unidas", "2 hifenizações"]);
  });
});

describe("resolveLang", () => {
  it("follows the system locale when set to auto", () => {
    expect(resolveLang("auto", "pt-BR")).toBe("pt-BR");
    expect(resolveLang("auto", "de-DE")).toBe("en");
    expect(resolveLang("en", "pt-BR")).toBe("en");
  });
});
