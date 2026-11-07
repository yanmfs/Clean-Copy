import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { cleanText } from "../src/core/clean";

const dir = join(__dirname, "fixtures", "clean");
const read = (file: string) => readFileSync(join(dir, file), "utf8");
const names = readdirSync(dir)
  .filter((f) => f.endsWith(".in.txt"))
  .map((f) => f.replace(".in.txt", ""));

const alnum = (s: string) => s.replace(/[^\p{L}\p{N}]/gu, "");

describe("fixtures", () => {
  it("has at least 40 cases", () => {
    expect(names.length).toBeGreaterThanOrEqual(40);
  });

  describe.each(names)("%s", (name) => {
    const input = read(`${name}.in.txt`);
    const expected = read(`${name}.out.txt`);
    const { text, stats } = cleanText(input);

    it("produces the expected text", () => {
      expect(text).toBe(expected);
    });

    it("is idempotent", () => {
      expect(cleanText(text).text).toBe(text);
    });

    it("never starts or ends with whitespace", () => {
      expect(text).toBe(text.trim());
    });

    it("keeps every letter and digit that was not reported as removed", () => {
      const removed =
        stats.removedHeaderLines + stats.removedLineNumbers + stats.removedPageNumbers;
      if (removed > 0) return;
      const ligatureFree = input
        .replace(/[\u{200B}-\u{200D}\u{AD}]/gu, "")
        .replace(/\u{FB00}/gu, "ff")
        .replace(/\u{FB01}/gu, "fi")
        .replace(/\u{FB02}/gu, "fl")
        .replace(/\u{FB03}/gu, "ffi");
      expect(alnum(text)).toBe(alnum(ligatureFree));
    });
  });
});

describe("stats", () => {
  it("flags code", () => {
    expect(cleanText(read("q-code-kept.in.txt")).stats.looksLikeCode).toBe(true);
  });

  it("counts removed artifacts", () => {
    const { stats } = cleanText(read("l-header-and-page-number.in.txt"));
    expect(stats.removedHeaderLines).toBe(2);
    expect(stats.removedPageNumbers).toBe(1);
  });

  it("counts line numbers and hyphens", () => {
    expect(cleanText(read("k-line-numbers.in.txt")).stats.removedLineNumbers).toBe(3);
    expect(cleanText(read("d-hyphen-removed.in.txt")).stats.fixedHyphens).toBe(1);
  });

  it("reports joined breaks", () => {
    expect(cleanText("uma frase que\nse espalha por\nvárias linhas").stats.joinedBreaks).toBe(2);
  });
});

describe("options", () => {
  const wrapped = "Primeira parte do texto\ncontinua aqui.\n\nSegunda parte\nvem depois.";

  it("joins everything in single-line mode", () => {
    const { text } = cleanText(wrapped, { mode: "single-line" });
    expect(text).toBe("Primeira parte do texto continua aqui. Segunda parte vem depois.");
  });

  it("only tidies spaces in spaces-only mode", () => {
    const { text } = cleanText("a  b ,\nc", { mode: "spaces-only" });
    expect(text).toBe("a b,\nc");
  });

  it("keeps the lines in keep-lines mode but drops page numbers", () => {
    const input = "Uma linha de texto comum aqui\n12\nOutra linha de texto comum aqui";
    expect(cleanText(input, { mode: "keep-lines" }).text).toBe(
      "Uma linha de texto comum aqui\nOutra linha de texto comum aqui",
    );
  });

  it("separates paragraphs with a single newline when asked", () => {
    const { text } = cleanText(wrapped, { paragraphSeparator: "newline" });
    expect(text).toBe("Primeira parte do texto continua aqui.\nSegunda parte vem depois.");
  });

  it("leaves hyphens alone when hyphenation fixing is off", () => {
    const { text } = cleanText("A implemen-\ntação foi concluída.", { fixHyphenation: false });
    expect(text).toBe("A implemen- tação foi concluída.");
  });

  it("keeps page numbers when removal is off", () => {
    const input = "Uma linha de texto comum aqui\n12\nOutra linha de texto comum aqui";
    const { text } = cleanText(input, { mode: "keep-lines", removePageNumbers: false });
    expect(text).toContain("\n12\n");
  });

  it("keeps ligatures when fixing is off", () => {
    expect(cleanText("e\u{FB01}ciente", { fixLigatures: false }).text).toBe("e\u{FB01}ciente");
  });
});
