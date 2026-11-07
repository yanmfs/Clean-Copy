// Usage: node scripts/screenshots.mjs [baseUrl]  (Vite must be running)
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:1420";
const out = "docs/shots";
mkdirSync(out, { recursive: true });

const sample = [
  "A implementação de sistemas",
  "distribuídos apresenta diversos",
  "desafios relacionados à comuni-",
  "cação entre processos.",
  "",
  "Revista de Computação Aplicada, v. 12, n. 3",
  "Os testes foram executados em três etapas.",
  "Cada etapa durou cerca de duas semanas e",
  "envolveu a equipe inteira.",
  "14",
  "Revista de Computação Aplicada, v. 12, n. 3",
].join("\n");

const browser = await chromium.launch({ channel: "chromium" });

for (const os of ["macos", "windows"]) {
  for (const scheme of ["light", "dark"]) {
    const page = await browser.newPage({
      viewport: { width: 920, height: 600 },
      colorScheme: scheme,
      deviceScaleFactor: 2,
      locale: "pt-BR",
    });
    await page.goto(`${base}/?os=${os}`);
    await page.getByRole("textbox", { name: "Original" }).waitFor();
    await page.screenshot({ path: `${out}/${os}-${scheme}-empty.png` });
    await page.getByRole("textbox", { name: "Original" }).fill(sample);
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${out}/${os}-${scheme}-main.png` });
    if (os === "macos") {
      await page.getByRole("button", { name: "Configurações" }).click();
      await page.waitForTimeout(250);
      await page.screenshot({ path: `${out}/${os}-${scheme}-settings.png` });
    }
    await page.close();
  }
}
await browser.close();
