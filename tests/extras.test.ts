import { describe, expect, it } from "vitest";
import { cleanText } from "../src/core/clean";

const on = { removeCitations: true, normalizeBullets: true };

describe("citations", () => {
  it("removes numbered citations after a word", () => {
    const { text, stats } = cleanText(
      "Segundo o estudo [3], a taxa subiu [2, 5] e depois [4-7].",
      on,
    );
    expect(text).toBe("Segundo o estudo, a taxa subiu e depois.");
    expect(stats.removedCitations).toBe(3);
  });

  it("keeps the label of a reference list", () => {
    const { text } = cleanText("[1] Silva, J. Texto de exemplo. 2020.\n[2] Souza, M. Outro.", on);
    expect(text).toContain("[1] Silva");
    expect(text).toContain("[2] Souza");
  });

  it("leaves brackets that are not citations", () => {
    expect(cleanText("O vetor [x] e a lista [a, b] ficam.", on).text).toBe(
      "O vetor [x] e a lista [a, b] ficam.",
    );
  });

  it("does nothing unless asked", () => {
    expect(cleanText("Texto [3] fica.").text).toBe("Texto [3] fica.");
  });

  it("leaves indexing in code alone", () => {
    const { text, stats } = cleanText("const a = items[0]; const b = items[1];", on);
    expect(text).toContain("items[0]");
    expect(text).toContain("items[1]");
    expect(stats.removedCitations).toBe(0);
  });
});

describe("bullets", () => {
  it("standardizes the different bullet glyphs", () => {
    const { text } = cleanText("● primeiro item\n▪ segundo item\n◦terceiro item", {
      ...on,
      mode: "keep-lines",
    });
    expect(text).toBe("• primeiro item\n• segundo item\n• terceiro item");
  });

  it("is idempotent together with the citations", () => {
    const input = "● Resultado do teste [1] foi bom.\n● Outro [2, 3] ponto.";
    const once = cleanText(input, { ...on, mode: "keep-lines" }).text;
    expect(cleanText(once, { ...on, mode: "keep-lines" }).text).toBe(once);
  });
});
