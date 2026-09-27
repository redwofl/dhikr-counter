import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import CircularCounter from "../CircularCounter.jsx";

const base = {
  dhikrName: "Subhan Allah",
  arabicName: "سُبْحَانَ",
  pulsing: false,
  onTap: () => {},
};

const svgOf = (container) =>
  [...container.querySelectorAll("svg")].sort(
    (a, b) => b.querySelectorAll("image").length - a.querySelectorAll("image").length
  )[0];

// Beads are the only <image> elements on the counter — the orb artwork,
// one per strand bead and nothing else (no guru/imam bead).
const beadImages = (svg) => [...svg.querySelectorAll("image")];
const litBodies = (svg) => beadImages(svg).filter((c) => c.getAttribute("data-state") === "lit");
const dimBodies = (svg) => beadImages(svg).filter((c) => c.getAttribute("data-state") === "dim");

// Read a gradient's stops straight out of <defs> so the palette itself can
// be asserted, not just the presence of a gradient.
const gradientStops = (svg, id) =>
  [...svg.querySelector(`#${id}`).querySelectorAll("stop")].map((s) => s.getAttribute("stop-color"));
const relLum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

describe("CircularCounter mala design", () => {
  it("renders the thread cord, knot and tassel, with no guru/imam bead", () => {
    const { container } = render(<CircularCounter {...base} count={0} max={33} />);
    const svg = svgOf(container);
    const circles = svg.querySelectorAll("circle");

    const thread = [...circles].find((c) => c.getAttribute("stroke") === "url(#threadGrad)");
    const knot = [...circles].find((c) => c.getAttribute("r") === "3");
    const tassel = svg.querySelectorAll("line").length;

    expect(thread).toBeTruthy();
    expect(knot).toBeTruthy();
    expect(tassel).toBeGreaterThanOrEqual(2);

    // the cord is a thread, not a lit flow: it renders below full opacity so
    // the eye never mistakes the string for a counted bead
    expect(Number(thread.getAttribute("opacity"))).toBeLessThan(1);

    // the strand is 33 equal beads and nothing else: no oversized guru bead
    const widths = new Set(beadImages(svg).map((c) => c.getAttribute("width")));
    expect(widths).toEqual(new Set(["15.2"]));
    // strand beads never scale: the material change is the only signal,
    // so no old bead can pop/shrink when a new one is counted
    const scaled = [...svg.querySelectorAll("g")].filter((g) => (g.style.transform || "").includes("scale"));
    expect(scaled).toHaveLength(0);
  });

  it("ignites the counted beads and leaves the rest banked embers", () => {
    const { container } = render(<CircularCounter {...base} count={5} max={33} />);
    const svg = svgOf(container);
    // 5 beads counted out of the full 33
    expect(litBodies(svg)).toHaveLength(5);
    expect(dimBodies(svg)).toHaveLength(28);
    // and no bead carries any other state: no guru/imam bead remains
    expect(beadImages(svg)).toHaveLength(33);

    // the counted beads are the polished-wood grade; the cold ones must not
    // share it, or the strand turns into one flat colour and the part you have
    // counted stops standing out
    const litBright = litBodies(svg).map((c) => Number(/brightness\(([\d.]+)\)/.exec(c.style.filter)[1]));
    const dimBright = dimBodies(svg).map((c) => Number(/brightness\(([\d.]+)\)/.exec(c.style.filter)[1]));
    expect(Math.min(...litBright)).toBeGreaterThan(Math.max(...dimBright));

    // every bead is the orb artwork itself
    expect(beadImages(svg).every((c) => (c.getAttribute("href") || "").includes("mala-orb.png"))).toBe(true);
  });

  it("banks the uncounted beads into dark walnut, never out", () => {
    const { container } = render(<CircularCounter {...base} count={5} max={33} />);
    const svg = svgOf(container);
    // uncounted beads are graded dark via a brightness filter (kept opaque),
    // not faded — a faded bead lets the cord behind it show through as a light
    // band across its face
    dimBodies(svg).forEach((c) => {
      const f = c.style.filter || "";
      expect(f).toContain("brightness");
      const m = /brightness\(([\d.]+)\)/.exec(f);
      expect(Number(m[1])).toBeLessThan(0.75);
      expect(f).toContain("sepia");
    });
    // counted beads carry the polished grade: warm and bright, never the dark
    // walnut grade and never a molten glow
    litBodies(svg).forEach((c) => {
      const f = c.style.filter || "";
      const m = /brightness\(([\d.]+)\)/.exec(f);
      expect(Number(m[1])).toBeGreaterThan(0.75);
      expect(f).toContain("sepia");
    });
  });

  it("draws every bead as the same-sized opaque orb, counted or not", () => {
    const { container } = render(<CircularCounter {...base} count={5} max={33} />);
    const svg = svgOf(container);
    const bodies = beadImages(svg);

    // one orb per bead, and all the same size: a real strand does not grow the
    // beads you have already counted, only their state changes
    expect(bodies).toHaveLength(33);
    expect(new Set(bodies.map((c) => c.getAttribute("width")))).toEqual(new Set(["15.2"]));

    // fully opaque — a faded bead lets the cord behind it show through as a
    // light band across its face, which is not how a strung bead looks
    const beadGroups = [...svg.querySelectorAll("g")].filter((g) =>
      [...g.children].some((c) => c.tagName?.toLowerCase() === "image")
    );
    expect(beadGroups.every((g) => !(g.style.opacity && Number(g.style.opacity) < 1))).toBe(true);
  });

  it("lights beads proportionally when the round exceeds the visual cap (max > 33)", () => {
    const { container, rerender } = render(<CircularCounter {...base} count={50} max={100} />);
    const svg = svgOf(container);
    // 50/100 * 33 ≈ 17 (rounded up); at the end every bead lights
    expect(litBodies(svg)).toHaveLength(17);

    rerender(<CircularCounter {...base} count={100} max={100} />);
    const svgFull = svgOf(container);
    expect(litBodies(svgFull)).toHaveLength(33);
    expect(dimBodies(svgFull)).toHaveLength(0);
  });

  it("fires the flash burst + shockwave exactly when the count reaches max", () => {
    const { container, rerender } = render(<CircularCounter {...base} count={32} max={33} />);
    const svgBefore = svgOf(container);
    expect([...svgBefore.querySelectorAll("circle")].filter((c) => c.style.animation && c.style.animation.includes("ringShock"))).toHaveLength(0);

    rerender(<CircularCounter {...base} count={33} max={33} />);

    const svg = svgOf(container);
    const flashes = [...svg.querySelectorAll("g")].filter(
      (g) => g.style.animation && g.style.animation.includes("beadFlash")
    );
    const shock = [...svg.querySelectorAll("circle")].filter(
      (c) => c.style.animation && c.style.animation.includes("ringShock")
    );

    expect(flashes.length).toBe(33); // the whole mala flashes in cascade
    expect(shock).toHaveLength(1);
  });

  it("does not re-burst on a later render below max", () => {
    const { container, rerender } = render(<CircularCounter {...base} count={33} max={33} />);
    rerender(<CircularCounter {...base} count={0} max={33} />);
    rerender(<CircularCounter {...base} count={0} max={33} />);
    const svg = svgOf(container);
    const shock = [...svg.querySelectorAll("circle")].filter(
      (c) => c.style.animation && c.style.animation.includes("ringShock")
    );
    expect(shock).toHaveLength(0);
  });

  it("leaves the strand open at 12 o'clock for the knot and tassel", () => {
    const { container } = render(<CircularCounter {...base} count={0} max={33} />);
    const svg = svgOf(container);
    const [, , width] = svg.getAttribute("viewBox").split(" ").map(Number);

    // the cord runs through the bead orbit, so it shows in the opening at the
    // top and in the small gaps between beads
    const cord = [...svg.querySelectorAll("circle")].find((c) => c.getAttribute("stroke") === "url(#threadGrad)");
    expect(cord).toBeTruthy();
    const orbitR = Number(cord.getAttribute("r"));
    expect(orbitR).toBe(102);

    // ...and no bead straddles the top of that orbit, because that opening is
    // where the cord is knotted and the tassel hangs
    const knot = { x: width / 2, y: Number(cord.getAttribute("cy")) - orbitR };
    const nearest = Math.min(
      ...beadImages(svg).map((c) =>
        Math.hypot(Number(c.getAttribute("x")) + 7.6 - knot.x, Number(c.getAttribute("y")) + 7.6 - knot.y)
      )
    );
    expect(nearest).toBeGreaterThan(10);
  });

  it("renders the beads as the orb artwork, one per strand bead", () => {
    const { container } = render(<CircularCounter {...base} count={0} max={33} />);
    const svg = svgOf(container);

    const images = beadImages(svg);
    expect(images).toHaveLength(33);
    expect(images.every((c) => (c.getAttribute("href") || "").includes("mala-orb.png"))).toBe(true);
    // every orb is cropped to its round silhouette, edge to edge
    expect(images.every((c) => (c.getAttribute("preserveAspectRatio") || "").includes("slice"))).toBe(true);
  });
});
