/**
 * Embute o sprite de icones dentro do index.html.
 * Assim o site funciona em file:// sem depender de fetch do sprite.
 * Rode com: node tools/inline-icons.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const sprite = readFileSync("assets/icons/sprite.svg", "utf8")
  .replace(/^<svg[^>]*>\s*/, "")
  .replace(/\s*<\/svg>\s*$/, "")
  .trim()
  .split("\n")
  .map((line) => "  " + line.trim())
  .join("\n");

let html = readFileSync("index.html", "utf8");

if (!html.includes("<!--ICONS-->")) {
  console.log("marcador ja substituido, nada a fazer.");
} else {
  html = html.replace("<!--ICONS-->", sprite);
  // fill="none" no sprite apagaria os <path> que so trazem `d`.
  html = html.replace(
    '<svg xmlns="http://www.w3.org/2000/svg" style="display:none" fill="none" aria-hidden="true">',
    '<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">'
  );
  writeFileSync("index.html", html);
  console.log("ok, index.html:", Math.round(Buffer.byteLength(html) / 1024), "kB");
}