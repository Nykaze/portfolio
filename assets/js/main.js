/* =========================================================
   Gabriel Nykaze · portfolio
   Sem dependencias. Sem build.
   - uma unica animacao autoral: a chegada do hero
   - menu do mobile
   - marca a nav como colada quando o topo sai da tela
   - alterna o tema e lembra da escolha
   ========================================================= */
(function () {
  "use strict";

  var root = document.documentElement;
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- 1. Um momento autoral no hero ---------------------- */
  /* A classe so entra se o usuario nao pediu movimento reduzido,
     entao o padrao do documento continua sendo visivel e estatico. */
  if (!prefersReduced && !location.hash) {
    root.classList.add("js-anim");
  }

  /* ---- 2. Nav colada --------------------------------------- */
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

  /* ---- 3. Menu do mobile ----------------------------------- */
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

    // Fecha ao escolher um destino.
    links.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.dataset.menu === "open") {
        setMenu(false);
        burger.focus();
      }
    });

    // Fecha se a tela crescer e voltar a caber a barra inteira.
    window.matchMedia("(min-width: 681px)").addEventListener("change", function (e) {
      if (e.matches) setMenu(false);
    });

    setMenu(false);
  }

  /* ---- 4. Tema --------------------------------------------- */
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