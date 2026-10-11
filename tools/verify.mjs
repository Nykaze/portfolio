// Verificacao de execucao: carrega a pagina com JS ligado e imprime o
// estado das animacoes e qualquer erro de console.
// Usa --dump-dom porque as animacoes infinitas travam o virtual time budget.
// Uso: node tools/verify.mjs [--motion]
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const FORCE_MOTION = process.argv.includes("--motion");

const stub = `
<script>
// Antes de qualquer coisa: matchMedia diz que movimento e aceito.
(function () {
  var real = window.matchMedia.bind(window);
  window.matchMedia = function (q) {
    if (/prefers-reduced-motion/.test(q)) {
      return { matches: false, media: q, addEventListener: function () {}, addListener: function () {} };
    }
    return real(q);
  };
})();
<\/script>`;

const probe = `
<script>
window.__errors = [];
window.addEventListener("error", function (e) { window.__errors.push(String(e.message)); });
window.addEventListener("load", function () {
  window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) / 2);
  window.dispatchEvent(new Event("scroll"));
  setTimeout(function () {
    var root = document.documentElement;
    var bar = document.getElementById("progress-bar");
    var rail = document.querySelector(".flow__rail");
    var dot = document.querySelector(".flow__dot");
    var cs = rail ? getComputedStyle(rail) : null;
    var out = [
      "erros de JS .......: " + (window.__errors.length ? window.__errors.join(" | ") : "nenhum"),
      "html.js-reveal ...: " + root.classList.contains("js-reveal"),
      "html.js-anim .....: " + root.classList.contains("js-anim"),
      "data-reveal total .: " + document.querySelectorAll("[data-reveal]").length,
      "ja revelados .....: " + document.querySelectorAll("[data-reveal].is-in").length,
      "barra progresso ..: " + (bar ? bar.style.transform : "sem barra"),
      "rail animacao ....: " + (cs ? cs.animationName + " " + cs.animationDuration : "sem rail"),
      "dot animacao .....: " + (dot ? getComputedStyle(dot).animationName : "-"),
      "tema .............: " + root.getAttribute("data-theme")
    ].join(" ;; ");
    document.title = out;
  }, 500);
});
<\/script>`;

let page = readFileSync("index.html", "utf8");
const cssPath = "assets/css/styles.css";
const css = readFileSync(cssPath, "utf8");

if (FORCE_MOTION) {
  // Aplica o CSS com a media query de movimento neutralizada, via <style>
  // que sobrescreve a ordem do arquivo de estilos.
  const neutral = css
    .replace(/@media \(prefers-reduced-motion: no-preference\)/g, "@media all")
    .replace(/@media \(prefers-reduced-motion: reduce\)/g, "@media not all");
  writeFileSync("assets/css/_verify.css", neutral);
  page = page.replace(`<link rel="stylesheet" href="${cssPath}">`,
    `<link rel="stylesheet" href="assets/css/_verify.css">`);
}

page = page.replace("<head>", "<head>\n" + stub + "\n" + probe);

const tmp = "_verify.html";
writeFileSync(tmp, page);

const dom = execFileSync(CHROME, [
  "--headless=new",
  "--disable-gpu",
  "--window-size=1440,900",
  "--virtual-time-budget=4000",
  "--dump-dom",
  `file:///D:/Portifolio/${tmp}`,
], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });

rmSync(tmp);
if (FORCE_MOTION) rmSync("assets/css/_verify.css");

const m = dom.match(/<title>([\s\S]*?)<\/title>/);
console.log((m ? m[1] : dom.slice(0, 400)).replace(/ ;; /g, "\n"));