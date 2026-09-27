import sharp from "sharp";
import { existsSync } from "fs";

/**
 * Contact sheet of every background, oldest -> newest, in the order the
 * designs were actually made. Individual full-size frames are kept alongside
 * as ../bg_tour_01.png .. ../bg_tour_11.png.
 */
const ORDER = [
  ["01", "counter-bg.jpg", "Sep 13 20:28"],
  ["02", "counter-bg-full.png", "Sep 13 20:50"],
  ["03", "counter-bg-solid.png", "Sep 13 22:21"],
  ["04", "counter-bg-atmospheric.png", "Sep 13 22:53"],
  ["05", "counter-bg-cinema.png", "Sep 13 23:01"],
  ["06", "counter-bg-artwork.png", "Sep 14 00:01"],
  ["07", "counter-bg-editorial.png", "Sep 14 00:07"],
  ["08", "counter-bg-calligraphy.png", "Sep 14 00:10"],
  ["09", "counter-bg-custom.png", "Sep 15 00:03"],
  ["10", "counter-bg-custom.webp", "Sep 26 19:17"],
  ["11", "kaaba original", "shipped"],
];

const PW = 230; // panel width
const PH = Math.round((PW * 2424) / 1080);
const GAP = 10;
const LABEL = 40;
const PAD = 14;

const W = PAD * 2 + ORDER.length * PW + (ORDER.length - 1) * GAP;
const H = PAD * 2 + LABEL + PH + 26;

const missing = ORDER.filter(([n]) => !existsSync(`../bg_tour_${n}.png`));
if (missing.length) console.log("WARNING missing:", missing.map((m) => m[0]).join(", "));

const comps = [];
for (let i = 0; i < ORDER.length; i++) {
  const [n, name, date] = ORDER[i];
  const x = PAD + i * (PW + GAP);
  const panel = await sharp(`../bg_tour_${n}.png`)
    .resize(PW, PH, { fit: "cover" })
    .png()
    .toBuffer();
  comps.push({ input: panel, left: x, top: PAD + LABEL });
  comps.push({
    input: Buffer.from(
      `<svg width="${PW}" height="${LABEL}">
         <text x="0" y="15" font-family="sans-serif" font-size="15" font-weight="bold" fill="#f5c518">#${n}</text>
         <text x="0" y="31" font-family="sans-serif" font-size="10.5" fill="#bbb">${name.replace(/</g, "&lt;")}</text>
         <text x="${PW}" y="31" text-anchor="end" font-family="sans-serif" font-size="9.5" fill="#888">${date}</text>
       </svg>`
    ),
    left: x,
    top: PAD,
  });
}

const header = Buffer.from(
  `<svg width="${W}" height="${H}">
     <text x="${PAD}" y="${H - 8}" font-family="sans-serif" font-size="13" fill="#999">
       backgrounds, oldest to newest  ·  brown/grain veil removed  ·  1080x2424  ·  #11 is the kaaba original
     </text>
   </svg>`
);

await sharp({
  create: { width: W, height: H, channels: 3, background: "#15120f" },
})
  .composite([...comps, { input: header, left: 0, top: 0 }])
  .png()
  .toFile("../bg_ALL_contact_sheet.png");

console.log(`wrote ../bg_ALL_contact_sheet.png  (${W}x${H}, ${ORDER.length} panels)`);
