// Temporary harness: dump the real rendered SVG for inspection, with the orb art
// inlined as a data URI so a rasteriser can draw it offline.
import { describe, it } from "vitest";
import { render } from "@testing-library/react";
import { writeFileSync, readFileSync } from "node:fs";
import CircularCounter from "../CircularCounter.jsx";

const base = {
  dhikrName: "Subhan Allah",
  arabicName: "سُبْحَانَ",
  pulsing: false,
  onTap: () => {},
};

const dump = (count, max, file) => {
  const { container } = render(<CircularCounter {...base} count={count} max={max} />);
  const svg = [...container.querySelectorAll("svg")].sort(
    (a, b) => b.querySelectorAll("image").length - a.querySelectorAll("image").length
  )[0];
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  const orb = readFileSync("public/mala-orb.png").toString("base64");
  const html = svg.outerHTML.replace(/href="\/mala-orb\.png"/g, `href="data:image/png;base64,${orb}"`);
  writeFileSync(file, html);
};

describe("bead material preview", () => {
  it("dumps the counter at rest, mid-round and full", () => {
    dump(0, 33, "tmp-beads-00.svg");
    dump(16, 33, "tmp-beads-16.svg");
    dump(33, 33, "tmp-beads-33.svg");
  });
});
