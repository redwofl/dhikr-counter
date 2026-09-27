import { useRef, useEffect, useState } from "react";
import { arabicBloomClass } from "../lib/text.js";

/**
 * Premium bead color palettes — each defines a full strand's visual identity.
 * Every palette carries: gradient stops (radialGradient for each bead),
 * active glow, highlight arc, shadow tint, and string/cord colour.
 */
const PALETTES = {
  rosewoodCopper: {
    name: "Rosewood & Copper",
    gradient: [
      { offset: "0%", color: "#A06848" },
      { offset: "30%", color: "#6B3A20" },
      { offset: "70%", color: "#442410" },
      { offset: "100%", color: "#221008" },
    ],
    activeGradient: [
      { offset: "0%", color: "#FFB888" },
      { offset: "25%", color: "#E09060" },
      { offset: "60%", color: "#B06838" },
      { offset: "100%", color: "#704018" },
    ],
    glowColor: "rgba(224,144,96,0.5)",
    highlightStroke: "rgba(255,184,136,0.7)",
    highlightStrokeDim: "rgba(255,184,136,0.22)",
    shadowColor: "rgba(20,5,0,0.4)",
    cordColor: "#4A2818",
    cordOpacity: 0.55,
    ringStroke: "#E09060",
    ringBg: "rgba(224,144,96,0.12)",
    textColor: "#F8E8D8",
    activeBeadStroke: "rgba(255,184,136,0.5)",
    activeBeadStrokeWidth: 1.7,
  },

  blackGold: {
    name: "Black Onyx & Gold",
    gradient: [
      { offset: "0%", color: "#5C5040" },   // warm dark center
      { offset: "35%", color: "#1A1510" },   // deep onyx
      { offset: "75%", color: "#0D0B08" },   // near black
      { offset: "100%", color: "#050403" },  // edge
    ],
    activeGradient: [
      { offset: "0%", color: "#E8D5A0" },   // bright gold core
      { offset: "25%", color: "#C79A4B" },   // rich gold
      { offset: "60%", color: "#8B6914" },   // deep gold
      { offset: "100%", color: "#4A3808" },  // shadow gold
    ],
    glowColor: "rgba(199,154,75,0.55)",
    highlightStroke: "rgba(255,220,140,0.7)",
    highlightStrokeDim: "rgba(255,220,140,0.25)",
    shadowColor: "rgba(0,0,0,0.4)",
    cordColor: "#3A3228",
    cordOpacity: 0.6,
    ringStroke: "#C79A4B",
    ringBg: "rgba(199,154,75,0.15)",
    textColor: "#F0E0C0",
    activeBeadStroke: "rgba(255,220,140,0.5)",
    activeBeadStrokeWidth: 1.8,
  },

  emeraldSilver: {
    name: "Emerald & Silver",
    gradient: [
      { offset: "0%", color: "#3D8B6E" },
      { offset: "30%", color: "#1B5E40" },
      { offset: "70%", color: "#0E3D28" },
      { offset: "100%", color: "#072218" },
    ],
    activeGradient: [
      { offset: "0%", color: "#A0F0D0" },
      { offset: "25%", color: "#50C890" },
      { offset: "60%", color: "#2A9060" },
      { offset: "100%", color: "#15503A" },
    ],
    glowColor: "rgba(80,200,144,0.5)",
    highlightStroke: "rgba(180,240,210,0.65)",
    highlightStrokeDim: "rgba(180,240,210,0.2)",
    shadowColor: "rgba(0,20,10,0.35)",
    cordColor: "#1A3A28",
    cordOpacity: 0.55,
    ringStroke: "#50C890",
    ringBg: "rgba(80,200,144,0.12)",
    textColor: "#D0F0E0",
    activeBeadStroke: "rgba(180,240,210,0.45)",
    activeBeadStrokeWidth: 1.6,
  },

  burgundyGold: {
    name: "Burgundy & Gold",
    gradient: [
      { offset: "0%", color: "#8B4050" },
      { offset: "30%", color: "#5A1A28" },
      { offset: "70%", color: "#3A0E18" },
      { offset: "100%", color: "#1E060C" },
    ],
    activeGradient: [
      { offset: "0%", color: "#F0D080" },
      { offset: "25%", color: "#D4A050" },
      { offset: "60%", color: "#A06828" },
      { offset: "100%", color: "#604010" },
    ],
    glowColor: "rgba(212,160,80,0.5)",
    highlightStroke: "rgba(240,208,128,0.7)",
    highlightStrokeDim: "rgba(240,208,128,0.22)",
    shadowColor: "rgba(40,0,10,0.35)",
    cordColor: "#3A1420",
    cordOpacity: 0.5,
    ringStroke: "#D4A050",
    ringBg: "rgba(212,160,80,0.12)",
    textColor: "#F0D8D0",
    activeBeadStroke: "rgba(240,208,128,0.5)",
    activeBeadStrokeWidth: 1.7,
  },

  ivorySandalwood: {
    name: "Ivory & Sandalwood",
    gradient: [
      { offset: "0%", color: "#D8C8A0" },
      { offset: "30%", color: "#B8A070" },
      { offset: "70%", color: "#8B7548" },
      { offset: "100%", color: "#5C4E2E" },
    ],
    activeGradient: [
      { offset: "0%", color: "#FFF8E8" },
      { offset: "25%", color: "#F0E0C0" },
      { offset: "60%", color: "#D4C090" },
      { offset: "100%", color: "#A08850" },
    ],
    glowColor: "rgba(240,224,192,0.5)",
    highlightStroke: "rgba(255,248,232,0.7)",
    highlightStrokeDim: "rgba(255,248,232,0.28)",
    shadowColor: "rgba(60,40,10,0.3)",
    cordColor: "#6B5C38",
    cordOpacity: 0.5,
    ringStroke: "#D4C090",
    ringBg: "rgba(212,192,144,0.15)",
    textColor: "#F8F0E0",
    activeBeadStroke: "rgba(255,248,232,0.55)",
    activeBeadStrokeWidth: 1.5,
  },

  navySilver: {
    name: "Navy & Silver",
    gradient: [
      { offset: "0%", color: "#3A5070" },
      { offset: "30%", color: "#1A2840" },
      { offset: "70%", color: "#0E1A2E" },
      { offset: "100%", color: "#060E18" },
    ],
    activeGradient: [
      { offset: "0%", color: "#E0F0FF" },
      { offset: "25%", color: "#A0C8E8" },
      { offset: "60%", color: "#6090C0" },
      { offset: "100%", color: "#305080" },
    ],
    glowColor: "rgba(160,200,232,0.5)",
    highlightStroke: "rgba(224,240,255,0.65)",
    highlightStrokeDim: "rgba(224,240,255,0.22)",
    shadowColor: "rgba(0,8,20,0.4)",
    cordColor: "#1A2840",
    cordOpacity: 0.5,
    ringStroke: "#A0C8E8",
    ringBg: "rgba(160,200,232,0.12)",
    textColor: "#D0E0F0",
    activeBeadStroke: "rgba(224,240,255,0.45)",
    activeBeadStrokeWidth: 1.6,
  },

  turquoiseGold: {
    name: "Turquoise & Gold",
    gradient: [
      { offset: "0%", color: "#4A8A8A" },
      { offset: "30%", color: "#1A6060" },
      { offset: "70%", color: "#0E4040" },
      { offset: "100%", color: "#062828" },
    ],
    activeGradient: [
      { offset: "0%", color: "#F0D880" },
      { offset: "25%", color: "#D4B850" },
      { offset: "60%", color: "#A89030" },
      { offset: "100%", color: "#706018" },
    ],
    glowColor: "rgba(212,184,80,0.5)",
    highlightStroke: "rgba(240,216,128,0.7)",
    highlightStrokeDim: "rgba(240,216,128,0.22)",
    shadowColor: "rgba(0,20,20,0.4)",
    cordColor: "#1A4040",
    cordOpacity: 0.5,
    ringStroke: "#D4B850",
    ringBg: "rgba(212,184,80,0.12)",
    textColor: "#D8F0E8",
    activeBeadStroke: "rgba(240,216,128,0.5)",
    activeBeadStrokeWidth: 1.7,
  },

  purpleSilver: {
    name: "Purple & Silver",
    gradient: [
      { offset: "0%", color: "#6A4A7A" },
      { offset: "30%", color: "#3A2050" },
      { offset: "70%", color: "#241038" },
      { offset: "100%", color: "#120820" },
    ],
    activeGradient: [
      { offset: "0%", color: "#E0D8F0" },
      { offset: "25%", color: "#B8A8D8" },
      { offset: "60%", color: "#8870B0" },
      { offset: "100%", color: "#504080" },
    ],
    glowColor: "rgba(184,168,216,0.5)",
    highlightStroke: "rgba(224,216,240,0.65)",
    highlightStrokeDim: "rgba(224,216,240,0.22)",
    shadowColor: "rgba(10,0,20,0.4)",
    cordColor: "#2A1840",
    cordOpacity: 0.5,
    ringStroke: "#B8A8D8",
    ringBg: "rgba(184,168,216,0.12)",
    textColor: "#E0D8F0",
    activeBeadStroke: "rgba(224,216,240,0.45)",
    activeBeadStrokeWidth: 1.6,
  },

  rubySilver: {
    name: "Ruby & Silver",
    gradient: [
      { offset: "0%", color: "#8A3040" },
      { offset: "30%", color: "#5A1020" },
      { offset: "70%", color: "#3A0810" },
      { offset: "100%", color: "#1E0408" },
    ],
    activeGradient: [
      { offset: "0%", color: "#F0D0D8" },
      { offset: "25%", color: "#E098A8" },
      { offset: "60%", color: "#C06078" },
      { offset: "100%", color: "#803048" },
    ],
    glowColor: "rgba(224,152,168,0.5)",
    highlightStroke: "rgba(240,208,216,0.7)",
    highlightStrokeDim: "rgba(240,208,216,0.22)",
    shadowColor: "rgba(30,0,8,0.4)",
    cordColor: "#3A1020",
    cordOpacity: 0.5,
    ringStroke: "#E098A8",
    ringBg: "rgba(224,152,168,0.12)",
    textColor: "#F0D8E0",
    activeBeadStroke: "rgba(240,208,216,0.5)",
    activeBeadStrokeWidth: 1.7,
  },

  obsidianPlatinum: {
    name: "Obsidian & Platinum",
    gradient: [
      { offset: "0%", color: "#4A4A50" },
      { offset: "30%", color: "#1A1A20" },
      { offset: "70%", color: "#0E0E12" },
      { offset: "100%", color: "#060608" },
    ],
    activeGradient: [
      { offset: "0%", color: "#F0F0F4" },
      { offset: "25%", color: "#D0D0D8" },
      { offset: "60%", color: "#A0A0B0" },
      { offset: "100%", color: "#606070" },
    ],
    glowColor: "rgba(208,208,216,0.5)",
    highlightStroke: "rgba(240,240,244,0.7)",
    highlightStrokeDim: "rgba(240,240,244,0.22)",
    shadowColor: "rgba(0,0,5,0.45)",
    cordColor: "#1A1A20",
    cordOpacity: 0.5,
    ringStroke: "#D0D0D8",
    ringBg: "rgba(208,208,216,0.12)",
    textColor: "#E8E8F0",
    activeBeadStroke: "rgba(240,240,244,0.5)",
    activeBeadStrokeWidth: 1.6,
  },

  amberHoney: {
    name: "Amber & Honey",
    gradient: [
      { offset: "0%", color: "#B89040" },
      { offset: "30%", color: "#8A6820" },
      { offset: "70%", color: "#604810" },
      { offset: "100%", color: "#382808" },
    ],
    activeGradient: [
      { offset: "0%", color: "#FFF0C0" },
      { offset: "25%", color: "#F0D880" },
      { offset: "60%", color: "#D0B050" },
      { offset: "100%", color: "#908030" },
    ],
    glowColor: "rgba(240,216,128,0.5)",
    highlightStroke: "rgba(255,240,192,0.7)",
    highlightStrokeDim: "rgba(255,240,192,0.25)",
    shadowColor: "rgba(40,20,0,0.35)",
    cordColor: "#6A5020",
    cordOpacity: 0.5,
    ringStroke: "#F0D880",
    ringBg: "rgba(240,216,128,0.12)",
    textColor: "#FFF8E0",
    activeBeadStroke: "rgba(255,240,192,0.55)",
    activeBeadStrokeWidth: 1.6,
  },

  jadeGold: {
    name: "Jade & Gold",
    gradient: [
      { offset: "0%", color: "#4A7A50" },
      { offset: "30%", color: "#2A5A30" },
      { offset: "70%", color: "#183820" },
      { offset: "100%", color: "#0C2010" },
    ],
    activeGradient: [
      { offset: "0%", color: "#F0E080" },
      { offset: "25%", color: "#D4C050" },
      { offset: "60%", color: "#A89830" },
      { offset: "100%", color: "#706818" },
    ],
    glowColor: "rgba(212,192,80,0.5)",
    highlightStroke: "rgba(240,224,128,0.65)",
    highlightStrokeDim: "rgba(240,224,128,0.22)",
    shadowColor: "rgba(0,20,5,0.4)",
    cordColor: "#1A3820",
    cordOpacity: 0.5,
    ringStroke: "#D4C050",
    ringBg: "rgba(212,192,80,0.12)",
    textColor: "#D8F0D0",
    activeBeadStroke: "rgba(240,224,128,0.45)",
    activeBeadStrokeWidth: 1.6,
  },

  copperMidnight: {
    name: "Copper & Midnight",
    gradient: [
      { offset: "0%", color: "#7A5030" },
      { offset: "30%", color: "#4A3018" },
      { offset: "70%", color: "#2A1A0C" },
      { offset: "100%", color: "#140C04" },
    ],
    activeGradient: [
      { offset: "0%", color: "#F0C8A0" },
      { offset: "25%", color: "#E0A878" },
      { offset: "60%", color: "#C08050" },
      { offset: "100%", color: "#805030" },
    ],
    glowColor: "rgba(224,168,120,0.5)",
    highlightStroke: "rgba(240,200,160,0.7)",
    highlightStrokeDim: "rgba(240,200,160,0.22)",
    shadowColor: "rgba(10,5,0,0.4)",
    cordColor: "#2A1A0C",
    cordOpacity: 0.5,
    ringStroke: "#E0A878",
    ringBg: "rgba(224,168,120,0.12)",
    textColor: "#F0E0D0",
    activeBeadStroke: "rgba(240,200,160,0.5)",
    activeBeadStrokeWidth: 1.7,
  },

  islamicGreen: {
    name: "Islamic Green & Gold",
    gradient: [
      { offset: "0%", color: "#1A5C38" },
      { offset: "30%", color: "#0E3A22" },
      { offset: "70%", color: "#082818" },
      { offset: "100%", color: "#041A0E" },
    ],
    activeGradient: [
      { offset: "0%", color: "#C8A848" },
      { offset: "25%", color: "#A08830" },
      { offset: "60%", color: "#786820" },
      { offset: "100%", color: "#504810" },
    ],
    glowColor: "rgba(160,136,48,0.5)",
    highlightStroke: "rgba(200,168,72,0.7)",
    highlightStrokeDim: "rgba(200,168,72,0.22)",
    shadowColor: "rgba(0,10,5,0.4)",
    cordColor: "#0E3A22",
    cordOpacity: 0.5,
    ringStroke: "#C8A848",
    ringBg: "rgba(200,168,72,0.12)",
    textColor: "#D0E8C8",
    activeBeadStroke: "rgba(200,168,72,0.5)",
    activeBeadStrokeWidth: 1.7,
  },

  darkGreen: {
    name: "Dark Green & Silver",
    gradient: [
      { offset: "0%", color: "#173F2B" },
      { offset: "30%", color: "#0B2A1C" },
      { offset: "70%", color: "#061E13" },
      { offset: "100%", color: "#03140B" },
    ],
    activeGradient: [
      { offset: "0%", color: "#9DE8B9" },
      { offset: "25%", color: "#55C87F" },
      { offset: "60%", color: "#2CA355" },
      { offset: "100%", color: "#177A37" },
    ],
    glowColor: "rgba(85,200,127,0.5)",
    highlightStroke: "rgba(157,232,185,0.7)",
    highlightStrokeDim: "rgba(157,232,185,0.22)",
    shadowColor: "rgba(0,12,6,0.4)",
    cordColor: "#0A271A",
    cordOpacity: 0.5,
    ringStroke: "#55C87F",
    ringBg: "rgba(85,200,127,0.12)",
    textColor: "#DDF4E6",
    activeBeadStroke: "rgba(157,232,185,0.5)",
    activeBeadStrokeWidth: 1.6,
  },

  // Multi-color strand — one hue per bead, generated per bead by rainbowStops
  // (gradient arrays intentionally empty: they're unused when perBeadHue is set).
  rainbow: {
    name: "Rainbow Multi",
    perBeadHue: true,
    gradient: [],
    activeGradient: [],
    glowColor: "rgba(255,255,255,0.45)",
    highlightStroke: "rgba(255,255,255,0.7)",
    highlightStrokeDim: "rgba(255,255,255,0.25)",
    shadowColor: "rgba(0,0,0,0.4)",
    cordColor: "#4A3A50",
    cordOpacity: 0.5,
    ringStroke: "#FFFFFF",
    ringBg: "rgba(255,255,255,0.12)",
    textColor: "#FFFFFF",
    activeBeadStroke: "rgba(255,255,255,0.55)",
    activeBeadStrokeWidth: 1.6,
  },
};

// Beads drawn on the strand. Fewer beads than the classic 33 leaves a visible
// gap between neighbours now that each bead is larger; counting is unaffected
// because the lit fraction still tracks count/max (see visibleBeads below).
const BEAD_COUNT = 28;
const SVG_SIZE = 280;
const CX = SVG_SIZE / 2;
const CY = SVG_SIZE / 2;
const ORBIT_R = 100;
const BEAD_R = 9;
const RING_R = 120;
const START_DEG = -90;
const SPAN_DEG = 360;

// Lit beads are dialled back slightly so counted beads read as warm material
// rather than neon. This one knob dims the whole strand's lit fill (both the
// fixed palettes and the per-bead rainbow strand) without touching the rest of
// each palette's identity. Lower = calmer; 1 = the original full brightness.
const LIT_BEAD_BRIGHTNESS = 0.72;

/** Darken a #rrggbb or hsl() colour by `factor` (0–1) — used to mute lit beads. */
function dimColor(color, factor) {
  const hex = /^#([0-9a-f]{6})$/i.exec(color);
  if (hex) {
    const n = parseInt(hex[1], 16);
    const r = Math.round(((n >> 16) & 255) * factor);
    const g = Math.round(((n >> 8) & 255) * factor);
    const b = Math.round((n & 255) * factor);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
  }
  const hsl = /^hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)$/i.exec(color);
  if (hsl) {
    const l = Math.max(0, Math.round(parseFloat(hsl[3]) * factor));
    return `hsl(${hsl[1]}, ${hsl[2]}%, ${l}%)`;
  }
  return color;
}

/**
 * Multi-color ("Rainbow") strand: every bead gets its own hue. Lit beads are
 * vivid and glossy in that hue; uncounted ones are the same hue desaturated
 * and darkened, so the strand still reads as one mala warming bead by bead —
 * just in many colors instead of one. Spread red→violet across the strand.
 */
const rainbowStops = (index, isLit) => {
  const hue = Math.round((index / (BEAD_COUNT - 1)) * 330);
  const sat = isLit ? 78 : 30;
  // Lit rainbow beads share the same slight dimming as the fixed palettes.
  const light = (isLit ? 56 : 32) * (isLit ? LIT_BEAD_BRIGHTNESS : 1);
  return [
    { offset: "0%", color: `hsl(${hue}, ${Math.min(sat + 12, 100)}%, ${light + 16}%)` },
    { offset: "35%", color: `hsl(${hue}, ${sat}%, ${light}%)` },
    { offset: "75%", color: `hsl(${hue}, ${sat}%, ${light - 12}%)` },
    { offset: "100%", color: `hsl(${hue}, ${sat}%, ${light - 20}%)` },
  ];
};

export default function TasbihBeads({
  count = 0,
  max = 33,
  pulsing = false,
  onTap,
  tapLabel,
  palette = "rosewoodCopper",
  arabicName = "",
}) {
  const [bounceIdx, setBounceIdx] = useState(-1);
  const [floats, setFloats] = useState([]);
  const [ringBurst, setRingBurst] = useState(false);
  const floatIdRef = useRef(0);
  const prevCountRef = useRef(count);

  const colors = PALETTES[palette] || PALETTES.rosewoodCopper;
  const visibleBeads =
    max <= BEAD_COUNT
      ? Math.min(count, BEAD_COUNT)
      : Math.max(0, Math.min(BEAD_COUNT, Math.round((count / max) * BEAD_COUNT)));
  const progress = max > 0 ? Math.min(count / max, 1) : 0;
  const circumference = 2 * Math.PI * RING_R;

  // Bead positions — strung evenly around the orbit. Stepping by 1/BEAD_COUNT
  // (rather than 1/(BEAD_COUNT-1)) keeps the first and last beads distinct and
  // leaves a single clean gap at the top instead of two beads overlapping.
  const beadPositions = [];
  for (let i = 0; i < BEAD_COUNT; i++) {
    const t = BEAD_COUNT > 0 ? i / BEAD_COUNT : 0.5;
    const angle = ((START_DEG + t * SPAN_DEG) * Math.PI) / 180;
    beadPositions.push({
      x: CX + ORBIT_R * Math.cos(angle),
      y: CY + ORBIT_R * Math.sin(angle),
    });
  }

  // Animate on count change
  useEffect(() => {
    if (count > prevCountRef.current && count > 0) {
      // Bounce the newly-lit bead
      const idx = visibleBeads - 1;
      if (idx >= 0) {
        setBounceIdx(idx);
        setTimeout(() => setBounceIdx(-1), 320);
      }

      // Floating dhikr text
      const id = ++floatIdRef.current;
      setFloats((prev) => [...prev, { id }]);
      setTimeout(() => setFloats((prev) => prev.filter((f) => f.id !== id)), 1100);
    }
    // Round complete → ring burst
    if (max > 0 && count >= max && prevCountRef.current < max) {
      setRingBurst(true);
      setTimeout(() => setRingBurst(false), 900);
    } else if (count < max) {
      setRingBurst(false);
    }
    prevCountRef.current = count;
  }, [count, max, visibleBeads]);

  // Arc dash helper
  const arcDash = (r, spanDeg) => {
    const c = 2 * Math.PI * r;
    const d = (c * spanDeg) / 360;
    return `${d} ${c - d}`;
  };

  return (
    <div
      className={`relative flex items-center justify-center w-full max-w-[280px] aspect-square ${
        onTap ? "cursor-pointer select-none" : ""
      }`}
      style={{ WebkitTapHighlightColor: "transparent" }}
      role={onTap ? "button" : undefined}
      tabIndex={onTap ? 0 : undefined}
      aria-label={onTap ? tapLabel || "Tap beads to count" : undefined}
      onClick={onTap}
      onKeyDown={
        onTap
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onTap();
              }
            }
          : undefined
      }
    >
      <svg
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        className={`w-full h-full transition-transform duration-150 ${
          pulsing ? "scale-[1.03]" : ""
        }`}
      >
        <defs>
          {/* Per-bead radial gradients */}
          {beadPositions.map((_, i) => {
            const isLit = i < visibleBeads;
            const stops = colors.perBeadHue
              ? rainbowStops(i, isLit)
              : isLit
              ? colors.activeGradient.map((s) => ({
                  ...s,
                  color: dimColor(s.color, LIT_BEAD_BRIGHTNESS),
                }))
              : colors.gradient;
            return (
              <radialGradient
                key={`bg-${i}`}
                id={`beadGrad-${i}`}
                cx="35%"
                cy="30%"
                r="65%"
              >
                {stops.map((s, si) => (
                  <stop key={si} offset={s.offset} stopColor={s.color} />
                ))}
              </radialGradient>
            );
          })}
          {/* Thread gradient */}
          <linearGradient id="cordGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={colors.cordColor} />
            <stop offset="100%" stopColor={colors.cordColor} stopOpacity="0.7" />
          </linearGradient>
        </defs>

        <g
          className={pulsing ? "mala-bounce" : undefined}
          style={{ transformOrigin: `${CX}px ${CY}px` }}
        >


          {/* Background progress ring */}
          <circle
            cx={CX}
            cy={CY}
            r={RING_R}
            fill="none"
            stroke="rgba(255,255,255,0.28)"
            strokeWidth={5}
          />

          {/* Active progress ring */}
          <circle
            cx={CX}
            cy={CY}
            r={RING_R}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            transform={`rotate(-90 ${CX} ${CY})`}
            style={{
              transition: "stroke-dashoffset 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />

          {/* Round-complete ring burst */}
          {ringBurst && (
            <circle
              cx={CX}
              cy={CY}
              r={RING_R}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={3}
              style={{
                transformOrigin: `${CX}px ${CY}px`,
                animation: "ringShock 0.8s ease-out",
              }}
            />
          )}

          {/* Beads */}
          {beadPositions.map(({ x, y }, i) => {
            const isLit = i < visibleBeads;
            const isBouncing = i === bounceIdx;
            const r = BEAD_R;

            // Shadow offset when lit (lift effect)
            const shadowDy = isLit ? 2 : 4;
            const shadowOpacity = isLit ? 0.5 : 0.25;

            return (
              <g
                key={i}
                style={{
                  transformOrigin: `${x}px ${y}px`,
                  animation: isBouncing
                    ? "beadFlash 0.32s cubic-bezier(0.34,1.56,0.64,1)"
                    : ringBurst && isLit
                    ? `beadFlash 0.7s ease ${i * 20}ms`
                    : "none",
                }}
              >
                {/* Shadow */}
                <ellipse
                  cx={x}
                  cy={y + r + shadowDy}
                  rx={r * 0.65}
                  ry={2.5}
                  fill={colors.shadowColor}
                  opacity={shadowOpacity}
                  style={{ transition: "all 0.25s ease-out" }}
                />

                {/* Bead sphere */}
                <circle
                  cx={x}
                  cy={y}
                  r={r}
                  fill={`url(#beadGrad-${i})`}
                  stroke={isLit ? colors.activeBeadStroke : "rgba(255,255,255,0.08)"}
                  strokeWidth={isLit ? colors.activeBeadStrokeWidth : 0.4}
                  style={{ transition: "all 0.22s ease" }}
                />

                {/* Upper-left highlight arc — the "catch light" */}
                <circle
                  cx={x}
                  cy={y}
                  r={r - 1.2}
                  fill="none"
                  stroke={isLit ? colors.highlightStroke : colors.highlightStrokeDim}
                  strokeWidth={isLit ? 1.2 : 0.7}
                  strokeLinecap="round"
                  strokeDasharray={arcDash(r - 1.2, 90)}
                  transform={`rotate(210 ${x} ${y})`}
                  style={{ transition: "stroke 0.2s ease" }}
                />

                {/* Lower-right bounce light — depth */}
                <circle
                  cx={x}
                  cy={y}
                  r={r - 1.2}
                  fill="none"
                  stroke={isLit ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.05)"}
                  strokeWidth={0.7}
                  strokeLinecap="round"
                  strokeDasharray={arcDash(r - 1.2, 70)}
                  transform={`rotate(30 ${x} ${y})`}
                  style={{ transition: "stroke 0.2s ease" }}
                />

                {/* Tiny specular dot — top-left */}
                <circle
                  cx={x - r * 0.28}
                  cy={y - r * 0.28}
                  r={r * 0.15}
                  fill={isLit ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.12)"}
                  style={{ transition: "fill 0.2s ease" }}
                />
              </g>
            );
          })}
        </g>
      </svg>

      {/* Center count */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span
          className="font-display text-5xl font-bold tabular-nums leading-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
          style={{ color: colors.textColor }}
        >
          {count}
        </span>
        <span
          className="text-sm mt-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]"
          style={{ color: colors.textColor, opacity: 0.65 }}
        >
          / {max}
        </span>
      </div>

      {/* Arabic dhikr bloom — the word springs in above the count,
          holds crisp, then drifts up and dissolves. Anchored to the upper half
          so it never collides with the count digits; generous line-height keeps
          tall Arabic diacritics from looking cut at the top. */}
      {floats.map((f) => (
        <span
          key={f.id}
          className={`absolute pointer-events-none font-arabic ${arabicBloomClass(arabicName || String(count))} font-bold leading-normal px-2 break-words`}
          style={{
            // Strictly white for every palette — no per-palette tint, no glow
            // or drop shadow behind the word.
            color: "#FFFFFF",
            left: "50%",
            top: "36%",
            willChange: "opacity, transform",
            animation: "arabicBloom 1.25s cubic-bezier(0.34,1.56,0.64,1) forwards",
            zIndex: 5,
          }}
        >
          {arabicName || count}
        </span>
      ))}
    </div>
  );
}

export { PALETTES };
