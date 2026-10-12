// Confere a revelacao por desfoque, em duas execucoes separadas:
//
//   1. no fim da pagina: nada pode continuar oculto ou desfocado;
//   2. no meio da pagina: tem que haver bloco com desfoque pela metade,
//      senao o teste nao prova que o efeito existe. So chegar limpo no fim
//      passaria para qualquer coisa.
//
// Cada cenario e um Chrome proprio porque o headless nao recalcula estilo
// depois de um scroll dentro da mesma pagina: sob virtual time o compositor
// nao avanca a timeline e getComputedStyle devolve cache velho.
//
// Tambem nao da para medir o caminho legado por aqui. O getComputedStyle
// mente sobre ele sem pintura; o que mede isso e tools/verify-legacy.mjs.
//
// Uso: node tools/verify-reveal.mjs [--fallback]
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const FALLBACK = process.argv.includes("--fallback");
// Janela por variavel porque o defeito que este teste existe para pegar so
// aparece em alturas diferentes de tela. Ex.: VR_SIZE=1920,1080
const WINDOW = process.env.VR_SIZE || "1280,720";

const stub = `
<script>
(function () {
  var FALLBACK = ${FALLBACK};
  var realMatch = window.matchMedia.bind(window);
  var realSupports = CSS.supports.bind(CSS);

  window.matchMedia = function (q) {
    if (/prefers-reduced-motion/.test(q)) {
      return { matches: false, media: q, addEventListener: function () {}, addListener: function () {} };
    }
    return realMatch(q);
  };

  // No modo fallback o navegador precisa responder que nao tem timeline,
  // senao o main.js continua caindo no caminho moderno.
  if (FALLBACK) {
    CSS.supports = function (a) {
      if (/animation-timeline/.test(a)) return false;
      return realSupports.apply(null, arguments);
    };
  }
})();
</script>`;

// Fracao da rolagem: 1 = fim da pagina, 0.45 = meio.
function probe(fracao) {
  return `
<script>
window.addEventListener("error", function (e) { document.title = "ERRO: " + e.message; });
window.addEventListener("load", function () {
  var out = [];
  function say(s) { out.push(s); document.title = out.join(" ;; "); }

  // blur(0px) e blur(none) sao a mesma coisa na tela. O navegador devolve
  // o primeiro quando termina a interpolacao, entao aceitar so "none"
  // reprovaria o teste num site que esta certo.
  function px(f) { var m = /blur\\(([\\d.]+)px\\)/.exec(f); return m ? parseFloat(m[1]) : 0; }

  try {
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    var alvos = [].slice.call(document.querySelectorAll("[data-reveal]"));
    var alvo = Math.round(max * ${fracao});

    say("fracao ..............: ${fracao}");
    say("classe no html.......: " +
      (doc.classList.contains("js-scroll") ? "js-scroll" :
       doc.classList.contains("js-reveal") ? "js-reveal" : "nenhuma"));
    say("alvos ...............: " + alvos.length);
    say("viewport / max ......: " + doc.clientHeight + " / " + max);
    say("scroll pedido ........: " + alvo);

    window.scrollTo(0, alvo);
    window.dispatchEvent(new Event("scroll"));

    setTimeout(function () {
      var naTela = alvos.filter(function (el) {
        var r = el.getBoundingClientRect();
        return r.bottom > 0 && r.top < doc.clientHeight;
      });
      var desfocados = naTela.filter(function (el) { return px(getComputedStyle(el).filter) > 0.2; });
      var ocultos = alvos.filter(function (el) { return parseFloat(getComputedStyle(el).opacity) < 0.99; });
      var borrados = alvos.filter(function (el) { return px(getComputedStyle(el).filter) > 0.2; });
      var noMeio = naTela.filter(function (el) {
        var v = px(getComputedStyle(el).filter);
        return v > 0.2 && v < 8.8;
      });

      say("");
      say("em tela ..............: " + naTela.length);
      say("em tela desfocados ...: " + desfocados.length);
      say("na pagina desfocados .: " + borrados.length);
      say("na pagina ocultos ....: " + ocultos.length);
      say("desfoque pela metade .: " + noMeio.length);
    }, 250);
  } catch (err) {
    say("EXCECAO: " + err.message);
  }
});
</script>`;
}

const base = readFileSync("index.html", "utf8");

// Neutraliza prefers-reduced-motion no CSS, senao o caminho animado nem roda,
// e mata o scroll suavizado, que faria o scrollTo virar animacao.
const css = readFileSync("assets/css/styles.css", "utf8")
  .replace(/@media \(prefers-reduced-motion: no-preference\)/g, "@media all")
  .replace(/@media \(prefers-reduced-motion: reduce\)/g, "@media not all")
  + "\nhtml{scroll-behavior:auto !important}\n";
writeFileSync("assets/css/_verify.css", css);

function rodar(fracao) {
  const page = base
    .replace("<head>", "<head>\n" + stub + "\n" + probe(fracao))
    .replace('<link rel="stylesheet" href="assets/css/styles.css">',
             '<link rel="stylesheet" href="assets/css/_verify.css">');

  const tmp = `_verify_reveal.html`;
  writeFileSync(tmp, page);

  const dom = execFileSync(CHROME, [
    "--headless=new", "--disable-gpu",
    `--window-size=${WINDOW}`,
    "--virtual-time-budget=6000",
    "--dump-dom",
    `file:///D:/Portifolio/${tmp}`,
  ], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] });

  rmSync(tmp);
  return dom.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "sem title";
}

console.log("=== caminho " + (FALLBACK ? "legado (IntersectionObserver)" : "moderno (animation-timeline: view())") + " ===");
for (const fracao of [1, 0.45]) {
  console.log("");
  console.log(rodar(fracao).replace(/ ;; /g, "\n"));
}

rmSync("assets/css/_verify.css");
