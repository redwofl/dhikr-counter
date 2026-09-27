import { execSync } from "child_process";
import { existsSync } from "fs";

const BASH = "E:/Git/bin/bash.exe";
console.log("E:/Git/bin/bash.exe exists:", existsSync(BASH));

const mk = (opts) => (c) =>
  execSync(c, { stdio: ["ignore", "pipe", "pipe"], ...opts }).toString();

// candidate A: explicit bash + MSYS_NO_PATHCONV
const a = mk({ shell: BASH, env: { ...process.env, MSYS_NO_PATHCONV: "1" } });
// candidate B: default shell
const b = mk({ shell: true, env: { ...process.env, MSYS_NO_PATHCONV: "1" } });

for (const [name, sh] of [
  ["A explicit bash", a],
  ["B default shell", b],
]) {
  try {
    console.log(`\n[${name}]`);
    console.log("  echo:", sh("echo hi").trim());
    console.log("  adb:", sh("adb devices | tail -1").trim());
    const d = sh("adb -s emulator-5554 shell uiautomator dump; adb -s emulator-5554 shell cat /sdcard/window_dump.xml");
    console.log("  uiautomator sees counter:", /Tap to count/.test(d));
  } catch (e) {
    console.log("  FAILED:", e.message.split("\n")[0]);
  }
}
