import sharp from "sharp";
import { readdirSync } from "fs";

const files = readdirSync("..").filter((f) => /^bg_preview_\d+\.png$/.test(f))
  .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));

console.log("file".padEnd(20) + "mean RGB".padEnd(18) + "stdev".padEnd(10) + "status");
for (const f of files) {
  const s = await sharp(`../${f}`).stats();
  const mean = s.channels.slice(0, 3).map((c) => Math.round(c.mean)).join(",");
  const sd = (s.channels[0].stdev + s.channels[1].stdev + s.channels[2].stdev) / 3;
  const status = sd < 8 ? "BLANK - rerun" : "ok";
  console.log(
    f.padEnd(20) + mean.padEnd(18) + sd.toFixed(1).padEnd(10) + status
  );
}
