const sharp = require("sharp");
const fs = require("fs");

(async () => {
  const text = "سبحان الله";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="300">
    <rect width="900" height="300" fill="white"/>
    <text x="450" y="170" font-family="Amiri" font-size="100" text-anchor="middle" fill="black" direction="rtl" unicode-bidi="bidi-override">${text}</text></svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  fs.writeFileSync("test-arabic.png", buf);
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  let out = "";
  for (let y = 0; y < 300; y += 5) {
    let row = "";
    for (let x = 0; x < 900; x += 5) {
      const i = (y * w + x) * 4;
      const dark = 765 - (data[i] + data[i + 1] + data[i + 2]);
      row += dark > 150 ? "#" : dark > 60 ? "+" : dark > 20 ? ":" : ".";
    }
    out += row + "\n";
  }
  console.log(out);
})();