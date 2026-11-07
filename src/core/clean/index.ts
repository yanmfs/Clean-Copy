import { looksLikeCode } from "./detect";
import { normalizeChars } from "./normalize";
import { rebuild } from "./rebuild";
import { tidyCodeLine, tidyLine } from "./spaces";
import { stripLineNumbers, stripPageNumbers, stripRepeatedHeaders } from "./strip";
import { defaultOptions, emptyStats, type CleanOptions, type CleanStats } from "./types";

export { defaultOptions } from "./types";
export type { CleanOptions, CleanStats } from "./types";

export function cleanText(
  input: string,
  options: Partial<CleanOptions> = {},
): { text: string; stats: CleanStats } {
  const opts = { ...defaultOptions, ...options };
  const stats = emptyStats();

  const normalized = normalizeChars(input, opts);
  stats.fixedHyphens += normalized.softHyphenJoins;
  let lines = normalized.text.split("\n");

  stats.looksLikeCode = looksLikeCode(lines);
  const keepsIndentation = stats.looksLikeCode && opts.mode !== "single-line";
  const tidy = keepsIndentation ? tidyCodeLine : tidyLine;
  const separator = opts.paragraphSeparator === "blank-line" ? "\n\n" : "\n";

  if (opts.mode === "spaces-only" || (keepsIndentation && opts.mode === "paragraphs")) {
    return { text: lines.map(tidy).join("\n").trim(), stats };
  }

  if (opts.removeLineNumbers) {
    const r = stripLineNumbers(lines);
    lines = r.lines;
    stats.removedLineNumbers = r.removed;
  }
  if (opts.removeRepeatedHeaders) {
    const r = stripRepeatedHeaders(lines);
    lines = r.lines;
    stats.removedHeaderLines = r.removed;
  }
  if (opts.removePageNumbers) {
    const r = stripPageNumbers(lines);
    lines = r.lines;
    stats.removedPageNumbers = r.removed;
  }

  if (opts.mode === "keep-lines") {
    return { text: lines.map(tidy).join("\n").trim(), stats };
  }

  const singleLine = opts.mode === "single-line";
  const paragraphs = rebuild(lines, { fixHyphenation: opts.fixHyphenation, singleLine }, stats);
  const text = paragraphs
    .map((p) => p.split("\n").map(tidy).join("\n"))
    .join(separator)
    .trim();
  return { text, stats };
}
