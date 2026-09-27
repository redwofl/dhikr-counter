import sharp from "sharp";
import { writeFileSync } from "node:fs";

const cream = "#FBF7F0";
const goldStops = [["0%", "#F9E7AB"], ["50%", "#E3B65E"], ["100%", "#B9893C"]];
const beadStops = [["0%", "#E7AD73"], ["55%", "#C1723C"], ["100%", "#7C4522"]];

const D2R = Math.PI / 180;

function fmt(n) {
  return Number(n.toFixed(1)).toString();
}

function buildArtwork(size) {
  const s = size / 1024;
  const cx = fmt(512), cy = fmt(512);
  const ringR = 268 * s;
  const rO = 232 * s, rI = 138 * s;
  const tip = 25;
  const cosA = Math.cos(tip * D2R), sinA = Math.sin(tip * D2R);
  const pt = (r, sign) => [fmt(512 + r * cosA), fmt(512 + r * sinA * sign)];
  const p1o = pt(rO, -1), p2o = pt(rO, 1), p1i = pt(rI, -1), p2i = pt(rI, 1);
  const crescent = [
    `M ${p1o[0]} ${p1o[1]}`,
    `A ${fmt(rO)} ${fmt(rO)} 0 1 0 ${p2o[0]} ${p2o[1]}`,
    `L ${p2i[0]} ${p2i[1]}`,
    `A ${fmt(rI)} ${fmt(rI)} 0 0 0 ${p1i[0]} ${p1i[1]}`,
    `Z`,
  ].join("\n    ");

  const circ = 2 * Math.PI * ringR;
  const stride = circ / 33;
  const dash = Math.round(stride * 0.62 * 10) / 10;
  const gap = Math.round((stride - dash) * 10) / 10;
  const beadW = 34 * s;
  const imamR = 44 * s;
  const imamY = fmt(512 + ringR);

  return `
    <circle cx="${cx}" cy="${cy}" r="${fmt(ringR)}" fill="none" stroke="url(#bead)" stroke-width="${fmt(beadW)}" stroke-linecap="round" stroke-dasharray="${dash} ${gap}" stroke-dashoffset="29"/>
    <path d="${crescent}" fill="url(#gold)"/>
    <circle cx="${cx}" cy="${imamY}" r="${fmt(imamR)}" fill="url(#bead)"/>
    <circle cx="${cx}" cy="${fmt(512 + ringR - imamR * 0.18)}" r="${fmt(imamR * 0.30)}" fill="${cream}" opacity="0.45"/>`;
}

const defs = `
  <defs>
    <radialGradient id="gold" cx="38%" cy="32%" r="75%">
      ${goldStops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("\n      ")}
    </radialGradient>
    <radialGradient id="bead" cx="35%" cy="30%" r="70%">
      ${beadStops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("\n      ")}
    </radialGradient>
  </defs>`;

const tileSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" rx="236" fill="${cream}"/>
  ${defs}
  ${buildArtwork(1024)}
</svg>`;

const webSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="23" fill="${cream}"/>
  ${defs}
  ${buildArtwork(100)}
</svg>`;

const bgPng = await sharp({
  create: { width: 1024, height: 1024, channels: 3, background: cream },
}).png().toBuffer();

await Promise.all([
  sharp(Buffer.from(tileSvg)).png().toFile("assets/icon-foreground.png"),
  sharp(Buffer.from(tileSvg)).png().toFile("assets/icon-only.png"),
  sharp(bgPng).toFile("assets/icon-background.png"),
  writeFileSync("public/icon.svg", webSvg),
]);

console.log("generated:", "assets/icon-foreground.png assets/icon-only.png assets/icon-background.png public/icon.svg");