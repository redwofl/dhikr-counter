const sharp = require("sharp");
const fs = require("fs");

(async () => {
  const { data, info } = await sharp(fs.readFileSync("public/counter-bg-custom.png")).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  // screen->img: img_x = x/1.967 + 216 ; img_y = y/1.967
  const probe = (sx, sy) => {
    const ix = sx / 1.967 + 216;
    const iy = sy / 1.967;
    const i = ((iy | 0) * w + (ix | 0)) * 4;
    return `screen(${sx},${sy}) -> img(${ix|0},${iy|0}) rgba(${data[i]},${data[i+1]},${data[i+2]},${data[i+3]})`;
  };
  // bars at y 720,1157,1190,1686,1719,2216,2249,2597,2630 ; x from 334 to 1100
  for (const y of [720, 1157, 1190, 1686, 1719, 2216, 2249, 2597, 2630]) {
    console.log(probe(350, y));
    console.log(probe(700, y));
    console.log(probe(1090, y));
  }
  // sample one for multiple x to check flatness
  const y = 1157;
  console.log("\nHorizontal profile at y=1157:");
  for (const sx of [334, 400, 500, 600, 700, 800, 900, 1000, 1100]) {
    console.log(probe(sx, y));
  }
})();