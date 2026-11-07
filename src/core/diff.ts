export type SegmentKind = "same" | "del" | "add";

export interface Segment {
  kind: SegmentKind;
  text: string;
}

// Words and the whitespace between them are compared as units, which keeps the result readable
// and the search small.
const tokenize = (text: string): string[] => text.match(/\s+|\S+/g) ?? [];

// Past this many edits the highlight stops being useful and its memory use stops being small.
const MAX_EDITS = 1500;

type Op = "same" | "del" | "add";

// Myers' shortest edit script, with one snapshot of the frontier per round to walk back from.
function edit(a: string[], b: string[]): Op[] | null {
  const n = a.length;
  const m = b.length;
  const max = Math.min(n + m, MAX_EDITS);
  const offset = max + 1;
  const frontier = new Int32Array(2 * max + 3);
  const trace: Int32Array[] = [];

  for (let d = 0; d <= max; d++) {
    trace.push(frontier.slice());
    for (let k = -d; k <= d; k += 2) {
      let x =
        k === -d || (k !== d && (frontier[offset + k - 1] ?? 0) < (frontier[offset + k + 1] ?? 0))
          ? (frontier[offset + k + 1] ?? 0)
          : (frontier[offset + k - 1] ?? 0) + 1;
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) {
        x++;
        y++;
      }
      frontier[offset + k] = x;
      if (x >= n && y >= m) return backtrack(trace, d, n, m, offset);
    }
  }
  return null;
}

function backtrack(trace: Int32Array[], last: number, n: number, m: number, offset: number): Op[] {
  const ops: Op[] = [];
  let x = n;
  let y = m;
  for (let d = last; d > 0; d--) {
    const v = trace[d]!;
    const k = x - y;
    const down = k === -d || (k !== d && (v[offset + k - 1] ?? 0) < (v[offset + k + 1] ?? 0));
    const prevK = down ? k + 1 : k - 1;
    const prevX = v[offset + prevK] ?? 0;
    const prevY = prevX - prevK;
    while (x > prevX && y > prevY) {
      ops.push("same");
      x--;
      y--;
    }
    ops.push(down ? "add" : "del");
    x = prevX;
    y = prevY;
  }
  while (x > 0 && y > 0) {
    ops.push("same");
    x--;
    y--;
  }
  return ops.reverse();
}

// Returns null when the texts differ too much to mark up.
export function diffText(original: string, cleaned: string): Segment[] | null {
  const a = tokenize(original);
  const b = tokenize(cleaned);
  const ops = edit(a, b);
  if (!ops) return null;

  const out: Segment[] = [];
  const push = (kind: SegmentKind, text: string) => {
    const last = out[out.length - 1];
    if (last?.kind === kind) last.text += text;
    else out.push({ kind, text });
  };
  let i = 0;
  let j = 0;
  for (const op of ops) {
    if (op === "same") {
      push("same", a[i] ?? "");
      i++;
      j++;
    } else if (op === "del") push("del", a[i++] ?? "");
    else push("add", b[j++] ?? "");
  }
  return out;
}
