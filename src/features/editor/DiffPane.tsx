import type { Segment } from "../../core/diff";

const CLASS = {
  del: "rounded-sm bg-danger/10 text-muted line-through decoration-danger/70",
  add: "rounded-sm bg-accent/20",
  same: "",
} as const;

// A line break that was removed shows a faint arrow, drawn by CSS so it never ends up in a copy.
const isBreak = (s: Segment) => s.kind === "del" && s.text.trim() === "" && s.text.includes("\n");

export function DiffPane({
  label,
  segments,
  side,
}: {
  label: string;
  segments: Segment[];
  side: "original" | "clean";
}) {
  const hidden = side === "original" ? "add" : "del";
  return (
    <div
      role="textbox"
      aria-readonly="true"
      aria-multiline="true"
      aria-label={label}
      tabIndex={0}
      className={`min-h-0 flex-1 overflow-auto whitespace-pre-wrap break-words rounded-panel border border-border p-3.5 leading-relaxed ${side === "original" ? "bg-surface" : "bg-surface-2"}`}
    >
      {segments
        .filter((s) => s.kind !== hidden)
        .map((s, i) => (
          <span
            key={i}
            className={`${CLASS[s.kind]} ${isBreak(s) ? "before:text-muted before:content-['↵']" : ""}`}
          >
            {s.text}
          </span>
        ))}
    </div>
  );
}
