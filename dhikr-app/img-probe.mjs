import sharp from "sharp";

const files = process.argv.slice(2);
for (const f of files) {
  try {
    const m = await sharp(f).metadata();
    const s = await sharp(f).stats();
    const mean = s.channels.slice(0, 3).map((c) => Math.round(c.mean)).join(",");
    const sd = (s.channels[0].stdev + s.channels[1].stdev + s.channels[2].stdev) / 3;
    console.log(
      `${f.padEnd(26)} ${String(m.width).padStart(5)}x${String(m.height).padEnd(5)}` +
        ` mean=${mean.padEnd(14)} stdev=${sd.toFixed(1).padEnd(6)} ${m.format}`
    );
  } catch (e) {
    console.log(`${f.padEnd(26)} ERROR ${e.message}`);
  }
}
