import { useMemo } from "react";

const COLORS = ["#C1723C", "#C79A4B", "#3F7D58", "#4A7BA6", "#7C5E9E", "#C15B5B"];

/**
 * Confetti — lightweight celebration particles, pure CSS animation.
 * Rendered once when the dhikr session is completed.
 */
export default function Confetti({ count = 60 }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 1.2,
        duration: 2.4 + Math.random() * 1.8,
        size: 6 + Math.random() * 7,
        color: COLORS[i % COLORS.length],
        radius: Math.random() > 0.5 ? "50%" : "2px"
      })),
    [count]
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-0"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * (p.radius === "50%" ? 1 : 0.5),
            backgroundColor: p.color,
            borderRadius: p.radius,
            animation: `confettiFall ${p.duration}s linear ${p.delay}s forwards`
          }}
        />
      ))}
    </div>
  );
}