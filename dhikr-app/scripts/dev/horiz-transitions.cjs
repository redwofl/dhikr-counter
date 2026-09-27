const sharp = require("sharp");
const path = require("path");

(async () => {
  const { data, info } = await sharp(path.join(process.env.TEMP, "opencode", "screen5.png")).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  const R = [], G = [], B = [];
  for (let y = 0; y < h; y++) {
    let sr = 0, sg = 0, sb = 0;
    const off = y * w * 4;
    for (let x = 0; x < w; x++) { sr += data[off + x*4]; sg += data[off + x*4+1]; sb += data[off + x*4+2]; }
    R.push(sr / w); G.push(sg / w); B.push(sb / w);
  }
  for (let y = 1; y < h; y++) {
    const d = Math.abs(R[y]-R[y-1]) + Math.abs(G[y]-G[y-1]) + Math.abs(B[y]-B[y-1]);
    if (d > 6) {
      console.log(`y=${y} delta=${d.toFixed(1)} avg rgb(${R[y].toFixed(0)},${G[y].toFixed(0)},${B[y].toFixed(0)}) <- prev rgb(${R[y-1].toFixed(0)},${G[y-1].toFixed(0)},${B[y-1].toFixed(0)})`);
    }
  }
})();