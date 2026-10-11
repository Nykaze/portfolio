// Confere o contraste real de cada par texto/fundo nos dois temas.
const hex = (h) => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const lin = (c) => {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};
const lum = (rgb) => 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
const ratio = (a, b) => {
  const [l1, l2] = [lum(hex(a)), lum(hex(b))].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

const THEMES = {
  light: { bg: "#f7f8f8", surface: "#ffffff", surface2: "#eef1f0", text: "#0e1211", muted: "#4c5855", accent: "#0a7a52", ink: "#ffffff" },
  dark:  { bg: "#0b0d0e", surface: "#121617", surface2: "#171c1d", text: "#e6ecea", muted: "#98a6a3", accent: "#4ade80", ink: "#06251a" },
};

const PAIRS = [
  ["corpo",       "text",   "bg"],
  ["corpo",       "text",   "surface"],
  ["secundario",  "muted",  "bg"],
  ["secundario",  "muted",  "surface"],
  ["secundario",  "muted",  "surface2"],
  ["acento",      "accent", "bg"],
  ["acento",      "accent", "surface"],
  ["acento",      "accent", "surface2"],
  ["botao",       "ink",    "accent"],
  ["destaque",    "text",   "surface2"],
];

let fails = 0;
for (const [theme, t] of Object.entries(THEMES)) {
  console.log("\n=== " + theme + " ===");
  for (const [label, fg, bg] of PAIRS) {
    const r = ratio(t[fg], t[bg]);
    const ok = r >= 4.5;
    if (!ok) fails++;
    console.log(
      (ok ? "OK   " : "BAIXO") + " " + label.padEnd(12) +
      t[fg] + " sobre " + t[bg] + "  " + r.toFixed(2) + ":1"
    );
  }
}
console.log("\nfalhas: " + fails);