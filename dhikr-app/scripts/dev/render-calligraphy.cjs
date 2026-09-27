const sharp = require("sharp");

const W = 1200;
const H = 1600;

const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <radialGradient id="halo" cx="50%" cy="44%" r="70%">
    <stop offset="0%" stop-color="#171006"/>
    <stop offset="55%" stop-color="#0A0703"/>
    <stop offset="100%" stop-color="#040201"/>
  </radialGradient>

  <radialGradient id="goldRadial" cx="600" cy="840" r="400" fx="512" fy="760" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#F7E7AC"/>
    <stop offset="0.12" stop-color="#EDCF82"/>
    <stop offset="0.32" stop-color="#D4A84F"/>
    <stop offset="0.58" stop-color="#B88632"/>
    <stop offset="0.82" stop-color="#8A641F"/>
    <stop offset="1" stop-color="#6F4F17"/>
  </radialGradient>

  <linearGradient id="sheen" x1="0%" y1="100%" x2="100%" y2="0%">
    <stop offset="0%" stop-color="rgba(243,223,160,0)"/>
    <stop offset="0.38" stop-color="rgba(243,223,160,0)"/>
    <stop offset="0.48" stop-color="rgba(250,234,185,0.20)"/>
    <stop offset="0.56" stop-color="rgba(250,234,185,0)"/>
    <stop offset="0.78" stop-color="rgba(243,223,160,0.10)"/>
    <stop offset="1" stop-color="rgba(243,223,160,0)"/>
  </linearGradient>

  <linearGradient id="streak" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="rgba(232,200,117,0)"/>
    <stop offset="0.46" stop-color="rgba(232,200,117,0)"/>
    <stop offset="0.54" stop-color="rgba(232,200,117,0.10)"/>
    <stop offset="1" stop-color="rgba(232,200,117,0)"/>
  </linearGradient>
</defs>

<rect width="${W}" height="${H}" fill="url(#halo)"/>

<text text-anchor="middle" font-family="Amiri" font-weight="700" font-size="300" x="600" y="862" fill="url(#goldRadial)">الحمد لله</text>
<text text-anchor="middle" font-family="Amiri" font-weight="700" font-size="300" x="600" y="862" fill="url(#sheen)">الحمد لله</text>
<text text-anchor="middle" font-family="Amiri" font-weight="700" font-size="300" x="600" y="862" fill="url(#streak)">الحمد لله</text>
</svg>`;

const noiseSvg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<filter id="n" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency="0.9 0.65" numOctaves="2" seed="21"/>
</filter>
<rect width="${W}" height="${H}" filter="url(#n)"/>
</svg>`;

(async () => {
  const base = await sharp(Buffer.from(svg)).png().toBuffer();
  const noise = await sharp(Buffer.from(noiseSvg)).resize(W, H).grayscale().png().toBuffer();
  const dark = await sharp(noise).linear(0.22, 0).png().toBuffer();
  const light = await sharp(noise).linear(0.09, 0).png().toBuffer();

  const out = await sharp(base)
    .composite([
      { input: dark, blend: "multiply", left: 0, top: 0 },
      { input: light, blend: "screen", left: 0, top: 0 },
    ])
    .sharpen({ sigma: 0.5, m1: 1.1, m2: 2 })
    .png()
    .toBuffer();

  require("fs").writeFileSync(
    "C:/Users/Black_owl/Downloads/dhikr-counter-app/dhikr-app/public/counter-bg-calligraphy.png",
    out
  );
  const meta = await sharp(out).metadata();
  console.log("written", meta.width, meta.height);
})();