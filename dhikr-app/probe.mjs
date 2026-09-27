import { execSync } from "node:child_process";

/**
 * Does adding a text-shadow to .gold-lux change a single pixel?
 *
 * Earlier rounds of this compared *rounded means* of the element box, which is
 * the wrong instrument twice over: Math.round hides small changes, and a
 * detector keyed on "reddish" matches the warm photo and reports 139k false
 * positives on an unmodified frame. This does the obvious thing instead —
 * snapshot the same crop twice, with and without the shadow, and count the
 * pixels that actually differ.
 *
 * Usage: node probe.mjs "<css without shadow>" "<css with shadow>" ["<label>"]
 */
const sh = (c) => execSync(c, { encoding: "utf8", env: { ...process.env, MSYS_NO_PATHCONV: "1" } });

const list = await (await fetch("http://localhost:9222/json")).json();
const page = list.find((t) => t.type === "page" && t.url.startsWith("https://localhost/"));
if (!page) { console.error("app page not found"); process.exit(1); }
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pend = new Map();
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); }
});
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
const ev = async (expr) => {
  const i = ++id;
  const p = new Promise((r) => pend.set(i, r));
  ws.send(JSON.stringify({ id: i, method: "Runtime.evaluate", params: { expression: expr, returnByValue: true } }));
  return (await p)?.result?.value;
};

const setCss = (css) =>
  ev(`(()=>{const st=document.createElement('style');st.id='pp';document.getElementById('pp')?.remove();st.textContent=${JSON.stringify(css)};document.head.appendChild(st);return 1;})()`);

const capture = async (out) => {
  sh("adb -s emulator-5554 shell screencap -p /sdcard/pp.png");
  sh(`adb -s emulator-5554 pull /sdcard/pp.png ./${out}`);
  const { default: sharp } = await import("sharp");
  return sharp(`./${out}`).removeAlpha().raw().toBuffer();
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const [base, variant, label] = process.argv.slice(2);

await setCss(base);
await sleep(800);
const A = await capture("ppA.png");

await setCss(variant);
await sleep(800);
const B = await capture("ppB.png");

let differing = 0, maxDelta = 0, sumDelta = 0;
const n = Math.min(A.length, B.length);
for (let i = 0; i < n; i++) {
  const d = Math.abs(A[i] - B[i]);
  if (d > 0) { differing++; sumDelta += d; if (d > maxDelta) maxDelta = d; }
}
console.log(`  ${label || "variant"}: ${differing} of ${n} subpixels differ, max delta ${maxDelta}, mean delta ${(sumDelta / n).toFixed(4)}`);
console.log(`  verdict: ${differing === 0 ? "IDENTICAL - the shadow does not paint" : "changed - the shadow paints"}`);

await setCss("");
ws.close();
