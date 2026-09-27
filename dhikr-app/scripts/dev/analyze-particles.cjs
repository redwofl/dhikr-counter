const sharp = require("sharp");

(async () => {
  const { data, info } = await sharp("public/counter-bg-custom.png")
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width, c = info.channels;
  for (const thresh of [8, 20, 40, 60, 90]) {
    console.log("--- alpha >", thresh, "---");
    let total = 0;
    const strips = [];
    for (let y = 0; y < 800; y += 50) {
      let cnt = 0;
      for (let yy = y; yy < y + 50 && yy < 800; yy++) {
        for (let x = 0; x < w; x++) {
          const i = (yy * w + x) * c;
          if (data[i + 3] > thresh) cnt++;
        }
      }
      if (cnt) strips.push(`y${y}-${y + 50}: ${cnt}`);
      total += cnt;
    }
    console.log(strips.join("\n"));
    console.log("total:", total);
  }
})();