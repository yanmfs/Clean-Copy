export interface CleanOptions {
  mode: "paragraphs" | "single-line" | "spaces-only" | "keep-lines";
  removePageNumbers: boolean;
  removeRepeatedHeaders: boolean;
  removeLineNumbers: boolean;
  fixHyphenation: boolean;
  fixLigatures: boolean;
  // Off by default: they change text that is not an artifact of copying.
  removeCitations: boolean;
  normalizeBullets: boolean;
  paragraphSeparator: "blank-line" | "newline";
}

export interface CleanStats {
  joinedBreaks: number;
  fixedHyphens: number;
  removedPageNumbers: number;
  removedHeaderLines: number;
  removedLineNumbers: number;
  removedCitations: number;
  looksLikeCode: boolean;
}

export const defaultOptions: CleanOptions = {
  mode: "paragraphs",
  removePageNumbers: true,
  removeRepeatedHeaders: true,
  removeLineNumbers: true,
  fixHyphenation: true,
  fixLigatures: true,
  removeCitations: false,
  normalizeBullets: false,
  paragraphSeparator: "blank-line",
};

export function emptyStats(): CleanStats {
  return {
    joinedBreaks: 0,
    fixedHyphens: 0,
    removedPageNumbers: 0,
    removedHeaderLines: 0,
    removedLineNumbers: 0,
    removedCitations: 0,
    looksLikeCode: false,
  };
}
