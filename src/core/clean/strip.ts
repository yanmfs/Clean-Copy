import { isPageNumberLine, wordCount } from "./detect";

const NUMBERED = /^(\s*)(\d{1,4})\s+(?=\S)/;

export function stripLineNumbers(lines: string[]): { lines: string[]; removed: number } {
  const filled = lines.flatMap((line, index) => (line.trim() === "" ? [] : [{ line, index }]));
  const marked = new Set<number>();
  let run: number[] = [];
  let last = 0;

  const flush = () => {
    if (run.length >= 3) run.forEach((i) => marked.add(i));
    run = [];
  };
  for (const { line, index } of filled) {
    const n = Number(NUMBERED.exec(line)?.[2]);
    if (!Number.isNaN(n) && run.length > 0 && n > last) {
      run.push(index);
      last = n;
      continue;
    }
    flush();
    if (!Number.isNaN(n)) {
      run = [index];
      last = n;
    }
  }
  flush();

  if (marked.size === 0 || marked.size / filled.length < 0.7) return { lines, removed: 0 };
  return {
    lines: lines.map((line, i) => (marked.has(i) ? line.replace(NUMBERED, "$1") : line)),
    removed: marked.size,
  };
}

const headerKey = (line: string) => line.trim().toLowerCase().replace(/\d/g, "#");

export function stripRepeatedHeaders(lines: string[]): { lines: string[]; removed: number } {
  if (lines.filter((l) => l.trim() !== "").length < 6) return { lines, removed: 0 };

  const counts = new Map<string, number>();
  const candidate = (line: string) => wordCount(line) >= 3 && line.trim().length <= 90;
  for (const line of lines) {
    if (candidate(line)) counts.set(headerKey(line), (counts.get(headerKey(line)) ?? 0) + 1);
  }
  const kept = lines.filter((line) => !candidate(line) || (counts.get(headerKey(line)) ?? 0) < 2);
  return { lines: kept, removed: lines.length - kept.length };
}

export function stripPageNumbers(lines: string[]): { lines: string[]; removed: number } {
  const others = lines.filter((l) => l.trim() !== "" && !isPageNumberLine(l));
  const prose = others.filter((l) => wordCount(l) >= 3).length;
  if (others.length === 0 || prose / others.length < 0.7) return { lines, removed: 0 };

  const kept = lines.filter((l) => !isPageNumberLine(l));
  return { lines: kept, removed: lines.length - kept.length };
}
