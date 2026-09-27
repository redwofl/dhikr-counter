const sharp = require("sharp");

const W = 1080;
const H = 1920;

const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#F4EBD8"/>
    <stop offset="0.55" stop-color="#EDE1C8"/>
    <stop offset="1" stop-color="#E3D4B6"/>
  </linearGradient>

  <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="rgba(255,232,190,0.42)"/>
    <stop offset="0.55" stop-color="rgba(255,232,190,0.18)"/>
    <stop offset="1" stop-color="rgba(255,232,190,0)"/>
  </radialGradient>

  <pattern id="geo" width="176" height="176" patternUnits="userSpaceOnUse">
    <g fill="none">
      <g transform="translate(0 1.8)" stroke="#C7B086" stroke-opacity="0.42" stroke-width="3" stroke-linejoin="round">
        <rect x="52" y="52" width="72" height="72"/>
        <rect x="52" y="52" width="72" height="72" transform="rotate(45 88 88)"/>
        <circle cx="88" cy="88" r="36"/>
        <path d="M-28 88 L204 88 M88 -28 L88 204 M6 6 L170 170 M170 6 L6 170"/>
      </g>
      <g transform="translate(0 -1.8)" stroke="#FCF4E2" stroke-opacity="0.55" stroke-width="3" stroke-linejoin="round">
        <rect x="52" y="52" width="72" height="72"/>
        <rect x="52" y="52" width="72" height="72" transform="rotate(45 88 88)"/>
        <circle cx="88" cy="88" r="36"/>
        <path d="M-28 88 L204 88 M88 -28 L88 204 M6 6 L170 170 M170 6 L6 170"/>
      </g>
    </g>
  </pattern>

  <linearGradient id="hazeMid" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="rgba(244,232,206,0)"/>
    <stop offset="0.5" stop-color="rgba(244,232,206,0.4)"/>
    <stop offset="1" stop-color="rgba(244,232,206,0)"/>
  </linearGradient>

  <linearGradient id="hazeGrad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="rgba(238,224,196,0)"/>
    <stop offset="0.6" stop-color="rgba(234,218,188,0.4)"/>
    <stop offset="1" stop-color="rgba(228,210,178,0.6)"/>
  </linearGradient>

  <radialGradient id="domeShade" cx="50%" cy="30%" r="62%">
    <stop offset="0" stop-color="rgba(255,190,120,0.18)"/>
    <stop offset="0.6" stop-color="rgba(120,48,26,0.0)"/>
    <stop offset="1" stop-color="rgba(90,34,20,0.32)"/>
  </radialGradient>

  <filter id="soft16" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="16"/></filter>
  <filter id="soft24" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="24"/></filter>
  <filter id="sunblur" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3"/></filter>
</defs>

<rect width="${W}" height="${H}" fill="url(#paper)"/>
<rect width="${W}" height="${H}" fill="url(#geo)"/>

<ellipse cx="800" cy="430" rx="560" ry="560" fill="url(#sunGlow)"/>
<circle cx="800" cy="430" r="96" fill="#F7E7C2" opacity="0.92" filter="url(#sunblur)"/>
<path d="M760 400 L900 700 L820 760 L700 440 Z" fill="rgba(250,232,190,0.10)" filter="url(#soft24)"/>

<!-- ===== layered geometric desert hills ===== -->
<path d="M0 780 C260 720 420 820 700 770 C900 736 1000 800 1080 770 L1080 1120 L0 1120 Z" fill="#C9A87E" opacity="0.55"/>
<path d="M0 880 C300 840 520 900 820 850 C950 828 1030 880 1080 860 L1080 1250 L0 1250 Z" fill="#B4552D" opacity="0.80"/>

<!-- warm atmospheric haze behind the architecture -->
<rect y="820" width="${W}" height="420" fill="url(#hazeMid)" filter="url(#soft16)"/>

<!-- near graphic ridges (emerald accent + crimson) in front of the haze -->
<path d="M0 1020 C280 1000 460 1040 620 1015 C780 992 940 1030 1080 1008 L1080 1070 L0 1070 Z" fill="#1E4D3B" opacity="0.80"/>
<path d="M340 990 C420 972 500 998 560 986 C620 972 700 1000 780 990 L780 1030 L340 1030 Z" fill="#1E4D3B" opacity="0.55"/>
<path d="M0 1040 C340 1000 620 1060 1080 1020 L1080 1340 L0 1340 Z" fill="#8E3030" opacity="0.85"/>
<g fill="none" stroke="rgba(244,226,190,0.6)" stroke-width="3">
  <path d="M180 880 A220 90 0 0 1 420 856"/>
  <path d="M660 800 A240 90 0 0 1 952 782"/>
</g>

<!-- warm atmospheric haze behind the architecture -->
<rect y="820" width="${W}" height="420" fill="url(#hazeMid)" filter="url(#soft16)"/>

<!-- ===== MOSQUE ARCHITECTURE ===== -->
<g>
  <!-- LEFT MINARET -->
  <g>
    <rect x="120" y="1810" width="60" height="110" fill="#7A3A20"/>
    <rect x="130" y="920" width="40" height="890" fill="#B4552D"/>
    <rect x="134" y="885" width="32" height="38" fill="#C96A33"/>
    <path d="M130 900 L170 900 L160 880 L140 880 Z" fill="#8E3A25"/>
    <circle cx="150" cy="874" r="7" fill="#C96A33"/>
    <path d="M150 866 L150 856" stroke="#B4552D" stroke-width="3"/>
    <line x1="138" y1="922" x2="138" y2="1796" stroke="#8E3A25" stroke-width="2" opacity="0.5"/>
    <line x1="152" y1="922" x2="152" y2="1796" stroke="#8E3A25" stroke-width="2" opacity="0.5"/>
    <g>
      <rect x="118" y="1010" width="64" height="10" rx="3" fill="#C96A33"/>
      <rect x="124" y="1020" width="52" height="6" fill="#8E3A25"/>
      <rect x="126" y="1030" width="48" height="4" fill="#1E4D3B" opacity="0.7"/>
    </g>
    <g>
      <rect x="118" y="1170" width="64" height="10" rx="3" fill="#C96A33"/>
      <rect x="124" y="1180" width="52" height="6" fill="#8E3A25"/>
      <rect x="126" y="1190" width="48" height="4" fill="#1E4D3B" opacity="0.7"/>
    </g>
    <g>
      <rect x="118" y="1330" width="64" height="10" rx="3" fill="#C96A33"/>
      <rect x="124" y="1340" width="52" height="6" fill="#8E3A25"/>
      <rect x="126" y="1350" width="48" height="4" fill="#1E4D3B" opacity="0.7"/>
    </g>
    <g fill="#2E5D47">
      <rect x="145" y="1080" width="10" height="34" rx="5"/>
      <rect x="145" y="1250" width="10" height="34" rx="5"/>
      <rect x="145" y="1420" width="10" height="34" rx="5"/>
      <rect x="145" y="1560" width="10" height="34" rx="5"/>
    </g>
    <rect x="130" y="1640" width="40" height="6" fill="#8E3A25" opacity="0.8"/>
    <rect x="130" y="1710" width="40" height="6" fill="#8E3A25" opacity="0.8"/>
    <rect x="130" y="1780" width="40" height="6" fill="#8E3A25" opacity="0.8"/>
  </g>

  <!-- RIGHT MINARET -->
  <g>
    <rect x="900" y="1810" width="60" height="110" fill="#7A3A20"/>
    <rect x="910" y="920" width="40" height="890" fill="#B4552D"/>
    <rect x="914" y="885" width="32" height="38" fill="#C96A33"/>
    <path d="M910 900 L950 900 L940 880 L920 880 Z" fill="#8E3A25"/>
    <circle cx="930" cy="874" r="7" fill="#C96A33"/>
    <path d="M930 866 L930 856" stroke="#B4552D" stroke-width="3"/>
    <line x1="918" y1="922" x2="918" y2="1796" stroke="#8E3A25" stroke-width="2" opacity="0.5"/>
    <line x1="932" y1="922" x2="932" y2="1796" stroke="#8E3A25" stroke-width="2" opacity="0.5"/>
    <g>
      <rect x="898" y="1010" width="64" height="10" rx="3" fill="#C96A33"/>
      <rect x="904" y="1020" width="52" height="6" fill="#8E3A25"/>
      <rect x="906" y="1030" width="48" height="4" fill="#1E4D3B" opacity="0.7"/>
    </g>
    <g>
      <rect x="898" y="1170" width="64" height="10" rx="3" fill="#C96A33"/>
      <rect x="904" y="1180" width="52" height="6" fill="#8E3A25"/>
      <rect x="906" y="1190" width="48" height="4" fill="#1E4D3B" opacity="0.7"/>
    </g>
    <g>
      <rect x="898" y="1330" width="64" height="10" rx="3" fill="#C96A33"/>
      <rect x="904" y="1340" width="52" height="6" fill="#8E3A25"/>
      <rect x="906" y="1350" width="48" height="4" fill="#1E4D3B" opacity="0.7"/>
    </g>
    <g fill="#2E5D47">
      <rect x="925" y="1080" width="10" height="34" rx="5"/>
      <rect x="925" y="1250" width="10" height="34" rx="5"/>
      <rect x="925" y="1420" width="10" height="34" rx="5"/>
      <rect x="925" y="1560" width="10" height="34" rx="5"/>
    </g>
    <rect x="910" y="1640" width="40" height="6" fill="#8E3A25" opacity="0.8"/>
    <rect x="910" y="1710" width="40" height="6" fill="#8E3A25" opacity="0.8"/>
    <rect x="910" y="1780" width="40" height="6" fill="#8E3A25" opacity="0.8"/>
  </g>

  <!-- LEFT SMALL DOME -->
  <g>
    <rect x="298" y="1230" width="116" height="64" fill="#C9A87E"/>
    <g stroke="#8E3A25" stroke-width="2" opacity="0.55">
      <line x1="308" y1="1230" x2="308" y2="1294"/>
      <line x1="326" y1="1230" x2="326" y2="1294"/>
      <line x1="344" y1="1230" x2="344" y2="1294"/>
      <line x1="362" y1="1230" x2="362" y2="1294"/>
      <line x1="380" y1="1230" x2="380" y2="1294"/>
      <line x1="398" y1="1230" x2="398" y2="1294"/>
    </g>
    <path d="M300 1230 C318 1168 344 1136 355 1136 C366 1136 392 1168 410 1230 Z" fill="#B4552D"/>
    <g stroke="rgba(128,52,30,0.55)" stroke-width="2.5" fill="none">
      <path d="M355 1148 Q342 1180 320 1218"/>
      <path d="M355 1148 Q353 1182 340 1224"/>
      <path d="M355 1148 L355 1226"/>
      <path d="M355 1148 Q357 1182 370 1224"/>
      <path d="M355 1148 Q368 1180 390 1218"/>
    </g>
    <circle cx="355" cy="1128" r="6" fill="#C96A33"/>
    <path d="M355 1120 L355 1108" stroke="#B4552D" stroke-width="3"/>
    <rect x="302" y="1294" width="108" height="516" fill="#A0492B"/>
    <rect x="350" y="1400" width="12" height="120" rx="6" fill="#2E5D47"/>
    <path d="M320 1810 C320 1750 392 1750 392 1810 Z" fill="#6E361F"/>
    <path d="M332 1810 C332 1760 380 1760 380 1810 Z" fill="#1E4D3B"/>
  </g>

  <!-- RIGHT SMALL DOME -->
  <g>
    <rect x="668" y="1230" width="116" height="64" fill="#C9A87E"/>
    <g stroke="#8E3A25" stroke-width="2" opacity="0.55">
      <line x1="678" y1="1230" x2="678" y2="1294"/>
      <line x1="696" y1="1230" x2="696" y2="1294"/>
      <line x1="714" y1="1230" x2="714" y2="1294"/>
      <line x1="732" y1="1230" x2="732" y2="1294"/>
      <line x1="750" y1="1230" x2="750" y2="1294"/>
      <line x1="768" y1="1230" x2="768" y2="1294"/>
    </g>
    <path d="M670 1230 C688 1168 714 1136 725 1136 C736 1136 762 1168 780 1230 Z" fill="#B4552D"/>
    <g stroke="rgba(128,52,30,0.55)" stroke-width="2.5" fill="none">
      <path d="M725 1148 Q712 1180 690 1218"/>
      <path d="M725 1148 Q723 1182 710 1224"/>
      <path d="M725 1148 L725 1226"/>
      <path d="M725 1148 Q727 1182 740 1224"/>
      <path d="M725 1148 Q738 1180 760 1218"/>
    </g>
    <circle cx="725" cy="1128" r="6" fill="#C96A33"/>
    <path d="M725 1120 L725 1108" stroke="#B4552D" stroke-width="3"/>
    <rect x="672" y="1294" width="108" height="516" fill="#A0492B"/>
    <rect x="720" y="1400" width="12" height="120" rx="6" fill="#2E5D47"/>
    <path d="M688 1810 C688 1750 760 1750 760 1810 Z" fill="#6E361F"/>
    <path d="M700 1810 C700 1760 748 1760 748 1810 Z" fill="#1E4D3B"/>
  </g>

  <!-- CENTRAL DOME + DRUM -->
  <rect x="402" y="1234" width="276" height="6" fill="#1E4D3B" opacity="0.85"/>
  <rect x="402" y="1240" width="276" height="100" fill="#C9A87E"/>
  <g stroke="#8E3A25" stroke-width="2" opacity="0.55">
    <line x1="416" y1="1240" x2="416" y2="1340"/>
    <line x1="444" y1="1240" x2="444" y2="1340"/>
    <line x1="472" y1="1240" x2="472" y2="1340"/>
    <line x1="500" y1="1240" x2="500" y2="1340"/>
    <line x1="528" y1="1240" x2="528" y2="1340"/>
    <line x1="556" y1="1240" x2="556" y2="1340"/>
    <line x1="584" y1="1240" x2="584" y2="1340"/>
    <line x1="612" y1="1240" x2="612" y2="1340"/>
    <line x1="640" y1="1240" x2="640" y2="1340"/>
    <line x1="664" y1="1240" x2="664" y2="1340"/>
  </g>
  <g>
    <rect x="414" y="1250" width="26" height="52" rx="13" fill="#1E4D3B"/>
    <rect x="466" y="1250" width="26" height="52" rx="13" fill="#1E4D3B"/>
    <rect x="526" y="1250" width="26" height="52" rx="13" fill="#1E4D3B"/>
    <rect x="586" y="1250" width="26" height="52" rx="13" fill="#1E4D3B"/>
    <rect x="642" y="1250" width="26" height="52" rx="13" fill="#1E4D3B"/>
  </g>
  <path d="M404 1240 C428 1160 480 1080 536 1045 C592 1080 644 1160 668 1240 Z" fill="#B4552D"/>
  <g stroke="rgba(128,52,30,0.55)" stroke-width="3" fill="none">
    <path d="M536 1078 Q512 1160 432 1230"/>
    <path d="M536 1078 Q524 1160 470 1234"/>
    <path d="M536 1078 Q533 1160 505 1238"/>
    <path d="M536 1078 L536 1240"/>
    <path d="M536 1078 Q539 1160 567 1238"/>
    <path d="M536 1078 Q548 1160 602 1234"/>
    <path d="M536 1078 Q560 1160 640 1230"/>
  </g>
  <path d="M420 1180 Q536 1150 652 1180" fill="none" stroke="rgba(236,168,110,0.5)" stroke-width="4"/>
  <path d="M404 1240 C428 1160 480 1080 536 1045 C592 1080 644 1160 668 1240 Z" fill="url(#domeShade)"/>
  <circle cx="536" cy="1040" r="7" fill="#C96A33"/>
  <path d="M536 1032 L536 1016" stroke="#B4552D" stroke-width="4"/>

  <!-- CENTRAL FACADE -->
  <rect x="372" y="1340" width="336" height="18" fill="#C96A33"/>
  <rect x="372" y="1358" width="336" height="6" fill="#8E3A25"/>
  <rect x="372" y="1364" width="336" height="476" fill="#B4552D"/>

  <!-- grand arched entrance (emerald door) -->
  <path d="M466 1390 C466 1330 596 1330 596 1390 L596 1840 L466 1840 Z" fill="#8E3A25"/>
  <path d="M476 1396 Q540 1338 586 1396 L586 1840 L476 1840 Z" fill="#1E4D3B"/>
  <rect x="476" y="1820" width="110" height="10" fill="#C96A33"/>
  <path d="M500 1390 L500 1840 M548 1390 L548 1840" stroke="#6E361F" stroke-width="3" opacity="0.6"/>
  <path d="M470 1420 Q540 1372 592 1420" fill="none" stroke="#C9A87E" stroke-width="4" opacity="0.8"/>

  <!-- flanking arched windows -->
  <rect x="396" y="1404" width="44" height="118" rx="22" fill="#8E3A25"/>
  <rect x="403" y="1411" width="30" height="104" rx="15" fill="#2E5D47"/>
  <rect x="600" y="1404" width="44" height="118" rx="22" fill="#8E3A25"/>
  <rect x="607" y="1411" width="30" height="104" rx="15" fill="#2E5D47"/>

  <!-- arcade niche band -->
  <g>
    <rect x="384" y="1560" width="35" height="70" rx="17.5" fill="#C96A33" opacity="0.7"/>
    <rect x="423" y="1560" width="35" height="70" rx="17.5" fill="#C96A33" opacity="0.7"/>
    <rect x="462" y="1560" width="35" height="70" rx="17.5" fill="#C96A33" opacity="0.7"/>
    <rect x="501" y="1560" width="35" height="70" rx="17.5" fill="#C96A33" opacity="0.7"/>
    <rect x="540" y="1560" width="35" height="70" rx="17.5" fill="#C96A33" opacity="0.7"/>
    <rect x="579" y="1560" width="35" height="70" rx="17.5" fill="#C96A33" opacity="0.7"/>
    <rect x="618" y="1560" width="35" height="70" rx="17.5" fill="#C96A33" opacity="0.7"/>
    <rect x="657" y="1560" width="35" height="70" rx="17.5" fill="#C96A33" opacity="0.7"/>
    <g fill="#8E3A25">
      <circle cx="401" cy="1595" r="4"/>
      <circle cx="440" cy="1595" r="4"/>
      <circle cx="479" cy="1595" r="4"/>
      <circle cx="518" cy="1595" r="4"/>
      <circle cx="557" cy="1595" r="4"/>
      <circle cx="596" cy="1595" r="4"/>
      <circle cx="635" cy="1595" r="4"/>
      <circle cx="674" cy="1595" r="4"/>
    </g>
  </g>
  <rect x="372" y="1730" width="336" height="10" fill="#C96A33"/>
</g>

<!-- ground plinth -->
<rect x="0" y="1840" width="${W}" height="80" fill="#6E361F"/>
<rect x="0" y="1826" width="${W}" height="14" fill="#C96A33" opacity="0.9"/>
<rect x="0" y="1822" width="${W}" height="4" fill="#1E4D3B" opacity="0.8"/>

<!-- atmospheric bottom haze -->
<rect y="1500" width="${W}" height="420" fill="url(#hazeGrad)"/>

<!-- editorial border frame -->
<rect x="28" y="28" width="1024" height="1864" fill="none" stroke="#9A4A2B" stroke-width="3" opacity="0.75"/>
<rect x="40" y="40" width="1000" height="1840" fill="none" stroke="#C9A87E" stroke-width="1.5" opacity="0.9"/>
</svg>`;

const noiseSvg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
<filter id="n" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency="0.8 0.35" numOctaves="3" seed="11"/>
</filter>
<rect width="${W}" height="${H}" filter="url(#n)"/>
</svg>`;

(async () => {
  const base = await sharp(Buffer.from(svg)).png().toBuffer();
  const noise = await sharp(Buffer.from(noiseSvg)).resize(W * 1.2, H * 1.2).resize(W, H).grayscale().png().toBuffer();
  const dark = await sharp(noise).linear(0.4, 0).png().toBuffer();
  const light = await sharp(noise).linear(0.10, 0).png().toBuffer();

  const out = await sharp(base)
    .composite([
      { input: dark, blend: "multiply", left: 0, top: 0 },
      { input: light, blend: "screen", left: 0, top: 0 },
    ])
    .sharpen({ sigma: 0.6, m1: 1.2, m2: 2 })
    .png()
    .toBuffer();

  require("fs").writeFileSync(
    "C:/Users/Black_owl/Downloads/dhikr-counter-app/dhikr-app/public/counter-bg-editorial.png",
    out
  );
  const meta = await sharp(out).metadata();
  console.log("written", meta.width, meta.height);
})();