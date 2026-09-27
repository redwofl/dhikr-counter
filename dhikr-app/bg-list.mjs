import sharp from "sharp";
import { readdirSync } from "fs";

const files = readdirSync("public").filter(
  (f) => /^counter-bg.*\.(png|jpg|webp)$/i.test(f) && !f.includes("BACKUP")
);
files.sort((a, b) => a.localeCompare(b));

for (const f of files) {
  try {
    const m = await sharp(`public/${f}`).metadata();
    const ratio = (m.width / m.height).toFixed(2);
    console.log(
      `${f.padEnd(30)} ${String(m.width).padStart(5)}x${String(m.height).padEnd(5)} ratio=${ratio}`
    );
  } catch (e) {
    console.log(`${f.padEnd(30)} ERROR ${e.message}`);
  }
}
