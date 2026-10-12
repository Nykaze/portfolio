// Captura o estado de meio caminho da revelacao, que e o que interessa olhar:
// o desfoque em cima de conteudo real, e nao so o antes e o depois.
//
// O headless nao refaz a rolagem (o compositor nao avanca a timeline sob
// virtual time), entao em vez de rolar a gente congela a animacao no ponto
// que queremos ver, forcando metade do progresso do keyframe.
//
// Uso: node tools/shoot-mid.mjs
// Saida: C:\Users\Gabriel\AppData\Local\Temp\opencode\shots\meio.png
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT = "C:\\Users\\Gabriel\\AppData\\Local\\Temp\\opencode\\shots";

// 55% de progresso do keyframe emerge: meio opaco e meio desfocado.
// A regra nao depende da classe .js-scroll porque no headless o main.js
// nao coloca nenhuma classe: o navegador emula prefers-reduced-motion.
const meio = `
<style>
  [data-reveal] { opacity:.55 !important; transform:translateY(11px) !important; filter:blur(5px) !important; animation:none !important; }
</style>`;

const html = readFileSync("index.html", "utf8");
writeFileSync("_meio.html", html.replace("<head>", "<head>" + meio));

execFileSync(CHROME, [
  "--headless=new", "--disable-gpu", "--hide-scrollbars",
  "--force-device-scale-factor=1", "--virtual-time-budget=8000",
  "--window-size=1440,2100",
  `--screenshot=${OUT}\\meio.png`,
  "file:///D:/Portifolio/_meio.html",
], { stdio: ["ignore", "pipe", "ignore"] });

rmSync("_meio.html");
console.log("estado de meio caminho pintado");
