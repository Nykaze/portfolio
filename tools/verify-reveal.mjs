// Confere a revelacao scrolldriver por assercao, e nao por captura:
// o headless nao recompoe depois de um scrollTo, entao a foto sai branca.
// Aqui a gente rola de verdade e mede o estado final de cada bloco.
//
// Atencao: isto mede o caminho moderno (animation-timeline: view()).
// O caminho legado (IntersectionObserver) e conferido por pintura em
// tools/verify-legacy.mjs, porque aqui o getComputedStyle devolve cache
// velho sem pintura e mente sobre o resultado.
//
// Usa --dump-dom porque as animacoes infinitas travam o virtual time budget.
// Uso: node tools/verify-reveal.mjs [--fallback]
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
// --fallback simula um navegador sem animation-timeline: view()
const FALLBACK = process.argv.includes("--fallback");

const stub = `
<script>
(function () {
  var FALLBACK = ${FALLBACK};
  var realMatch = window.matchMedia.bind(window);
  var realSupports = CSS.supports.bind(CSS);
  var hasView = FALLBACK ? false : realSupports("animation-timeline", "view()");

  window.matchMedia = function (q) {
    if (/prefers-reduced-motion/.test(q)) {
      return { matches: false, media: q, addEventListener: function () {}, addListener: function () {} };
    }
    return realMatch(q);
  };

  // No modo fallback o navegador precisa responder que nao tem timeline,
  // senao o main.js continua caindo no caminho moderno. No modo moderno o
  // patch nao pode existir, ou os dois casos cairiam no mesmo caminho.
  if (FALLBACK) {
    CSS.supports = function (a, b) {
      if (/animation-timeline/.test(a)) return false;
      return realSupports.apply(null, arguments);
    };
  }

  window.__hasView = hasView;
})();
<\/script>`;

const probe = `
<script>
window.addEventListener("error", function (e) { document.title = "ERRO: " + e.message; });
window.addEventListener("load", function () {
  var out = [];
  function say(s) { out.push(s); document.title = out.join(" ;; "); }

  try {
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    var alvos = [].slice.call(document.querySelectorAll("[data-reveal]"));

    say("supportsView()......: " + window.__hasView);
    say("classe no html.......: " +
      (doc.classList.contains("js-scroll") ? "js-scroll" :
       doc.classList.contains("js-reveal") ? "js-reveal" : "nenhuma"));
    say("alvos [data-reveal]..: " + alvos.length);
    say("viewport / rolagem...: " + doc.clientHeight + " / " + max);

    var altos = alvos.filter(function (el) {
      return el.getBoundingClientRect().height > doc.clientHeight;
    });
    say("blocos > viewport....: " + altos.length + " (idealmente 0)");

    var primeiro = alvos[0];
    if (primeiro) {
      say("primeiro bloco......: opacity=" +
        Math.round(parseFloat(getComputedStyle(primeiro).opacity) * 100) / 100 +
        "  clip=" + getComputedStyle(primeiro).clipPath);
    }

    // Rolagem em etapas nao funciona aqui: sob virtual time o compositor nao
    // avanca a timeline de scroll, e getComputedStyle continua devolvendo o
    // estado inicial. O que funciona e forcar o scroll e exigir um
    // recalculo de estilo antes de medir.
    //
    // No caminho legado o observer so dispara para o que esta em tela no
    // momento da medicao: quem foi pulado por um salto unico continua
    // oculto ate ser visto de novo. Por isso o legado e medido bringing
    // cada bloco para a tela, como uma rolagem de verdade.
    function medir() {
      var fim = alvos.map(function (el) {
        var cs = getComputedStyle(el);
        return {
          alvo: (el.className || el.tagName).toString().slice(0, 24),
          op: Math.round(parseFloat(cs.opacity) * 100) / 100,
          clip: cs.clipPath
        };
      });
      say("");
      say("--- estado final ---");
      say("scrollY / max........: " + Math.round(window.scrollY) + " / " + max);
      fim.forEach(function (x) { say("  " + x.op + "  " + x.alvo + "  " + x.clip); });
      say("");
      say("ainda ocultos (op<0.99): " + fim.filter(function (x) { return x.op < 0.99; }).length);
      say("clip ainda fechado...: " +
        fim.filter(function (x) { return x.clip.indexOf("inset(0px 0px 100%") === 0; }).length);
    }

    window.scrollTo(0, max);
    window.dispatchEvent(new Event("scroll"));

    // Dois frames para assentar o scroll e um timeout para o observer.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        setTimeout(medir, 200);
      });
    });
  } catch (err) {
    say("EXCECAO: " + err.message);
  }
});
<\/script>`;

const base = readFileSync("index.html", "utf8");

// Neutraliza prefers-reduced-motion no CSS, senao o caminho animado nem roda.
const css = readFileSync("assets/css/styles.css", "utf8")
  .replace(/@media \(prefers-reduced-motion: no-preference\)/g, "@media all")
  .replace(/@media \(prefers-reduced-motion: reduce\)/g, "@media not all")
  // O site usa scroll-behavior: smooth. Sob scroll suave o scrollTo vira
  // animacao e o teste mede no lugar errado.
  + "\nhtml{scroll-behavior:auto !important}\n";
writeFileSync("assets/css/_verify.css", css);

const page = base
  .replace("<head>", "<head>\n" + stub + "\n" + probe)
  .replace('<link rel="stylesheet" href="assets/css/styles.css">',
           '<link rel="stylesheet" href="assets/css/_verify.css">');

const tmp = "_verify_reveal.html";
writeFileSync(tmp, page);

const dom = execFileSync(CHROME, [
  "--headless=new",
  "--disable-gpu",
  "--window-size=1280,720",
  "--virtual-time-budget=6000",
  "--dump-dom",
  `file:///D:/Portifolio/${tmp}`,
], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });

rmSync(tmp);
rmSync("assets/css/_verify.css");

const m = dom.match(/<title>([\s\S]*?)<\/title>/);
console.log((m ? m[1] : dom.slice(0, 600)).replace(/ ;; /g, "\n"));