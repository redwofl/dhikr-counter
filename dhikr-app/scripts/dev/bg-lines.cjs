const sharp = require("sharp");
const fs = require("fs");

(async () => {
  for (const f of ["public/eid-bg.jpg", "public/counter-bg-custom.png"]) {
    const { data, info } = await sharp(fs.readFileSync(f)).raw().toBuffer({ resolveWithObject: true });
    const w = info.width, h = info.height;
    console.log(`\n== ${f} ${w}x${h} ==`);
    let count = 0;
    for (let y = 0; y < h; y++) {
      let c = null, len = 0;
      for (let x = 0; x < w; x++) {
        const i = (y*w+x)*4;
        const cur = (data[i]<<16)|(data[i+1]<<8)|data[i+2];
        if (cur === c) len++;
        else { c = cur; len = 1; }
      }
      if (len > w * 0.3) { console.log(`y=${y} run=${len}px color=#${c.toString(16).padStart(6,"0")}`); count++; }
      if (count > 12) return;
    }
    console.log("done, lines:", count);
  }
})();