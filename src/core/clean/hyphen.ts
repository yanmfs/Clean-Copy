const CLITICS = new Set("se lo la los las me te nos vos lhe lhes o a os as no na nas".split(" "));

const HYPHEN_PREFIXES = new Set("ex vice pos pre pro recem sem alem aquem bem gra grao".split(" "));

const COMPOUNDS = new Set([
  "guarda-chuva",
  "guarda-roupa",
  "porta-voz",
  "beija-flor",
  "couve-flor",
  "arco-iris",
  "bem-vindo",
  "bem-estar",
  "mal-estar",
  "decreto-lei",
  "salario-minimo",
  "medico-hospitalar",
  "latino-americano",
  "norte-americano",
  "sul-americano",
  "e-mail",
]);

export const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

export interface TextIndex {
  hyphenated: Set<string>;
  words: Set<string>;
}

export function indexText(lines: string[]): TextIndex {
  const hyphenated = new Set<string>();
  const words = new Set<string>();
  for (const line of lines) {
    for (const m of line.matchAll(/\p{L}+(?:-\p{L}+)+/gu)) hyphenated.add(fold(m[0]));
    for (const m of line.matchAll(/\p{L}+/gu)) words.add(fold(m[0]));
  }
  return { hyphenated, words };
}

export const trailingFragment = (line: string) =>
  /[\p{L}\p{N}'’-]*-$/u.exec(line)?.[0].slice(0, -1) ?? "";
export const leadingFragment = (line: string) => /^[\p{L}]+/u.exec(line.trimStart())?.[0] ?? "";

// Decides whether the hyphen at the end of a wrapped line belongs to the word.
export function keepsHyphen(fragA: string, next: string, index: TextIndex): boolean {
  const fragB = leadingFragment(next);
  const a = fold(fragA);
  const b = fold(fragB);

  if (index.words.has(a + b)) return false;
  if (/^\p{Lu}/u.test(fragB)) return true;
  if (a.includes("-")) return true;
  if (HYPHEN_PREFIXES.has(a)) return true;
  if (b === "feira" || COMPOUNDS.has(`${a}-${b}`)) return true;
  if (index.hyphenated.has(`${a}-${b}`)) return true;

  const rest = next.trimStart().slice(fragB.length);
  return CLITICS.has(b) && !/^\p{L}/u.test(rest);
}
