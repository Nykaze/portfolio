/**
 * Gera os assets locais do portfolio (fonte, sprite de icones, imagens).
 * Rode com: node tools/fetch-assets.mjs
 * E idempotente: so sobrescreve o que faltar.
 */
import { mkdir, writeFile, access } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const exists = (p) => access(p).then(() => true, () => false);

async function save(relPath, url, transform) {
  const dest = join(ROOT, relPath);
  if (await exists(dest)) {
    console.log(`skip   ${relPath}`);
    return;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  let body = Buffer.from(await res.arrayBuffer());
  if (transform) body = Buffer.from(transform(body.toString("utf8")));
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, body);
  console.log(`write  ${relPath} (${(body.length / 1024).toFixed(1)} kB)`);
}

/* 1. Fontes self-hosted (variavel, subset latin) ---------------------------- */
const FONTS = [
  ["assets/fonts/geist-latin-wght-normal.woff2", "https://cdn.jsdelivr.net/npm/@fontsource-variable/geist@latest/files/geist-latin-wght-normal.woff2"],
  ["assets/fonts/geist-mono-latin-wght-normal.woff2", "https://cdn.jsdelivr.net/npm/@fontsource-variable/geist-mono@latest/files/geist-mono-latin-wght-normal.woff2"],
];

/* 2. Sprite de icones (Simple Icons + Devicon) ------------------------------- */
const ICONS = [
  ["javascript", "https://cdn.simpleicons.org/javascript/fff"],
  ["typescript", "https://cdn.simpleicons.org/typescript/fff"],
  ["svelte", "https://cdn.simpleicons.org/svelte/fff"],
  ["nodedotjs", "https://cdn.simpleicons.org/nodedotjs/fff"],
  ["socketdotio", "https://cdn.simpleicons.org/socketdotio/fff"],
  ["python", "https://cdn.simpleicons.org/python/fff"],
  ["react", "https://cdn.simpleicons.org/react/fff"],
  ["docker", "https://cdn.simpleicons.org/docker/fff"],
  ["git", "https://cdn.simpleicons.org/git/fff"],
  ["gradle", "https://cdn.simpleicons.org/gradle/fff"],
  ["openjdk", "https://cdn.simpleicons.org/openjdk/fff"],
  ["linux", "https://cdn.simpleicons.org/linux/fff"],
  ["express", "https://cdn.simpleicons.org/express/fff"],
  ["github", "https://cdn.simpleicons.org/github/fff"],
];

async function buildSprite() {
  const dest = join(ROOT, "assets/icons/sprite.svg");
  if (await exists(dest)) {
    console.log("skip   assets/icons/sprite.svg");
    return;
  }
  const symbols = [];
  for (const [id, url] of ICONS) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`icone ${id}: HTTP ${res.status}`);
    const svg = await res.text();
    const path = svg.match(/<path d="([^"]+)"/s)?.[1];
    if (!path) throw new Error(`icone ${id}: path nao encontrado`);
    symbols.push(`<symbol id="i-${id}" viewBox="0 0 24 24"><path d="${path}"/></symbol>`);
  }

  // LinkedIn saiu do Simple Icons (pedido de marca). Vem do Devicon.
  const li = await fetch(
    "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/linkedin/linkedin-original.svg"
  );
  const liSvg = await li.text();
  const paths = [...liSvg.matchAll(/<path fill="[^"]*" d="([^"]+)"/g)].map((m) => m[1]);
  symbols.push(
    `<symbol id="i-linkedin" viewBox="0 0 128 128">${paths
      .map((d, i) => `<path d="${d}"${i === 0 ? ' fill="currentColor" opacity=".25"' : ""}/>`)
      .join("")}</symbol>`
  );

  await mkdir(dirname(dest), { recursive: true });
  await writeFile(
    dest,
    `<svg xmlns="http://www.w3.org/2000/svg" style="display:none" fill="none">\n${symbols.join("\n")}\n</svg>\n`
  );
  console.log(`write  assets/icons/sprite.svg (${symbols.length} icones)`);
}

/* 3. Imagens --------------------------------------------------------------- */
/* O banner e baixado cru e convertido para jpg em `tools/optimize-img.ps1`. */
const IMAGES = [
  ["assets/img/agritech-banner.png", "https://raw.githubusercontent.com/deonjonker123/AgritechEvolved/refs/heads/26.1.2/ate_ban.png"],
];

async function main() {
  for (const [p, url] of FONTS) await save(p, url);
  await buildSprite();
  for (const [p, url] of IMAGES) await save(p, url);
  console.log("\nassets ok.");
}

main().catch((e) => {
  console.error("falhou:", e.message);
  process.exit(1);
});