import type { CleanStats } from "../core/clean";
import en from "./en.json";
import ptBR from "./pt-BR.json";

export type Lang = "pt-BR" | "en";
export type LangSetting = Lang | "auto";

type Dict = typeof ptBR;
type Plural<K> = K extends `${infer B}_one` ? B : K extends `${string}_other` ? never : K;
export type Key = Plural<keyof Dict>;

const dictionaries: Record<Lang, Record<string, string>> = { "pt-BR": ptBR, en };

export const resolveLang = (setting: LangSetting, systemLocale: string): Lang =>
  setting !== "auto" ? setting : systemLocale.toLowerCase().startsWith("pt") ? "pt-BR" : "en";

export function translate(
  lang: Lang,
  key: Key | `${string}.${string}`,
  vars: Record<string, string | number> = {},
): string {
  const dict = dictionaries[lang];
  let template = dict[key];
  if (template === undefined && typeof vars.count === "number") {
    const form = new Intl.PluralRules(lang).select(vars.count) === "one" ? "one" : "other";
    template = dict[`${key}_${form}`];
  }
  return (template ?? key).replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? ""));
}

export function summarize(lang: Lang, stats: CleanStats): string[] {
  const parts: [Key, number][] = [
    ["chips.joined", stats.joinedBreaks],
    ["chips.hyphens", stats.fixedHyphens],
    ["chips.pageNumbers", stats.removedPageNumbers],
    ["chips.headers", stats.removedHeaderLines],
    ["chips.lineNumbers", stats.removedLineNumbers],
  ];
  return parts
    .filter(([, count]) => count > 0)
    .map(([key, count]) => translate(lang, key, { count }));
}
