const sharp = require("sharp");
(async () => {
  const svg = `<svg width="400" height="120" xmlns="http://www.w3.org/2000/svg">
<rect width="400" height="120" fill="#200609"/>
<text x="200" y="60" font-family="Segoe UI" font-weight="600" font-size="40" fill="#FBF3E0" text-anchor="middle">DHIKR</text>
</svg>`;
  const W = 60, H = 18;
  const buf = await sharp(Buffer.from(svg)).resize(W, H).grayscale().raw().toBuffer();
  for (let y = 0; y < H; y++) { let row = ""; for (let x = 0; x < W; x++) { const v = buf[y * W + x]; row += (v < 50 ? "." : v < 110 ? ":" : v < 180 ? "+" : "#"); } console.log(row); }
})();