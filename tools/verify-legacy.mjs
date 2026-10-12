// Confere o caminho legado da revelacao: o IntersectionObserver, usado onde
// o navegador nao tem animation-timeline: view() (Firefox, por exemplo).
//
// Este teste pinta a pagina de verdade. Nao da para usar --dump-dom: ele so
// le o DOM e o Chrome nao recalcula estilo sem pintura, entao a mediacao
// devolve um cache velho e parece que o conteudo sumiu. Com --screenshot a
// pagina pinta e o conteudo aparece ou nao aparece, sem meio termo.
//
// Uso: node tools/verify-legacy.mjs
import { readFileSync, writeFileSync, rmSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT = "C:\\Users\\Gabriel\\AppData\\Local\\Temp\\opencode\\shots\\legacy.png";

// Duas fingidas: o navegador nao tem timeline de scroll, e o usuario nao
// pediu menos movimento. So assim o main.js segue o caminho legado no Chrome.
const stub = `<script>
(function () {
  var real = window.matchMedia.bind(window);
  var rs = CSS.supports.bind(CSS);
  window.matchMedia = function (q) {
    if (/prefers-reduced-motion/.test(q)) {
      return { matches: false, media: q, addEventListener: function () {}, addListener: function () {} };
    }
    return real(q);
  };
  CSS.supports = function (a, b) {
    if (/animation-timeline/.test(a)) return false;
    return rs.apply(null, arguments);
  };
})();
</script>`;

const html = readFileSync("index.html", "utf8");
writeFileSync("_legacy.html", html.replace("<head>", "<head>" + stub));

execFileSync(CHROME, [
  "--headless=new", "--disable-gpu", "--hide-scrollbars",
  "--force-device-scale-factor=1", "--virtual-time-budget=8000",
  "--window-size=1440,4400",
  `--screenshot=${OUT}`,
  "file:///D:/Portifolio/_legacy.html",
], { stdio: ["ignore", "pipe", "ignore"] });
rmSync("_legacy.html");

// Janela alta o bastante para a pagina inteira caber, entao todos os blocos
// entram em tela de uma vez e o observer tem que revelar todos.
const bytes = statSync(OUT).size;
const ok = bytes > 200_000;

console.log("caminho legado (IntersectionObserver)");
console.log("  captura ..........: " + (bytes / 1024).toFixed(0) + " KB");
console.log("  parece renderizado: " + (ok ? "sim" : "NAO (pagina quase vazia)"));
console.log(ok ? "  resultado ........: ok" : "  resultado ........: FALHOU");

process.exit(ok ? 0 : 1);
