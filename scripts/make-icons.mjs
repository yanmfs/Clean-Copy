// Renders public/icon.svg and the tray glyph to PNG with Chromium, then `pnpm tauri icon` takes over.
import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const icon = readFileSync("public/icon.svg", "utf8");
const trayGlyph = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g fill="#000"><rect x="16" y="24" width="68" height="14" rx="7"/><rect x="16" y="43" width="68" height="14" rx="7"/><rect x="16" y="62" width="40" height="14" rx="7"/></g></svg>`;

const browser = await chromium.launch({ channel: "chromium" });
const page = await browser.newPage();

async function render(svg, size, file) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}svg{width:${size}px;height:${size}px;display:block}</style>${svg}`,
  );
  writeFileSync(file, await page.screenshot({ omitBackground: true }));
}

mkdirSync("src-tauri/icons", { recursive: true });
await render(icon, 1024, "src-tauri/icon-source.png");
await render(icon, 32, "src-tauri/icons/tray-color.png");
await render(trayGlyph, 44, "src-tauri/icons/tray.png");
await browser.close();
