import sharp from "sharp";
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "fs";

/**
 * Swap the counter/pattern page background to a different variant.
 *
 * The CSS loads a single hard-coded file, `/counter-bg-kaaba.webp?v=N`, for
 * both `.counter-bg` and `.pattern-bg`. To preview a variant we therefore:
 *   1. convert the chosen source to webp and write it over that filename, and
 *   2. bump the `?v=N` query so the Android WebView can't serve the previous
 *      image from its HTTP cache under an unchanged URL.
 * The original kaaba file is kept as counter-bg-kaaba.webp.BACKUP.
 */
const src = process.argv[2];
if (!src) {
  console.error("usage: node bg-use.mjs <source-file-in-public>");
  process.exit(1);
}
if (!existsSync(`public/${src}`)) {
  console.error(`not found: public/${src}`);
  process.exit(1);
}

const TARGET = "public/counter-bg-kaaba.webp";
const css = "src/index.css";
const current = readFileSync(css, "utf8");
const m = current.match(/counter-bg-kaaba\.webp\?v=(\d+)/);
const next = (m ? Number(m[1]) : 0) + 1;

await sharp(`public/${src}`)
  .resize({ width: 1440, withoutEnlargement: true })
  .webp({ quality: 88 })
  .toFile(TARGET + ".tmp");
writeFileSync(TARGET, readFileSync(TARGET + ".tmp"));
unlinkSync(TARGET + ".tmp");

// BOTH `.pattern-bg::before` and `.counter-bg::before` reference the file, so
// the flag is required — bumping only the first would leave the counter screen
// pointing at the old cached URL.
writeFileSync(css, current.replace(/counter-bg-kaaba\.webp\?v=\d+/g, `counter-bg-kaaba.webp?v=${next}`));

const bumped = (readFileSync(css, "utf8").match(/counter-bg-kaaba\.webp\?v=\d+/g) || []).length;
console.log(`using ${src}  ->  ${TARGET}  (css ?v=${next} on ${bumped} rules)`);
