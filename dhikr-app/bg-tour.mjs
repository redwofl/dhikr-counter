import sharp from "sharp";
import { execSync } from "child_process";
import { copyFileSync, mkdirSync, existsSync, readFileSync, writeFileSync } from "fs";

/**
 * Self-verifying background tour.
 *
 * The previous gallery silently failed: 4 of 10 previews were byte-identical
 * and 3 were blank, because a swap was never confirmed to have landed. Every
 * step here is therefore verified before moving on:
 *   1. the asset inside android/ matches what we asked for (cap copy worked)
 *   2. the ?v cache-bust landed in BOTH css rules
 *   3. the app really re-rendered (uiautomator shows the counter, not a stub)
 *   4. the capture is not a blank/partial frame (pixel stdev)
 *   5. the capture is not a duplicate of any earlier one (pairwise NCC)
 * A failing step is retried once, then reported as BAD rather than passed off.
 */

const DEV = "emulator-5554";
const PKG = "app.dhikr.counter";
const ASSETS = "bg_assets";
const TARGET = "public/counter-bg-kaaba.webp";
const DEPLOYED_IN_APK = "android/app/src/main/assets/public/counter-bg-kaaba.webp";
mkdirSync(ASSETS, { recursive: true });

// chronological, oldest first (derived from public/ mtimes)
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Git Bash needs MSYS_NO_PATHCONV or it rewrites /sdcard/... into a Windows path.
// The default (cmd) shell cannot run the `;`-chained adb calls at all.
const BASH = "E:/Git/bin/bash.exe";
const sh = (cmd) =>
  execSync(cmd, {
    stdio: ["ignore", "pipe", "pipe"],
    shell: BASH,
    env: { ...process.env, MSYS_NO_PATHCONV: "1" },
  }).toString();
const adb = (args) => sh(`adb -s ${DEV} ${args}`);
const screencap = (out) => sh(`adb -s ${DEV} exec-out screencap -p > "${out}"`);

let v = 30;

function ncc(a, b) {
  const n = a.length;
  let sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0;
  for (let i = 0; i < n; i++) {
    sa += a[i]; sb += b[i]; saa += a[i] * a[i]; sbb += b[i] * b[i]; sab += a[i] * b[i];
  }
  const cov = sab / n - (sa / n) * (sb / n);
  const va = saa / n - (sa / n) ** 2;
  const vb = sbb / n - (sb / n) ** 2;
  return va > 1e-9 && vb > 1e-9 ? cov / Math.sqrt(va * vb) : 0;
}
const sig = (f) => sharp(f).resize(64, 144, { fit: "fill" }).greyscale().raw().toBuffer();

async function pxStats(f) {
  const st = await sharp(f).stats();
  return {
    mean: st.channels.slice(0, 3).map((c) => Math.round(c.mean)).join(","),
    sd: (st.channels[0].stdev + st.channels[1].stdev + st.channels[2].stdev) / 3,
  };
}

async function toWebp(src, out) {
  // keep native webp bytes untouched so an original is never re-encoded.
  // NB: test the format, not the extension - the kaaba original is
  // "counter-bg-kaaba.webp.BACKUP", which ends in .BACKUP and was therefore
  // needlessly re-encoded once, costing fidelity for no reason.
  const m = await sharp(src).metadata();
  if (m.format === "webp") copyFileSync(src, out);
  else await sharp(src).webp({ quality: 90 }).toFile(out);
}

function bumpCss() {
  const css = readFileSync("src/index.css", "utf8");
  const out = css.replace(/counter-bg-kaaba\.webp\?v=\d+/g, `counter-bg-kaaba.webp?v=${v}`);
  writeFileSync("src/index.css", out);
  const n = (out.match(new RegExp(`counter-bg-kaaba\\.webp\\?v=${v}`, "g")) || []).length;
  if (n !== 2) throw new Error(`?v=${v} appears ${n}x, expected 2`);
}

async function deploy() {
  sh("npm run build");
  sh("npx cap copy android");
  if (!existsSync(DEPLOYED_IN_APK)) throw new Error("asset missing from android/");
  if (readFileSync(DEPLOYED_IN_APK).length !== readFileSync(TARGET).length)
    throw new Error("asset in android/ differs in size from target");

  sh(`cd android && ./gradlew installDebug -q`);
  sh(`adb -s ${DEV} shell am force-stop ${PKG}`);
  sh(`adb -s ${DEV} shell monkey -p ${PKG} -c android.intent.category.LAUNCHER 1`);

  let rendered = false;
  for (let i = 0; i < 16; i++) {
    await sleep(3000);
    try {
      adb("shell uiautomator dump");
      if (/Tap to count/.test(adb("shell cat /sdcard/window_dump.xml"))) {
        rendered = true;
        break;
      }
    } catch {}
  }
  if (!rendered) throw new Error("counter never rendered");
  await sleep(3000); // let the background image actually paint
}

const results = [];
const seen = [];

for (const [slug, src, label] of VARIANTS) {
  const webp = `${ASSETS}/${slug}.webp`;
  await toWebp(src, webp);
  const shot = `../bg_tour_${slug.split("-")[0]}.png`;

  copyFileSync(webp, TARGET);
  let status = "OK";
  let note = "";
  let st = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      bumpCss();
      await deploy();
      screencap(shot);
      st = await pxStats(shot);
      if (st.sd < 8) throw new Error(`blank/partial frame (stdev ${st.sd.toFixed(1)})`);
      const s = await sig(shot);
      const dup = seen.find((p) => ncc(s, p.sig) > 0.995);
      if (dup) throw new Error(`duplicate frame of ${dup.label} - swap did not land`);
      seen.push({ label, sig: s });
      break;
    } catch (e) {
      status = "BAD";
      note = e.message;
      v++;
      if (attempt === 2) break;
      await sleep(4000);
    }
  }

  console.log(
    status === "OK"
      ? `${label.padEnd(26)} mean=${st.mean.padEnd(14)} stdev=${st.sd.toFixed(1).padEnd(5)} OK`
      : `${label.padEnd(26)} FAILED: ${note}`
  );
  results.push({ label, status, note, mean: st?.mean, stdev: st?.sd, shot });
  v++;
}

console.log("\n--- summary ---");
for (const r of results)
  console.log(`${r.status.padEnd(4)} ${r.label.padEnd(26)} ${r.shot}${r.note ? "  <- " + r.note : ""}`);
const bad = results.filter((r) => r.status !== "OK");
console.log(`\n${results.length - bad.length}/${results.length} verified OK`);
writeFileSync("bg_tour_results.json", JSON.stringify(results, null, 2));
