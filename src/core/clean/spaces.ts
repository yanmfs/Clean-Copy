export function tidyLine(line: string): string {
  return line
    .replace(/[ \t]+/g, " ")
    .replace(/ +([,.;:!?)])/g, "$1")
    .replace(/\( +/g, "(")
    .trim();
}

// Keeps indentation: only trailing whitespace is noise in code.
export const tidyCodeLine = (line: string) => line.replace(/[ \t]+$/, "");
