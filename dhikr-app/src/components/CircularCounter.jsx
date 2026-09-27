import { useRef, useState, useEffect, useCallback, useMemo } from "react";

/**
 * CircularCounter — a large circle you tap to count.
 *
 * The strand is strung with the orb artwork itself (public/mala-orb.png),
 * colour-graded into polished wood:
 * - every bead is the same-size <image> of the orb, whether counted or not —
 *   only its finish changes as you count;
 * - counted beads read as warm polished wood catching the light; uncounted
 *   ones are the same bead in dark, unlit walnut, so the strand reads as one
 *   wooden mala warming bead by bead;
 * - no guru/imam bead: the strand is 33 equal beads and nothing else;
 * - the bead just counted flashes via a scale animation on its wrapper;
 * - count increments pulse the whole counter with an elastic micro-bounce;
 * - round-complete triggers a staggered flash through the beads plus an
 *   expanding ring shockwave;
 * - the current dhikr name floats up as a crisp chip (dark pill + white text,
 *   no blur) so tall Arabic diacritics never look cut at the top.
 */
// --- Mala geometry ------------------------------------------------------
// A 33-bead strand, drawn the way a real misbaha is strung:
// - every bead is the same size whether it has been counted or not (a real
//   strand does not grow beads), so only the *finish* changes as you count;
// - beads nearly touch, sitting on the visible cord in the small gaps;
// - the strand stops short of 12 o'clock, leaving a bare opening where the
//   cord is knotted and the tassel hangs.
const ORBIT_R = 102;              // radius the strand sits on
const BEAD_R = 7.6;               // radius of every bead, lit or not
// Cord left bare at the top, in viewBox units, converted to degrees on the orbit
// so the opening stays the same physical size on 3-bead and 33-bead strands.
const STRAND_GAP_DEG = ((30 / ORBIT_R) * 180) / Math.PI;
const STRAND_START_DEG = -90 + STRAND_GAP_DEG / 2;
const STRAND_SPAN_DEG = 360 - STRAND_GAP_DEG;

/**
 * Dash pattern for a partial circle: a dash of `spanDeg` degrees followed by a
 * gap of the remainder, so a rotated <circle> draws just that arc.
 */
const arcDash = (radius, spanDeg) => {
  const c = 2 * Math.PI * radius;
  const dash = (c * spanDeg) / 360;
  return `${dash} ${c - dash}`;
};
const HIGHLIGHT_START = 200;   // upper-left, where the light sits
const HIGHLIGHT_SPAN = 90;
const BOUNCE_START = 20;       // lower-right bounce light
const BOUNCE_SPAN = 80;

// Wood grade of the orb artwork, applied per state — rosewood & copper.
// A heavy sepia converts the molten orange artwork to wood tones, then a slight
// negative hue-rotate pulls those tones from tan toward rose/mahogany red.
// Counted beads are polished rosewood catching the light — deep, rich red-brown
// with a copper glint — while uncounted ones are the same rosewood unlit: dark
// enough to read as cold, light enough that the strand stays visible on the
// dark Kaaba wall.
const WOOD_LIT = "sepia(0.9) hue-rotate(-15deg) saturate(1.5) brightness(0.85) contrast(1.12)";
const WOOD_DIM = "sepia(0.9) hue-rotate(-10deg) saturate(0.75) brightness(0.38) contrast(1.08)";

export default function CircularCounter({ count, max, dhikrName, arabicName, pulsing, onTap, tapLabel }) {
  const [floats, setFloats] = useState([]);
  const [burst, setBurst] = useState(false);
  const [bounce, setBounce] = useState(false);
  const floatIdRef = useRef(0);
  const prevCountRef = useRef(count);

  const svgSize = 280;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const ringR = 120;        // outer ring radius
  const ringStroke = 8;     // ring thickness
  const beadOrbitR = ORBIT_R; // radius the strand of beads sits on
  const maxBeads = Math.min(max, 33); // visual bead cap (ring fits ~33 comfortably)
  // When a round needs more beads than the ring can show (max > 33), the beads
  // light proportionally so the mala keeps filling as the count climbs instead
  // of freezing with the last bead stuck highlighted. For normal rounds (≤33)
  // each tap still lights exactly one bead.
  const visibleBeads =
    max <= maxBeads
      ? Math.min(count, maxBeads)
      : Math.max(0, Math.min(maxBeads, Math.round((count / max) * maxBeads)));

  const circumference = 2 * Math.PI * ringR;
  const progress = max > 0 ? Math.min(count / max, 1) : 0;
  const dashOffset = circumference * (1 - progress);

  // Precompute bead positions once (33 entries max) — cheap, avoids layout work.
  // Beads are strung along the strand span only: the opening at 12 o'clock stays
  // bare so the knot and tassel sit in the gap, the way a real misbaha is tied.
  const beadPositions = useMemo(() => {
    const arr = [];
    for (let i = 0; i < maxBeads; i++) {
      // A one-bead strand sits centred in the span; longer strands spread to the
      // span's ends so the spacing stays even and the beads nearly touch.
      const t = maxBeads > 1 ? i / (maxBeads - 1) : 0.5;
      const angle = (STRAND_START_DEG + t * STRAND_SPAN_DEG) * (Math.PI / 180);
      arr.push({
        bx: cx + beadOrbitR * Math.cos(angle),
        by: cy + beadOrbitR * Math.sin(angle),
      });
    }
    return arr;
  }, [maxBeads]);

  // Floating text — use the Arabic word for an elegant glow when available
  const spawnFloat = useCallback(() => {
    const id = ++floatIdRef.current;
    const text = arabicName || dhikrName;
    setFloats((prev) => [...prev, { id, text }]);
    setTimeout(() => {
      setFloats((prev) => prev.filter((f) => f.id !== id));
    }, 1250);
  }, [dhikrName, arabicName]);

  // Count change → float + micro-bounce; round-complete → flash cascade.
  // Single effect so prevCountRef is compared BEFORE it advances (a second
  // effect would always see the new value and never trigger the burst).
  // When the round resets (count drops) we also cancel any in-progress burst.
  useEffect(() => {
    if (count > prevCountRef.current && count > 0) {
      spawnFloat();
      setBounce(true);
      navigator.vibrate?.(15);
      window.setTimeout(() => setBounce(false), 240);
    }
    if (max > 0 && count === max && prevCountRef.current < max) {
      setBurst(true);
      window.setTimeout(() => setBurst(false), 950);
    } else {
      setBurst(false);
    }
    prevCountRef.current = count;
  }, [count, maxBeads, max, spawnFloat]);

  // Build beads around the ring. Every bead is an instance of the orb artwork
  // (public/mala-orb.png) graded into wood. Counted beads are polished wood in
  // the light; uncounted ones are dark, unlit walnut. Both stay fully opaque —
  // a faded bead lets the cord behind it show through as a light band across
  // its face, which is not how a strung bead looks.
  const beadElements = beadPositions.map(({ bx, by }, i) => {
    const isLit = i < visibleBeads;
    const r = BEAD_R;
    return (
      <g
        key={i}
        style={{
          transformOrigin: `${bx}px ${by}px`,
          animation: burst && isLit ? `beadFlash 0.7s ease ${i * 22}ms` : "none",
        }}
      >
        {/* the orb itself, graded to wood: honey oak when counted, mid walnut
            when not. preserveAspectRatio="slice" crops the square artwork to
            the round viewport so the bead always fills its silhouette. */}
        <image
          href="/mala-orb.png"
          x={bx - r}
          y={by - r}
          width={r * 2}
          height={r * 2}
          preserveAspectRatio="xMidYMid slice"
          data-state={isLit ? "lit" : "dim"}
          style={{ filter: isLit ? WOOD_LIT : WOOD_DIM, transition: "filter 0.2s ease" }}
        />
        {/* dark mahogany rim hugging the silhouette — keeps near-touching
            beads visually separate and lifts each bead off the dark wall */}
        <circle
          cx={bx}
          cy={by}
          r={r - 0.35}
          fill="none"
          stroke="rgba(20, 8, 4, 0.7)"
          strokeWidth={0.8}
        />
        {/* copper highlight upper-left + copper bounce lower-right — the two
            arcs that make the flat disc read as a sphere catching light */}
        <circle
          cx={bx}
          cy={by}
          r={r - 1.1}
          fill="none"
          stroke={isLit ? "rgba(255, 190, 130, 0.8)" : "rgba(255, 190, 130, 0.3)"}
          strokeWidth={isLit ? 1.1 : 0.8}
          strokeLinecap="round"
          strokeDasharray={arcDash(r - 1.1, HIGHLIGHT_SPAN)}
          transform={`rotate(${HIGHLIGHT_START} ${bx} ${by})`}
        />
        <circle
          cx={bx}
          cy={by}
          r={r - 1.1}
          fill="none"
          stroke={isLit ? "rgba(255, 120, 60, 0.5)" : "rgba(255, 120, 60, 0.2)"}
          strokeWidth={0.8}
          strokeLinecap="round"
          strokeDasharray={arcDash(r - 1.1, BOUNCE_SPAN)}
          transform={`rotate(${BOUNCE_START} ${bx} ${by})`}
        />
      </g>
    );
  });

  return (
    <div
      className="relative flex items-center justify-center cursor-pointer select-none w-full max-w-[280px] aspect-square"
      style={{ WebkitTapHighlightColor: "transparent" }}
      role="button"
      tabIndex={0}
      aria-label={`${tapLabel || "Tap to count"} ${dhikrName}`}
      onClick={(e) => {
        navigator.vibrate?.(15);
        onTap();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigator.vibrate?.(15);
          onTap();
        }
      }}
    >
      <svg
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        className={`w-full h-full transition-transform duration-150 ${pulsing ? "scale-[1.03]" : ""}`}
      >
        <defs>
          {/* The cord the strand hangs on — a dim khaki thread. It shows through
              the strand's gaps so the beads read as strung, but its *rendered*
              strength stays a thread's: drawn at 0.55 opacity over the dark
              wall, below the dark walnut, so the eye never mistakes the string
              for a counted bead. */}
          <linearGradient id="threadGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#443322" />
            <stop offset="100%" stopColor="#2E2216" />
          </linearGradient>
        </defs>

        <g
          className={bounce ? "mala-bounce" : undefined}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        >
          {/* Thread cord — the strand every bead is strung on. It runs through
              the bead orbit, so it shows in the small gaps between beads and
              across the bare opening at the top where the cord is knotted. */}
          <circle
            cx={cx}
            cy={cy}
            r={beadOrbitR}
            fill="none"
            stroke="url(#threadGrad)"
            strokeWidth={3}
            opacity={0.55}
          />

          {/* Knot + short tassel in the opening at 12 o'clock, where the strand
              begins and ends — the way a real misbaha is finished off. The tassel
              hangs *inward*, into the circle, so no stray stubs poke out into
              the bare opening above the knot. */}
          <circle cx={cx} cy={cy - beadOrbitR} r={3} fill="var(--terra-dark)" />
          <line x1={cx} y1={cy - beadOrbitR + 2.5} x2={cx - 1.6} y2={cy - beadOrbitR + 9.5} stroke="var(--terra-dark)" strokeWidth={1.4} strokeLinecap="round" />
          <line x1={cx} y1={cy - beadOrbitR + 2.5} x2={cx + 1.6} y2={cy - beadOrbitR + 9.5} stroke="var(--terra-dark)" strokeWidth={1.4} strokeLinecap="round" />

          {/* Background ring */}
          <circle
            cx={cx}
            cy={cy}
            r={ringR}
            fill="none"
            stroke="var(--beige)"
            strokeWidth={ringStroke}
            opacity={0.5}
          />

          {/* Progress ring */}
          <circle
            cx={cx}
            cy={cy}
            r={ringR}
            fill="none"
            stroke="var(--terra)"
            strokeWidth={ringStroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: "stroke-dashoffset 0.35s cubic-bezier(0.4, 0, 0.2, 1)" }}
          />

          {/* Glow on progress tip */}
          {progress > 0 && (
            <circle
              cx={cx}
              cy={cy}
              r={ringR}
              fill="none"
              stroke="var(--terra)"
              strokeWidth={ringStroke + 4}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${cx} ${cy})`}
              opacity={0.15}
              style={{ transition: "stroke-dashoffset 0.35s cubic-bezier(0.4, 0, 0.2, 1)" }}
            />
          )}

          {/* Round-complete shockwave */}
          {burst && (
            <circle
              cx={cx}
              cy={cy}
              r={ringR}
              fill="none"
              stroke="#DDB05F"
              strokeWidth={3}
              style={{ transformOrigin: `${cx}px ${cy}px`, animation: "ringShock 0.8s ease-out" }}
            />
          )}

          {/* Beads around the ring */}
          {beadElements}

        </g>
      </svg>

      {/* Center content — count number */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span
          className="font-display text-5xl font-bold tabular-nums leading-none"
          style={{ color: "white" }}
        >
          {count}
        </span>
        <span className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.7)" }}>
          / {max}
        </span>
      </div>

      {/* Floating dhikr names — crisp chip that rises and fades, never blurry,
          so tall Arabic diacritics (like Alhamdulillah's upper marks) never
          look cut at the top */}
      {floats.map((f) => (
        <span
          key={f.id}
          className="absolute pointer-events-none font-arabic text-xl font-bold whitespace-nowrap rounded-full px-3.5 py-0.5 bg-black/25"
          style={{
            color: "white",
            left: "50%",
            top: "36%",
            transform: "translateX(-50%)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
            willChange: "opacity, transform",
            animation: "floatUpPrem 1.1s ease-out forwards",
          }}
        >
          {f.text}
        </span>
      ))}
    </div>
  );
}
