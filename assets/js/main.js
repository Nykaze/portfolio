/* =========================================================
   Gabriel Nykaze · portfolio
   Sem dependencias. Sem build.
   - barra de progresso do scroll (transform puro)
   - revelacao por secao ao entrar na tela
   - animacao do diagrama request -> resposta (CSS)
   - animacao de chegada do hero
   - menu do mobile
   - nav colada e alternador de tema
   ========================================================= */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- 1. Barra de progresso ------------------------------ */
  /* Le a posicao uma vez por quadro e escreve so transform.
     Nada de estado no React, nada de reflow em cascata. */
  var bar = document.getElementById("progress-bar");
  if (bar) {
    var queued = false;

    function paint() {
      queued = false;
      var doc = document.documentElement;
      var max = doc.scrollHeight - doc.clientHeight;
      var pct = max > 0 ? Math.min(doc.scrollTop / max, 1) : 0;
      bar.style.transform = "scaleX(" + pct + ")";
    }

    function queue() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(paint);
    }

    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    paint();
  }

  /* ---- 2. Revelacao --------------------------------------- */
  /* O efeito e o mesmo nos dois caminhos, mas a execucao muda:
     onde existe timeline de scroll, quem conduz e a barra de rolagem e o
     texto aparece sob o seu comando. Onde nao existe, o reveal acontece
     quando o bloco entra na tela. */
  if (!reduced && "IntersectionObserver" in window) {
    var supportsScrollTimeline =
      typeof CSS !== "undefined" &&
      CSS.supports &&
      CSS.supports("animation-timeline", "view()");

    /* O scrub so existe onde o bloco tem tempo de tela. Quem esta no fim
       do documento nao percorre a faixa cover inteira: em telas altas a
       lista de contato parava com parte cortada no fim da rolagem. Aqui a
       gente encurta o fim de quem nao alcanca, partindo do fim nominal
       que o CSS ja definiu (42/47/52/57%). O CSS continua mandando. */
    var FOLGA = 8; // pontos percentuais antes do alcance real
    var MINIMO = 8; // piso pratico: abaixo disso o bloco revela cedo demais

    var alvosFim = document.querySelectorAll("[data-reveal]");

    // Guarda o fim nominal antes de qualquer calibracao, senao a proxima
    // leitura enxergaria o valor que a gente acabou de escrever.
    alvosFim.forEach(function (el) {
      var nominal = parseFloat(getComputedStyle(el).animationRangeEnd);
      if (!isNaN(nominal)) el.dataset.revealEnd = String(nominal);
    });

    function calibrarFim() {
      var doc = document.documentElement;
      var vp = doc.clientHeight;
      var fim = doc.scrollHeight;

      alvosFim.forEach(function (el) {
        var r = el.getBoundingClientRect();
        // Fracao da faixa cover que o bloco consegue percorrer antes da
        // rolagem acabar: do topo do bloco ate o fim do documento, sobre
        // viewport + altura do bloco, que e o tamanho da faixa cover.
        var alcance = (fim - (r.top + window.scrollY)) / (vp + r.height);
        var nominal = parseFloat(el.dataset.revealEnd) || 42;
        var end = Math.max(MINIMO, Math.min(nominal, alcance * 100 - FOLGA));
        el.style.setProperty("--reveal-end", end.toFixed(1) + "%");
      });
    }

    if (supportsScrollTimeline) {
      // O CSS cuida da animacao. A gente so calibra o fim da faixa.
      root.classList.add("js-scroll");
      calibrarFim();
      window.addEventListener("resize", calibrarFim);
      window.addEventListener("load", calibrarFim);
    } else {
      root.classList.add("js-reveal");

      var targets = document.querySelectorAll("[data-reveal]");

      // Escalona quem esta no mesmo bloco pai, para a entrada ler
      // como sequencia e nao como oito coisas independentes.
      var seen = new WeakMap();
      targets.forEach(function (el) {
        var group = el.parentElement;
        var i = seen.get(group) || 0;
        el.style.transitionDelay = Math.min(i, 3) * 80 + "ms";
        seen.set(group, i + 1);
      });

      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          });
        },
        { rootMargin: "0px 0px -10% 0px", threshold: 0 }
      );

      targets.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---- 3. Chegada do hero --------------------------------- */
  if (!reduced && !location.hash) {
    root.classList.add("js-anim");
  }

  /* ---- 4. Nav colada -------------------------------------- */
  var nav = document.getElementById("nav");
  if (nav && "IntersectionObserver" in window) {
    var sentinel = document.createElement("div");
    sentinel.style.cssText =
      "position:absolute;top:0;height:1px;width:1px;pointer-events:none;";
    document.body.prepend(sentinel);

    new IntersectionObserver(
      function (entries) {
        nav.dataset.stuck = String(!entries[0].isIntersecting);
      },
      { threshold: 0 }
    ).observe(sentinel);
  }

  /* ---- 5. Menu do mobile ---------------------------------- */
  var burger = document.getElementById("nav-toggle");
  var links = document.getElementById("nav-links");

  if (nav && burger && links) {
    function setMenu(open) {
      nav.dataset.menu = open ? "open" : "closed";
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    }

    burger.addEventListener("click", function () {
      setMenu(nav.dataset.menu !== "open");
    });

    links.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.dataset.menu === "open") {
        setMenu(false);
        burger.focus();
      }
    });

    window.matchMedia("(min-width: 681px)").addEventListener("change", function (e) {
      if (e.matches) setMenu(false);
    });

    setMenu(false);
  }

  /* ---- 6. Tema -------------------------------------------- */
  var toggle = document.getElementById("theme-toggle");
  var KEY = "nykaze-theme";
  var systemDark = window.matchMedia("(prefers-color-scheme: dark)");

  var stored = null;
  try { stored = localStorage.getItem(KEY); } catch (e) { /* modo privado */ }

  function resolved() {
    return stored || (systemDark.matches ? "dark" : "light");
  }

  function applyTheme() {
    var theme = resolved();
    root.setAttribute("data-theme", theme);
    if (toggle) {
      var dark = theme === "dark";
      toggle.setAttribute("aria-pressed", String(dark));
      toggle.setAttribute("aria-label", dark ? "Ativar tema claro" : "Ativar tema escuro");
    }
  }

  applyTheme();

  if (toggle) {
    toggle.addEventListener("click", function () {
      stored = resolved() === "dark" ? "light" : "dark";
      try { localStorage.setItem(KEY, stored); } catch (e) { /* ignora */ }
      applyTheme();
    });
  }

  // Segue o sistema enquanto o usuario nao escolher um tema.
  if (systemDark.addEventListener) {
    systemDark.addEventListener("change", function () {
      stored = null;
      try { localStorage.removeItem(KEY); } catch (e) { /* ignora */ }
      applyTheme();
    });
  }
})();