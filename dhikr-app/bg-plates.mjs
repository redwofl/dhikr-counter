import sharp from "sharp";
import { execSync } from "child_process";
import {
  copyFileSync, existsSync, readFileSync, writeFileSync, mkdirSync, rmSync,
} from "fs";
import { createHash } from "crypto";

/**
 * True wallpaper plates + exact text-contrast audit, via the WebView CDP.
 *
 * Why this exists: measuring contrast from screenshots alone is unreliable.
 * uiautomator bounds are the text element's LAYOUT box, not the glyphs, and
 * they go stale as the layout shifts; background texture also masquerades as
 * text. So instead of guessing which pixels are text, we remove the text:
 *
 *   1. capture the normal frame                       (UI visible)
 *   2. via CDP hide every element except the ancestor chain of .counter-bg,
 *      which leaves the ::before background painting but drops all content
 *   3. capture again                                  (true wallpaper plate)
 *   4. full - plate is then EXACTLY the content layer, so glyph pixels and
 *      background pixels are both measured for real, with no heuristic
 *
 * Element rects come from CDP at capture time, so they cannot go stale.
 */

const DEV = "emulator-5554";
const PKG = "app.dhikr.counter";
const PORT = 9222;
const BASH = "E:/Git/bin/bash.exe";
const TARGET = "public/counter-bg-kaaba.webp";
const APK_ASSET = "android/app/src/main/assets/public/counter-bg-kaaba.webp";

const VARIANTS = [
  ["01-original-photo", "public/counter-bg.jpg", "counter-bg.jpg"],
  ["02-full", "public/counter-bg-full.png", "counter-bg-full.png"],
  ["03-solid", "public/counter-bg-solid.png", "counter-bg-solid.png"],
  ["04-atmospheric", "public/counter-bg-atmospheric.png", "counter-bg-atmospheric.png"],
  ["05-cinema", "public/counter-bg-cinema.png", "counter-bg-cinema.png"],
  ["06-artwork", "public/counter-bg-artwork.png", "counter-bg-artwork.png"],
  ["07-editorial", "public/counter-bg-editorial.png", "counter-bg-editorial.png"],
  ["08-calligraphy", "public/counter-bg-calligraphy.png", "counter-bg-calligraphy.png"],
  ["09-custom-png", "public/counter-bg-custom.png", "counter-bg-custom.png"],
  ["10-custom-webp", "public/counter-bg-custom.webp", "counter-bg-custom.webp"],
  ["11-kaaba-original", "public/counter-bg-kaaba.webp.BACKUP", "counter-bg-kaaba.webp"],
];

// the text elements we audit, matched by their visible copy
const TARGET_TEXT = {
  TemplateName: "Tasbih, Tahmid, Takbir",
  SubhanAllah: "Subhan Allah",
  Alhamdulillah: "Alhamdulillah",
  SetMaxCount: "Set Max Count",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sh = (cmd) =>
  execSync(cmd, {
    stdio: ["ignore", "pipe", "pipe"],
    shell: BASH,
    env: { ...process.env, MSYS_NO_PATHCONV: "1" },
  }).toString();
const shTry = (cmd) => { try { return sh(cmd).trim(); } catch { return ""; } };
const pid = () => shTry(`adb -s ${DEV} shell pidof ${PKG}`);
const screencap = (out) => sh(`adb -s ${DEV} exec-out screencap -p > "${out}"`);

let v = 100;

/* ----------------------------- CDP ----------------------------- */
class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && this.pending.has(m.id)) {
        this.pending.get(m.id)(m);
        this.pending.delete(m.id);
      }
    };
  }
  static async attach() {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    const page = list.find((t) => t.type === "page");
    if (!page) throw new Error("no page target");
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((res, rej) => {
      ws.onopen = res;
      ws.onerror = () => rej(new Error("ws failed"));
    });
    return new CDP(ws);
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((res) => {
      this.pending.set(id, res);
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evalJs(expr) {
    const r = await this.send("Runtime.evaluate", {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    if (r.result?.exceptionDetails) throw new Error("js: " + r.result.exceptionDetails.text);
    return r.result?.result?.value;
  }
  close() { try { this.ws.close(); } catch {} }
}

/* -------------------------- deploy --------------------------- */
function deviceAssetHash() {
  const apkPath = shTry(`adb -s ${DEV} shell pm path ${PKG}`)
    .split(/\r?\n/).find((l) => l.startsWith("package:"))?.slice(8);
  if (!apkPath) throw new Error("cannot locate installed apk");
  sh(`adb -s ${DEV} pull "${apkPath}" ./_installed.apk`);
  rmSync("_apkx", { recursive: true, force: true });
  mkdirSync("_apkx", { recursive: true });
  sh(`cd _apkx && unzip -o -q ../_installed.apk "assets/public/counter-bg-kaaba.webp"`);
  return createHash("md5")
    .update(readFileSync("_apkx/assets/public/counter-bg-kaaba.webp")).digest("hex");
}

async function deploy(webp) {
  copyFileSync(webp, TARGET);
  const css = readFileSync("src/index.css", "utf8");
  writeFileSync("src/index.css",
    css.replace(/counter-bg-kaaba\.webp\?v=\d+/g, `counter-bg-kaaba.webp?v=${v}`));
  sh("npm run build");
  sh("npx cap copy android");
  // --rerun-tasks: otherwise Gradle can skip repackaging and reinstall the old apk
  sh(`cd android && ./gradlew installDebug --rerun-tasks -q`);
  const want = createHash("md5").update(readFileSync(TARGET)).digest("hex");
  if (deviceAssetHash() !== want) throw new Error("device apk has old image");

  sh(`adb -s ${DEV} shell am force-stop ${PKG}`);
  for (let i = 0; i < 12 && pid(); i++) await sleep(400);
  shTry(`adb -s ${DEV} shell "run-as ${PKG} rm -rf 'app_webview/Default/Service Worker'"`);
  shTry(`adb -s ${DEV} shell "run-as ${PKG} rm -rf app_webview/Default/Cache cache"`);
  sh(`adb -s ${DEV} shell monkey -p ${PKG} -c android.intent.category.LAUNCHER 1`);
  for (let i = 0; i < 25 && !pid(); i++) await sleep(400);
  if (!pid()) throw new Error("app did not start");

  for (let i = 0; i < 16; i++) {
    await sleep(3000);
    shTry(`adb -s ${DEV} shell uiautomator dump`);
    if (/Tap to count/.test(shTry(`adb -s ${DEV} shell cat /sdcard/window_dump.xml`))) break;
    if (i === 15) throw new Error("never rendered");
  }
  await sleep(2500);

  // re-point the debugger at the new process
  shTry(`adb -s ${DEV} forward --remove tcp:${PORT}`);
  sh(`adb -s ${DEV} forward tcp:${PORT} localabstract:webview_devtools_remote_${pid()}`);
}

/* ------------------------ measurement ------------------------- */
const lum = (r, g, b) => {
  const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
const med = (a) => { const s = Float64Array.from(a).sort(); return s[s.length >> 1]; };

/** Exact contrast: text pixels from (full - plate), background from the plate. */
async function audit(fullPath, platePath, rects, scale) {
  const full = await sharp(fullPath).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const plate = await sharp(platePath).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, channels: C } = full.info;
  const out = {};
  for (const [key, r] of Object.entries(rects)) {
    const x1 = Math.max(0, Math.round(r.x * scale)), y1 = Math.max(0, Math.round(r.y * scale));
    const x2 = Math.min(W, Math.round((r.x + r.w) * scale));
    const y2 = Math.min(full.info.height, Math.round((r.y + r.h) * scale));
    if (x2 - x1 < 4 || y2 - y1 < 4) { out[key] = null; continue; }
    const stroke = [], bg = [];
    for (let y = y1; y < y2; y++) {
      for (let x = x1; x < x2; x++) {
        const i = y * W + x;
        bg.push(lum(plate[i * C], plate[i * C + 1], plate[i * C + 2]));
        const d =
          0.2126 * (full.data[i * C] - plate[i * C]) +
          0.7152 * (full.data[i * C + 1] - plate[i * C + 1]) +
          0.0722 * (full.data[i * C + 2] - plate[i * C + 2]);
        if (Math.abs(d) > 20) {
          stroke.push(lum(full.data[i * C], full.data[i * C + 1], full.data[i * C + 2]));
        }
      }
    }
    if (stroke.length < 30) { out[key] = { n: stroke.length, unusable: true }; continue; }
    const t = med(stroke), b = med(bg);
    out[key] = { n: stroke.length, bg: b, text: t, ratio: ratio(b, t) };
  }
  return out;
}

/* --------------------------- driver --------------------------- */
const only = process.argv[2];
mkdirSync("../bg_plates", { recursive: true });

const HIDE_JS = `(() => {
  const bg = document.querySelector('.counter-bg') || document.body;
  const keep = new Set();
  for (let e = bg; e; e = e.parentElement) keep.add(e);
  let hidden = 0;
  document.querySelectorAll('*').forEach(el => {
    if (!keep.has(el)) { el.style.visibility = 'hidden'; hidden++; }
  });
  return hidden;
})()`;

const RECTS_JS = `(() => {
  const want = ${JSON.stringify(Object.values(TARGET_TEXT))};
  const out = {};
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walk.nextNode())) {
    const t = (n.textContent || '').trim();
    if (!t) continue;
    for (const key of ${JSON.stringify(TARGET_TEXT)}) {
      const needle = ${JSON.stringify(TARGET_TEXT)}[key];
      if (t.includes(needle) && !out[key]) {
        const el = n.parentElement;
        const r = el.getBoundingClientRect();
        out[key] = { x: r.x, y: r.y, w: r.width, h: r.height };
      }
    }
  }
  out.__viewport = { w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio };
  return out;
})()`;

const report = [];
for (const [slug, src, label] of VARIANTS) {
  if (only && !slug.startsWith(only)) continue;
  const webp = `bg_assets/${slug}.webp`;
  if (!existsSync(webp)) {
    const m = await sharp(src).metadata();
    if (m.format === "webp") copyFileSync(src, webp);
    else await sharp(src).webp({ quality: 90 }).toFile(webp);
  }

  const full = `../bg_plates/${slug}_app.png`;
  const plate = `../bg_plates/${slug}_wallpaper.png`;
  try {
    await deploy(webp);
    const cdp = await CDP.attach();
    const info = await cdp.evalJs(RECTS_JS);
    const scale = 1080 / (info.__viewport?.w || 1080);
    const rects = {};
    for (const k of Object.keys(TARGET_TEXT)) rects[k] = info[k];

    screencap(full);
    await cdp.evalJs(HIDE_JS);
    await sleep(1200);
    screencap(plate);
    await cdp.evalJs(`(() => { document.querySelectorAll('*').forEach(e => e.style.visibility=''); return 1; })()`);
    cdp.close();

    const res = await audit(full, plate, rects, scale);
    report.push({ label, slug, res });
    const fmt = (k) => {
      const r = res[k];
      if (!r) return "n/a";
      if (r.unusable) return `no-text(${r.n})`;
      const v = r.ratio >= 4.5 ? "AA" : r.ratio >= 3 ? "lg" : "FAIL";
      return `${r.ratio.toFixed(1)}:${v}`;
    };
    console.log(
      `${label.padEnd(26)} tpl=${fmt("TemplateName").padEnd(9)} w90=${fmt("SubhanAllah").padEnd(9)} ` +
      `w50=${fmt("Alhamdulillah").padEnd(9)} max=${fmt("SetMaxCount")}`
    );
  } catch (e) {
    console.log(`${label.padEnd(26)} ERROR ${e.message}`);
    report.push({ label, slug, error: e.message });
  }
  v++;
}
writeFileSync("bg_plates_report.json", JSON.stringify(report, null, 2));
console.log("\nplates in ../bg_plates/  ( *_wallpaper.png = UI hidden)");
