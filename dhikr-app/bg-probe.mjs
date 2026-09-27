import sharp from "sharp";
import { readFileSync } from "fs";

const f = process.argv[2] || "public/counter-bg-kaaba.webp";
try {
  const m = await sharp(f).metadata();
  console.log(`${f}\n  format=${m.format} ${m.width}x${m.height}`);
} catch (e) {
  console.log(`${f}\n  UNREADABLE: ${e.message}`);
  const head = readFileSync(f).subarray(0, 16);
  console.log("  first bytes:", head.toString("hex"));
}

const s = process.argv[3];
if (s) {
  const st = await sharp(s).stats();
  console.log(`\n${s}`);
  console.log(
    `  mean RGB = ${st.channels.map((c) => Math.round(c.mean)).join(", ")}` +
      `   stdev = ${st.channels.map((c) => c.stdev.toFixed(1)).join(", ")}`
  );
  console.log(
    `  is_near_uniform = ${st.channels.every((c) => c.stdev < 3)}` +
      `  (a real UI screenshot has stdev > 20)`
  );
}
