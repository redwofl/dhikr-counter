const sharp = require("sharp");

const W = 1200;
const H = 1500;

const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#14422F"/>
    <stop offset="0.5" stop-color="#0D3022"/>
    <stop offset="1" stop-color="#08271B"/>
  </linearGradient>

  <pattern id="star" width="150" height="150" patternUnits="userSpaceOnUse">
    <g fill="none">
      <g transform="translate(0 2)" stroke="#06170F" stroke-opacity="0.34" stroke-width="4" stroke-linejoin="round">
        <rect x="43" y="43" width="64" height="64"/>
        <rect x="43" y="43" width="64" height="64" transform="rotate(45 75 75)"/>
        <path d="M-38 75 L188 75 M75 -38 L75 188 M-10 -10 L160 160 M160 -10 L-10 160"/>
      </g>
      <g stroke="#B0A05A" stroke-opacity="0.16" stroke-width="3.4" stroke-linejoin="round">
        <rect x="43" y="43" width="64" height="64"/>
        <rect x="43" y="43" width="64" height="64" transform="rotate(45 75 75)"/>
        <circle cx="75" cy="75" r="34"/>
        <path d="M-38 75 L188 75 M75 -38 L75 188 M-10 -10 L160 160 M160 -10 L-10 160"/>
      </g>
    </g>
  </pattern>

  <linearGradient id="ivoryGrad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#FDF7E6"/>
    <stop offset="0.42" stop-color="#F3E7C6"/>
    <stop offset="0.72" stop-color="#E3D3A8"/>
    <stop offset="1" stop-color="#CDBC93"/>
  </linearGradient>

  <linearGradient id="ivorySweep" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="rgba(255,252,238,0)"/>
    <stop offset="0.45" stop-color="rgba(255,252,238,0)"/>
    <stop offset="0.56" stop-color="rgba(255,252,238,0.26)"/>
    <stop offset="0.72" stop-color="rgba(255,252,238,0)"/>
  </linearGradient>

  <radialGradient id="bronzeLight" cx="50%" cy="64%" r="48%">
    <stop offset="0" stop-color="rgba(186,122,58,0)"/>
    <stop offset="0.5" stop-color="rgba(186,122,58,0.16)"/>
    <stop offset="1" stop-color="rgba(186,122,58,0)"/>
  </radialGradient>

  <linearGradient id="mistGrad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="rgba(64,108,86,0)"/>
    <stop offset="0.5" stop-color="rgba(64,108,86,0.24)"/>
    <stop offset="1" stop-color="rgba(7,30,21,0.55)"/>
  </linearGradient>

  <radialGradient id="vignette" cx="50%" cy="44%" r="74%">
    <stop offset="0" stop-color="rgba(4,14,9,0)"/>
    <stop offset="0.76" stop-color="rgba(4,14,9,0.08)"/>
    <stop offset="1" stop-color="rgba(3,10,6,0.26)"/>
  </radialGradient>

  <filter id="soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="16"/></filter>
  <filter id="blur1" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.2"/></filter>
  <filter id="bshadow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>
</defs>

<rect width="${W}" height="${H}" fill="url(#bgGrad)"/>
<rect width="${W}" height="${H}" fill="url(#star)"/>

<rect width="${W}" height="${H}" fill="url(#bronzeLight)"/>

<!-- ===== MOSQUE SILHOUETTES (deep pine/gold tones) ===== -->
<g>
  <!-- flanking minarets -->
  <g fill="#1F3C2E">
    <path d="M182 1500 L198 1500 L192 870 L188 870 Z"/>
    <path d="M183 812 L197 812 L193 840 L187 840 Z"/>
    <path d="M1018 1500 L1002 1500 L1008 870 L1012 870 Z"/>
    <path d="M1003 812 L1017 812 L1013 840 L1007 840 Z"/>
  </g>
  <g fill="#30503E">
    <rect x="178" y="846" width="24" height="10" rx="4"/>
    <rect x="178" y="952" width="24" height="10" rx="4"/>
    <rect x="178" y="1060" width="24" height="10" rx="4"/>
    <rect x="998" y="846" width="24" height="10" rx="4"/>
    <rect x="998" y="952" width="24" height="10" rx="4"/>
    <rect x="998" y="1060" width="24" height="10" rx="4"/>
    <circle cx="190" cy="806" r="7"/>
    <circle cx="1010" cy="806" r="7"/>
  </g>
  <g stroke="#C9A44B" stroke-width="3" fill="none" opacity="0.65">
    <path d="M190 808 L190 788"/>
    <path d="M1010 808 L1010 788"/>
  </g>

  <!-- side small domes -->
  <path d="M268 1500 L392 1500 L390 1430 C390 1370 344 1338 330 1336 C316 1338 270 1370 270 1430 Z" fill="#1F3C2E"/>
  <path d="M808 1500 L932 1500 L930 1430 C930 1370 884 1338 870 1336 C856 1338 810 1370 810 1430 Z" fill="#1F3C2E"/>
  <path d="M300 1400 C300 1374 318 1360 330 1360 C342 1360 360 1374 360 1400 Z" fill="#30503E"/>

  <!-- central dome -->
  <path d="M346 1500 L854 1500 L852 1400
           C852 1244 748 1152 600 1142
           C452 1152 348 1244 348 1400 Z" fill="#1F3C2E"/>
  <path d="M430 1396 C470 1280 540 1206 600 1192 C660 1206 730 1280 770 1396 Z" fill="#30503E"/>
  <rect x="446" y="1396" width="308" height="104" rx="14" fill="#30503E"/>
  <g fill="none" stroke="#C9A44B" stroke-width="4" opacity="0.6">
    <path d="M486 1444 A50 50 0 0 1 586 1444"/>
    <path d="M614 1444 A50 50 0 0 1 714 1444"/>
  </g>
  <path d="M588 1142 L600 1108 L612 1142 Z" fill="#30503E"/>
  <path d="M600 1108 L600 1092" stroke="#C9A44B" stroke-width="4" opacity="0.7"/>
  <circle cx="600" cy="1082" r="6" fill="#E2C66B" opacity="0.95"/>

  <!-- bronze rim light on dome left/centre -->
  <path d="M600 1142 C600 1190 560 1240 470 1310 M600 1142 C600 1190 645 1245 740 1320"
        fill="none" stroke="#C9A850" stroke-width="6" opacity="0.5" filter="url(#soft)"/>
  <path d="M470 1300 C520 1240 570 1200 596 1160"
        fill="none" stroke="#E5C97F" stroke-width="10" opacity="0.35" filter="url(#soft)"/>
</g>

<!-- mist + fog -->
<rect y="930" width="${W}" height="570" fill="url(#mistGrad)"/>
<rect x="320" y="1240" width="560" height="150" rx="75" fill="rgba(120,146,94,0.16)" filter="url(#soft)"/>

<!-- ===== IVORY CALLIGRAPHY (removed) ===== -->

<!-- ===== EDITORIAL TYPE (removed) ===== -->

<!-- vignette -->
<rect width="${W}" height="${H}" fill="url(#vignette)"/>
</svg>`;

const noiseSvg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<filter id="n" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency="0.55 0.10" numOctaves="3" seed="17"/>
</filter>
<rect width="${W}" height="${H}" filter="url(#n)"/>
</svg>`;

(async () => {
  const base = await sharp(Buffer.from(svg)).png().toBuffer();
  const noise = await sharp(Buffer.from(noiseSvg)).resize(W, H).grayscale().png().toBuffer();
  const dark = await sharp(noise).linear(0.94, 0).png().toBuffer();
  const light = await sharp(noise).linear(0.12, 0).png().toBuffer();

  const out = await sharp(base)
    .composite([
      { input: dark, blend: "multiply", left: 0, top: 0 },
      { input: light, blend: "screen", left: 0, top: 0 },
    ])
    .sharpen({ sigma: 0.8, m1: 1.4, m2: 2 })
    .png()
    .toBuffer();

  require("fs").writeFileSync(
    "C:/Users/Black_owl/Downloads/dhikr-counter-app/dhikr-app/public/counter-bg-artwork.png",
    out
  );
  const meta = await sharp(out).metadata();
  console.log("written", meta.width, meta.height);
})();