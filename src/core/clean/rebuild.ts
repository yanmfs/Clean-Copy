import { endsSentence, endsWithUrlFragment, isListItem, isTitle } from "./detect";
import { indexText, keepsHyphen, trailingFragment, type TextIndex } from "./hyphen";
import type { CleanStats } from "./types";

interface Entry {
  text: string;
  blanksBefore: number;
}

function toEntries(lines: string[]): Entry[] {
  const entries: Entry[] = [];
  let blanks = 0;
  for (const line of lines) {
    if (line.trim() === "") {
      blanks++;
      continue;
    }
    entries.push({ text: line.trim(), blanksBefore: entries.length === 0 ? 0 : blanks });
    blanks = 0;
  }
  return entries;
}

// Double-spaced text puts one blank line between every wrapped line. Telling it apart from
// paragraphs that happen to be one line long needs the lines to stop mid-sentence.
function isDoubleSpaced(entries: Entry[]): boolean {
  let gaps = 0;
  let single = 0;
  let midSentence = 0;
  for (let i = 1; i < entries.length; i++) {
    gaps++;
    if (entries[i]!.blanksBefore !== 1) continue;
    single++;
    if (!endsSentence(entries[i - 1]!.text)) midSentence++;
  }
  return gaps > 0 && single / gaps > 0.6 && midSentence / single >= 0.5;
}

function typicalLength(entries: Entry[]): number {
  const lengths = entries
    .filter((e) => !isListItem(e.text))
    .map((e) => e.text.length)
    .sort((a, b) => a - b);
  if (lengths.length === 0) return 0;
  return lengths[Math.ceil(lengths.length * 0.9) - 1] ?? 0;
}

type Join = "paragraph" | "newline" | "space" | "glue" | "hyphen-removed" | "hyphen-kept";

export interface RebuildOptions {
  fixHyphenation: boolean;
  singleLine: boolean;
}

export function rebuild(lines: string[], opts: RebuildOptions, stats: CleanStats): string[] {
  const entries = toEntries(lines);
  if (entries.length === 0) return [];

  const doubleSpaced = isDoubleSpaced(entries);
  const typical = typicalLength(entries);
  const index: TextIndex = indexText(entries.map((e) => e.text));
  const noRule6 = entries.length <= 3 && entries.every((e) => e.blanksBefore === 0);

  const paragraphs: string[] = [];
  let current = entries[0]?.text ?? "";

  for (let i = 1; i < entries.length; i++) {
    const a = entries[i - 1]!.text;
    const b = entries[i]!;
    const kind = opts.singleLine
      ? joinInline(a, b.text, opts, index)
      : decide(a, b, typical, doubleSpaced, noRule6, opts, index);

    switch (kind) {
      case "paragraph":
        paragraphs.push(current);
        current = b.text;
        break;
      case "newline":
        current += `\n${b.text}`;
        break;
      case "space":
        stats.joinedBreaks++;
        current += ` ${b.text}`;
        break;
      case "glue":
        stats.joinedBreaks++;
        current += b.text;
        break;
      case "hyphen-removed":
        stats.fixedHyphens++;
        current = current.slice(0, -1) + b.text;
        break;
      case "hyphen-kept":
        stats.fixedHyphens++;
        current += b.text;
        break;
    }
  }
  paragraphs.push(current);
  return paragraphs;
}

function joinInline(a: string, b: string, opts: RebuildOptions, index: TextIndex): Join {
  if (endsWithUrlFragment(a)) return "glue";
  if (opts.fixHyphenation && /\p{L}-$/u.test(a) && /^\p{L}/u.test(b)) {
    return keepsHyphen(trailingFragment(a), b, index) ? "hyphen-kept" : "hyphen-removed";
  }
  return "space";
}

function decide(
  a: string,
  b: Entry,
  typical: number,
  doubleSpaced: boolean,
  noRule6: boolean,
  opts: RebuildOptions,
  index: TextIndex,
): Join {
  const blanks = doubleSpaced && b.blanksBefore === 1 ? 0 : b.blanksBefore;
  if (blanks > 0) return "paragraph";
  if (isListItem(b.text)) return "newline";
  if (isTitle(a, b.text, typical)) return "paragraph";

  const inline = joinInline(a, b.text, opts, index);
  if (inline !== "space") return inline;

  if (!noRule6 && endsSentence(a) && a.length < typical * 0.8) return "paragraph";
  return "space";
}
