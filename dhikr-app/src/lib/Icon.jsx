const paths = {
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 11v6 M12 7.5h.01",
  reset: "M3 12a9 9 0 1 0 3-6.7 M3 4v5h5",
  timer: "M12 8v4l2.5 2.5 M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM9 2h6",
  settings:
    "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.14.36.4.68.75.86.24.13.5.2.77.2H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  check: "M20 6 9 17l-5-5",
  edit: "M12 20h9 M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z",
  trash: "M3 6h18 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z",
  chevronRight: "m9 18 6-6-6-6",
  moon: "M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  monitor: "M4 5h16v10H4z M9 19h6 M12 16v3",
  volume: "M11 5 6 9H2v6h4l5 4V5Z M15.5 8.5a5 5 0 0 1 0 7",
  vibrate: "M8 4 4 8v8l4 4 M16 4l4 4v8l-4 4 M12 8v8 M11 11h2v2h-2z",
  x: "M18 6 6 18M6 6l12 12",
  arrowLeft: "M19 12H5 M12 19l-7-7 7-7",
  stop: "M6 6h12v12H6z",
  gift: "M20 12v9H4v-9 M2 7h20v5H2z M12 22V7 M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7ZM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7Z",
  shield: "M12 2 4 6v6c0 5 3.4 8.4 8 10 4.6-1.6 8-5 8-10V6l-8-4Z",
  chart: "M4 20V10 M10 20V4 M16 20v-7 M4 20h16",
  trophy: "M8 21h8 M12 17v4 M7 4h10v5a5 5 0 0 1-10 0V4Z M7 5H4a1 1 0 0 0-1 1 4 4 0 0 0 4 4 M17 5h3a1 1 0 0 1 1 1 4 4 0 0 1-4 4",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9 M13.7 21a2 2 0 0 1-3.4 0",
  home: "M3 10.5 12 3l9 7.5 M5 9.5V21h5v-6h4v6h5V9.5",
  wood: "M6 8h12a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z M9.5 8v8 M14.5 8v8",
  crystal: "M6 3h12l4 6-10 12L2 9Z M9 3l3 5 3-5 M2 9h20 M8 9l4 12 4-12",
  pop: "M5 7a2 2 0 1 0 4 0 2 2 0 0 0-4 0 M10.5 4.5a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0 M11 16a3 3 0 1 0 6 0 3 3 0 0 0-6 0 M3 14a1 1 0 1 0 2 0 1 1 0 0 0-2 0",
  misbaha: "M10.5 4.5a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0 M10.5 13.5a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0 M10.5 21a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0 M12 6v6 M12 15v4.5",
  minbar: "M4 21h15 M4 21V6 M8 21v-3h4 M12 18v-3h4 M16 15V6 M16 6h3",
  tasbih: "M4 12a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0 M7 12a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0 M10 12a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0 M13 12a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0 M16 12a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0",
  adhan: "M3 11l13-4.5v11L3 13v-2Z M16 13.6l5 1.4V9l-5 1.4 M8 11.8v4.4 M11 12.6v2.8",
  quran: "M12 5C10 2.6 6.5 3 4 4v15c2.5-1 6-1.4 8 1 2-2.4 5.5-2 8-1V4c-2.5-1-6-1.4-8 1Z M12 5v15 M12 9v3.4 M9.8 10l4.4 1.8 M14.2 10l-4.4 1.8"
};

export default function Icon({ name, size = 20, className = "", strokeWidth = 1.8 }) {
  const d = paths[name];
  if (!d) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      // Icons are always decorative here: every one that carries meaning sits
      // inside a button that already has an aria-label. Exposing the <svg> too
      // made screen readers announce a stray graphic after the label.
      aria-hidden="true"
      focusable="false"
      strokeLinejoin="round"
      className={className}
    >
      <path d={d} />
    </svg>
  );
}
