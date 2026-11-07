const LIGATURES: Record<string, string> = {
  "\u{FB00}": "ff",
  "\u{FB01}": "fi",
  "\u{FB02}": "fl",
  "\u{FB03}": "ffi",
  "\u{FB04}": "ffl",
  "\u{FB05}": "st",
  "\u{FB06}": "st",
};

export function normalizeChars(
  input: string,
  opts: { fixLigatures: boolean; fixHyphenation: boolean },
): { text: string; softHyphenJoins: number } {
  let text = input
    .replace(/\r\n?|\u{2028}|\u{2029}|\f/gu, "\n")
    .replace(/[\u{A0}\u{1680}\u{2000}-\u{200A}\u{202F}\u{205F}\u{3000}]/gu, " ")
    .replace(/[\u{200B}-\u{200D}\u{2060}\u{FEFF}]/gu, "");

  if (opts.fixLigatures) {
    text = text.replace(/[\u{FB00}-\u{FB06}]/gu, (c) => LIGATURES[c] ?? c);
  }

  let softHyphenJoins = 0;
  if (opts.fixHyphenation) {
    text = text.replace(/\u{AD}[ \t]*\n[ \t]*/gu, () => {
      softHyphenJoins++;
      return "";
    });
    text = text.replace(/\u{AD}/gu, "");
  }
  return { text, softHyphenJoins };
}
