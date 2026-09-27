/**
 * Query nodes from a uiautomator XML dump by label.
 *
 * Replaces the sed/awk/paste pipelines that kept mis-reading the dump: a WebView
 * exposes aria-label through `text` (not `content-desc`) for these nodes, and
 * the single-line XML defeats greedy regexes. This parses the XML instead.
 *
 * Usage: node uidump.mjs <dump.xml> <label> [<label> ...]
 * Prints: <label>\t<x1>,<y1>,<x2>,<y2>\t<centreX>,<centreY>
 */
import { readFileSync } from "fs";

const [, , file, ...labels] = process.argv;
const xml = readFileSync(file, "utf8");

const ATTR = /([\w-]+)="([^"]*)"/g;

const nodes = [];
for (const m of xml.matchAll(/<node\b([^>]*)\/?>/g)) {
  const a = {};
  for (const t of m[1].matchAll(ATTR)) a[t[1]] = t[2];
  // WebView puts the accessible name in text or content-desc depending on the
  // element, so accept either.
  const label = a.text || a["content-desc"] || "";
  if (label) nodes.push({ label, bounds: a.bounds, cls: a.class });
}

for (const label of labels) {
  // Exact match first; fall back to substring, because several labels are
  // prefixed with Arabic text ("ٱللَّهُ أَكْبَرُ Allahu Akbar") and passing that
  // through a shell arg is fragile.
  const n = nodes.find((x) => x.label === label) || nodes.find((x) => x.label.includes(label));
  if (!n) {
    console.log(`${label}\tNOT_FOUND`);
    continue;
  }
  const nums = n.bounds.match(/\d+/g).map(Number);
  const [x1, y1, x2, y2] = nums;
  console.log(
    `${label}\t${x1},${y1},${x2},${y2}\t${Math.round((x1 + x2) / 2)},${Math.round((y1 + y2) / 2)}\t${n.cls}`
  );
}
