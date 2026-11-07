import { describe, expect, it } from "vitest";
import { cleanText } from "../src/core/clean";
import { diffText, type Segment } from "../src/core/diff";

const side = (segments: Segment[], drop: "add" | "del") =>
  segments
    .filter((s) => s.kind !== drop)
    .map((s) => s.text)
    .join("");

describe("diffText", () => {
  it("marks nothing when the text does not change", () => {
    expect(diffText("um dois", "um dois")).toEqual([{ kind: "same", text: "um dois" }]);
  });

  it("marks a joined line break", () => {
    const segments = diffText("a casa\nbranca", "a casa branca") ?? [];
    expect(segments.some((s) => s.kind === "del" && s.text.includes("\n"))).toBe(true);
    expect(segments.some((s) => s.kind === "add" && s.text === " ")).toBe(true);
  });

  it("marks a removed page number", () => {
    const segments = diffText("fim da frase.\n12\ncomeço", "fim da frase.\ncomeço") ?? [];
    expect(segments.find((s) => s.kind === "del")?.text).toContain("12");
  });

  it("rebuilds both texts exactly from the segments", () => {
    const original = [
      "Introdução",
      "",
      "Este texto foi copiado de um PDF com qua-",
      "bras no meio das frases e de palavras.",
      "",
      "Relatório Anual",
      "",
      "A segunda parte continua aqui, com mais",
      "uma linha.",
      "12",
    ].join("\n");
    const { text } = cleanText(original);
    const segments = diffText(original, text) ?? [];
    expect(side(segments, "add")).toBe(original);
    expect(side(segments, "del")).toBe(text);
  });

  it("gives up on edits that are too many to be useful", () => {
    const a = Array.from({ length: 4000 }, (_, i) => `a${i}`).join(" ");
    const b = Array.from({ length: 4000 }, (_, i) => `b${i}`).join(" ");
    expect(diffText(a, b)).toBeNull();
  });

  it("handles empty sides", () => {
    expect(diffText("", "")).toEqual([]);
    expect(diffText("abc", "")).toEqual([{ kind: "del", text: "abc" }]);
    expect(diffText("", "abc")).toEqual([{ kind: "add", text: "abc" }]);
  });
});
