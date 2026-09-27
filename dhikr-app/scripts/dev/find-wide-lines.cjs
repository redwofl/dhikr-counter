const sharp = require("sharp");
const path = require("path");

(async () => {
  const file = path.join(process.env.TEMP, "opencode", "screen5.png");
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  // For each row, find runs where consecutive pixels are very similar (within small delta)
  // and the run covers most of the width; report runs >= 70% width.
  const W90 = Math.floor(w * 0.7);
  for (let y = 0; y < h; y++) {
    let runs = [];
    let s = 0, c0 = (data[(y*w+0)*4], data[(y*w+0)*4+1], data[(y*w+0)*4+2]);
    let r = data[y*w*4], g = data[y*w*4+1], b = data[y*w*4+2];
    let start = 0;
    for (let x = 1; x < w; x++) {
      const i = (y*w+x)*4;
      const nr = data[i], ng = data[i+1], nb = data[i+2];
      const delta = Math.abs(nr-r)+Math.abs(ng-g)+Math.abs(nb-b);
      if (delta > 24) { if (x-start >= W90) runs.push([start,x-start,r,g,b]); r=nr; g=ng; b=nb; start=x; }
      else continue;
    }
    if (w-start >= W90) runs.push([start,w-start,r,g,b]);
    if (runs.length) {
      for (const [x,len,r2,g2,b2] of runs) {
        console.log(`y=${y} x${x}+${len} rgb(${r2},${g2},${b2})`);
      }
    }
  }
})();