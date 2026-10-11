/* =========================================================
   Gabriel Nykaze · portfolio
   Sem dependencias. Sem build.
   - revela blocos no scroll (IntersectionObserver)
   - marca a nav como colada quando o topo sai da tela
   - alterna o tema e lembra da escolha
   ========================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- 1. Revelar blocos ------------------------------------ */
  var revealables = document.querySelectorAll(
    ".section__title, .bento > *, .manifesto > *, .pillar, .stack-group, .timeline__item, .contact__links > *"
  );

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealables.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    revealables.forEach(function (el, i) {
      el.setAttribute("data-reveal", "");
      // Escalona dentro do mesmo bloco para a entrada ler como sequência.
      el.style.transitionDelay = Math.min(i % 3, 2) * 70 + "ms";
    });

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );

    revealables.forEach(function (el) { io.observe(el); });
  }

  /* ---- 2. Nav colada ---------------------------------------- */
  var nav = document.getElementById("nav");
  if (nav && "IntersectionObserver" in window) {
    var sentinel = document.createElement("div");
    sentinel.style.cssText = "position:absolute;top:0;height:1px;width:1px;pointer-events:none;";
    document.body.prepend(sentinel);

    new IntersectionObserver(
      function (entries) {
        nav.dataset.stuck = String(!entries[0].isIntersecting);
      },
      { threshold: 0 }
    ).observe(sentinel);
  }

  /* ---- 3. Tema ---------------------------------------------- */
  var toggle = document.getElementById("theme-toggle");
  var root = document.documentElement;
  var KEY = "nykaze-theme";

  var prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
  var stored = null;
  try { stored = localStorage.getItem(KEY); } catch (e) { /* modo privado */ }

  function resolved() {
    return stored || (prefersDark.matches ? "dark" : "light");
  }

  function apply() {
    var theme = resolved();
    root.setAttribute("data-theme", theme);
    if (toggle) {
      toggle.setAttribute("aria-pressed", String(theme === "dark"));
      toggle.setAttribute("aria-label",
        theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro");
    }
  }

  apply();

  if (toggle) {
    toggle.addEventListener("click", function () {
      stored = resolved() === "dark" ? "light" : "dark";
      try { localStorage.setItem(KEY, stored); } catch (e) { /* ignora */ }
      apply();
    });
  }

  // Segue o sistema enquanto o usuario nao escolher um tema.
  if (prefersDark.addEventListener) {
    prefersDark.addEventListener("change", function () {
      stored = null;
      try { localStorage.removeItem(KEY); } catch (e) { /* ignora */ }
      apply();
    });
  }
})();