import sharp from "sharp";
import { execSync } from "child_process";
import { copyFileSync, existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from "fs";
import { createHash } from "crypto";

/**
 * Apply a background variant and PROVE it is on screen before returning.
 *
 * The tour lost variant 10 to a stale app instance: `am force-stop` returns
 * immediately, so the relaunch + uiautomator poll ("Tap to count") can be
 * satisfied by the *previous* process still showing the *previous* background.
 * That is what silently produced the duplicate frames in the old gallery.
 *
 * Fixes, in order of directness:
 *   - wait for the process to actually disappear (pidof), not just for force-stop
 *   - confirm a NEW pid appears after launch
 *   - clear the WebView HTTP cache so a stale ?v= response can never be reused
 *     (only the cache dirs - localStorage is left alone so dhikr progress survives)
 *   - compare the capture against every known reference shot and retry on a match
 */
const [webpPath, outShot, mustDifferFromArg] = process.argv.slice(2);
if (!webpPath || !outShot) {
  console.error("usage: node bg-apply.mjs <webp> <outShot> [refShot ...]");
  process.exit(1);
}
const REFS = mustDifferFromArg ? mustDifferFromArg.split(",") : [];

const DEV = "emulator-5554";
const PKG = "app.dhikr.counter";
const TARGET = "public/counter-bg-kaaba.webp";
const APK_ASSET = "android/app/src/main/assets/public/counter-bg-kaaba.webp";
const BASH = "E:/Git/bin/bash.exe";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sh = (cmd) =>
  execSync(cmd, {
    stdio: ["ignore", "pipe", "pipe"],
    shell: BASH,
    env: { ...process.env, MSYS_NO_PATHCONV: "1" },
  }).toString();
const shTry = (cmd) => {
  try {
    return sh(cmd).trim();
  } catch {
    return "";
  }
};
const pid = () => shTry(`adb -s ${DEV} shell pidof ${PKG}`);

/**
 * Hash the background asset as it exists INSIDE the installed APK on the device.
 *
 * This is the check that was missing and caused every silent failure: Gradle's
 * up-to-date check happily skipped repackaging when only a public/ asset
 * changed, so `installDebug` reinstalled the PREVIOUS apk and the old image
 * stayed on screen. Verifying the on-disk file under android/ proves nothing --
 * the device is what renders. Hence: pull base.apk and hash what is really there.
 */
function deviceAssetHash() {
  const apkPath = shTry(`adb -s ${DEV} shell pm path ${PKG}`)
    .split(/\r?\n/)
    .find((l) => l.startsWith("package:"))
    ?.slice("package:".length);
  if (!apkPath) throw new Error("could not locate installed apk");
  sh(`adb -s ${DEV} pull "${apkPath}" ./_installed.apk`);
  rmSync("_apkx", { recursive: true, force: true });
  mkdirSync("_apkx", { recursive: true });
  sh(`cd _apkx && unzip -o -q ../_installed.apk "assets/public/counter-bg-kaaba.webp"`);
  return createHash("md5")
    .update(readFileSync("_apkx/assets/public/counter-bg-kaaba.webp"))
    .digest("hex");
}

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

let v = 60;
const refSigs = [];
for (const r of REFS) if (existsSync(r)) refSigs.push({ name: r, s: await sig(r) });

copyFileSync(webpPath, TARGET);

for (let attempt = 1; attempt <= 4; attempt++) {
  const css = readFileSync("src/index.css", "utf8");
  const out = css.replace(/counter-bg-kaaba\.webp\?v=\d+/g, `counter-bg-kaaba.webp?v=${v}`);
  writeFileSync("src/index.css", out);
  const hits = (out.match(new RegExp(`counter-bg-kaaba\\.webp\\?v=${v}`, "g")) || []).length;
  if (hits !== 2) throw new Error(`?v=${v} appears ${hits}x, expected 2`);

  sh("npm run build");
  sh("npx cap copy android");
  if (!existsSync(APK_ASSET)) throw new Error("asset missing from android/");
  if (readFileSync(APK_ASSET).length !== readFileSync(TARGET).length)
    throw new Error("android/ asset size mismatch");

  // --rerun-tasks is REQUIRED: without it Gradle's up-to-date check can skip
  // repackaging when only a public/ asset changed, and we reinstall the OLD apk.
  sh(`cd android && ./gradlew installDebug --rerun-tasks -q`);

  const want = createHash("md5").update(readFileSync(TARGET)).digest("hex");
  const got = deviceAssetHash();
  if (got !== want)
    throw new Error(`device apk still has old image (${got.slice(0, 8)} != ${want.slice(0, 8)})`);

  // --- kill and WAIT for the process to be gone ---
  const oldPid = pid();
  sh(`adb -s ${DEV} shell am force-stop ${PKG}`);
  let dead = false;
  for (let i = 0; i < 10; i++) {
    if (!pid()) { dead = true; break; }
    await sleep(500);
  }
  if (!dead) throw new Error(`process ${oldPid} survived force-stop`);

  // Quote the whole remote command so the DEVICE shell parses it. `run-as`
  // execs directly with no shell, so it expands neither globs nor quotes --
  // "Service Worker" has a space and silently became two bogus arguments.
  // Only the HTTP cache is dropped; Local Storage keeps the dhikr progress.
  shTry(`adb -s ${DEV} shell "run-as ${PKG} rm -rf 'app_webview/Default/Service Worker'"`);
  shTry(`adb -s ${DEV} shell "run-as ${PKG} rm -rf app_webview/Default/Cache app_webview/Default/code_cache cache"`);

  sh(`adb -s ${DEV} shell monkey -p ${PKG} -c android.intent.category.LAUNCHER 1`);

  let newPid = "";
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    newPid = pid();
    if (newPid) break;
  }
  if (!newPid) throw new Error("app did not restart");

  let rendered = false;
  for (let i = 0; i < 16; i++) {
    await sleep(3000);
    shTry(`adb -s ${DEV} shell uiautomator dump`);
    if (/Tap to count/.test(shTry(`adb -s ${DEV} shell cat /sdcard/window_dump.xml`))) {
      rendered = true;
      break;
    }
  }
  if (!rendered) throw new Error("counter never rendered");
  await sleep(3500);

  sh(`adb -s ${DEV} exec-out screencap -p > "${outShot}"`);

  const st = await sharp(outShot).stats();
  const sd = (st.channels[0].stdev + st.channels[1].stdev + st.channels[2].stdev) / 3;
  const mean = st.channels.slice(0, 3).map((c) => Math.round(c.mean)).join(",");
  if (sd < 8) {
    console.log(`attempt ${attempt}: blank frame (stdev ${sd.toFixed(1)})`);
    v++;
    continue;
  }
  const s = await sig(outShot);
  const dup = refSigs.find((r) => ncc(s, r.s) > 0.995);
  if (dup) {
    console.log(`attempt ${attempt}: still identical to ${dup.name} - swap did not land`);
    v++;
    await sleep(2000);
    continue;
  }

  console.log(
    `VERIFIED on attempt ${attempt}: pid ${oldPid || "-"} -> ${newPid}, ?v=${v}, mean=${mean}, stdev=${sd.toFixed(1)}`
  );
  process.exit(0);
}

console.error("FAILED: could not get a distinct frame after 4 attempts");
process.exit(1);
