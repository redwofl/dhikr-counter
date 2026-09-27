/**
 * Pick a text-shadow for the gold Arabic lettering, by measurement.
 *
 * The alternative to guessing is a rebuild per attempt, so instead this injects
 * candidate shadows straight onto the page over CDP, screenshots each one, and
 * hands the capture to contrast2.mjs (the single source of truth for the
 * measurement — it is shelled out to, not reimplemented here).
 *
 * The shadow does not brighten the gold, it darkens the pixels immediately
 * around the glyphs. That is what "reads more clearly" actually means, so the
 * number to watch is the *background* term: median-filtering the plate erases
 * the strokes but keeps the shadow, so a heavier shadow shows up as a lower
 * background luminance and therefore a higher ratio.
 *
 * Usage: node tune-shadow.mjs <label,x1,y1,x2,y2> [...]
 *
 * Each region is a contrast2.mjs spec, i.e. label first — contrast2 splits on
 * commas, so "173,474,908,700" alone leaves y2 undefined and NaNs the crop.
 */
import { execSync } from "node:child_process";

const PORT = 9222;
const TARGET = "https://localhost/";

// --- candidates -------------------------------------------------------------
// Ordered from "barely there" to "clearly lifted". The last is deliberately at
// the edge of what still looks restrained; the point of measuring is to see
// where the returns flatten out.
const CANDIDATES = [
  ["none (current)", "none"],
  ["tight only 0 1px 2px .35", "0 1px 2px rgba(0,0,0,0.35)"],
  ["tight only 0 1px 2px .50", "0 1px 2px rgba(0,0,0,0.5)"],
  ["tight+soft .50/.35", "0 1px 2px rgba(0,0,0,0.5), 0 2px 12px rgba(0,0,0,0.35)"],
  ["tight+soft .60/.45", "0 1px 2px rgba(0,0,0,0.6), 0 2px 12px rgba(0,0,0,0.45)"],
  [
    "tight+soft+wide .60/.40/18px",
    "0 1px 2px rgba(0,0,0,0.6), 0 2px 10px rgba(0,0,0,0.4), 0 6px 18px rgba(0,0,0,0.3)",
  ],
];

const sh = (cmd) =>
  execSync(cmd, { encoding: "utf8", env: { ...process.env, MSYS_NO_PATHCONV: "1" } });

// --- CDP plumbing -----------------------------------------------------------
const list = await (await fetch(`http://localhost:${PORT}/json`)).json();
const page = list.find((t) => t.type === "page" && t.url.startsWith(TARGET));
if (!page) {
  console.error("app page not found; targets:", list.map((t) => t.url));
  process.exit(1);
}

const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
ws.addEventListener("message", (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { res, rej } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result);
  }
});
await new Promise((r) => ws.addEventListener("open", r, { once: true }));

const evalValue = async (expression) => {
  const msgId = ++id;
  const p = new Promise((res, rej) => pending.set(msgId, { res, rej }));
  ws.send(JSON.stringify({ id: msgId, method: "Runtime.evaluate", params: { expression, returnByValue: true } }));
  return (await p)?.result?.value;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const specs = process.argv.slice(2);
if (!specs.length) {
  console.error("usage: node tune-shadow.mjs <label,x1,y1,x2,y2> [...]");
  process.exit(1);
}

console.log(`measuring ${specs.length} region(s) of the gold lettering\n`);

for (const [name, shadow] of CANDIDATES) {
  await evalValue(
    `(()=>{const s=document.createElement('style');s.id='tune-shadow';` +
      `document.getElementById('tune-shadow')?.remove();` +
      `s.textContent=${JSON.stringify(`.gold-lux{text-shadow:${shadow} !important}`)};` +
      `document.head.appendChild(s);return 1;})()`
  );
  await sleep(700);

  sh("adb -s emulator-5554 shell screencap -p /sdcard/tune.png");
  sh("adb -s emulator-5554 pull /sdcard/tune.png ./tune.png");

  // Passed bare: contrast-halo.mjs splits each spec on commas, so wrapping it in
  // quotes would leave `"173` as the first field and NaN out the crop.
  const out = sh(`node contrast-halo.mjs ./tune.png ${specs.join(" ")}`);
  const ratios = [...out.matchAll(/edge=([\d.]+):1/g)].map((m) => m[1]);
  const halos = [...out.matchAll(/haloP10=([\d.]+)/g)].map((m) => m[1]);
  console.log(
    `  ${name.padEnd(30)} edge contrast ${ratios.map((r, i) => `${r}:1 (haloP10 ${halos[i]})`).join("   ")}`
  );
}

await evalValue("document.getElementById('tune-shadow')?.remove(), 1");
ws.close();
