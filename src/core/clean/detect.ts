// "2. ed." in a citation is an edition, not a list entry
const LIST_ITEM =
  /^(?:[•◦▪●·‣⁃*—–-]\s|\d+[.)]\s(?!(?:ed|vol|n|p|pp|t)\.)|[a-z][.)]\s|[A-Z]\)\s|\(?[ivxlc]+\)\s|[IVXLC]+\s*[–-]\s)/;

const SECTION_NUMBER = /^(?:\d+(?:\.\d+)*\.?|[IVXLC]{2,}\.?|[IVXLC]\.)\s+\S/;

const PAGE_NUMBER =
  /^\s*(?:\d{1,4}|p(?:á|a)g(?:ina)?\.?\s*\d+(?:\s*(?:de|\/)\s*\d+)?|[-–]\s*\d+\s*[-–]|\d+\s*\/\s*\d+)\s*$/i;

export const isListItem = (line: string) => LIST_ITEM.test(line.trim());

export const isPageNumberLine = (line: string) => PAGE_NUMBER.test(line);

export const wordCount = (line: string) => line.trim().split(/\s+/).filter(Boolean).length;

export function looksLikeCode(lines: string[]): boolean {
  const filled = lines.filter((l) => l.trim() !== "");
  if (filled.length === 0) return false;
  const indented = filled.filter((l) => /^(?: {2,}|\t)/.test(l)).length;
  if (indented / filled.length <= 0.3) return false;
  const joined = filled.join("");
  const symbols = joined.match(/[{};=()<>]/g)?.length ?? 0;
  return symbols / joined.length >= 0.03;
}

export function isTitle(line: string, next: string, typical: number): boolean {
  const text = line.trim();
  if (text.length > typical * 0.6 || /[.,;:!?…]$/.test(text)) return false;
  if (!/^\p{Lu}/u.test(next.trim())) return false;
  const letters = text.replace(/[^\p{L}]/gu, "");
  const allCaps = letters.length >= 2 && letters === letters.toUpperCase();
  return allCaps || SECTION_NUMBER.test(text);
}

export const endsSentence = (line: string) => /[.!?:;…]["'”’»)\]]*$/.test(line.trimEnd());

const URL_TAIL = /(?:^|\s)(?:https?:\/\/|www\.)\S*[/\-_.?=&#]$/i;
export const endsWithUrlFragment = (line: string) => URL_TAIL.test(line.trimEnd());
