// Captura telas para conferencia visual.
// O Chrome headless no Windows tem largura minima de 500px, entao a
// captura "mobile" e feita dentro de um iframe de 390px.
// Uso: node tools/shots.mjs
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT = "C:\\Users\\Gabriel\\AppData\\Local\\Temp\\opencode\\shots";
mkdirSync(OUT, { recursive: true });

const html = readFileSync("index.html", "utf8");

// Sem JS de animacao e com o reveal zerado, para ver o estado final.
const flat = (theme) =>
  html
    .replace('<html lang="pt-BR" data-theme="auto">', `<html lang="pt-BR" data-theme="${theme}">`)
    .replace(/<script src="assets\/js\/main.js" defer><\/script>/, "")
    .replace("<head>", "<head>\n<style>[data-reveal]{opacity:1!important;transform:none!important;clip-path:none!important;filter:none!important;animation:none!important}</style>");

for (const theme of ["dark", "light"]) {
  const tmp = `_shot-${theme}.html`;
  writeFileSync(tmp, flat(theme));

  // Desktop: captura direta, pagina inteira.
  execFileSync(CHROME, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars",
    "--force-device-scale-factor=1", "--virtual-time-budget=8000",
    "--window-size=1440,4200",
    `--screenshot=${OUT}\\desktop-${theme}.png`,
    `file:///D:/Portifolio/${tmp}`,
  ]);

  // Mobile: iframe de 390px dentro de uma janela de 500px.
  const wrap = `<!DOCTYPE html><meta charset="utf-8">
<style>html,body{margin:0;background:#888}iframe{display:block;width:390px;height:2400px;border:0;margin:0 auto}</style>
<iframe src="${tmp}"></iframe>`;
  const wrapFile = `_wrap-${theme}.html`;
  writeFileSync(wrapFile, wrap);

  execFileSync(CHROME, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars",
    "--force-device-scale-factor=1", "--virtual-time-budget=8000",
    "--window-size=500,2400",
    `--screenshot=${OUT}\\mobile-${theme}.png`,
    `file:///D:/Portifolio/${wrapFile}`,
  ]);

  rmSync(tmp);
  rmSync(wrapFile);
  console.log("shots", theme);
}