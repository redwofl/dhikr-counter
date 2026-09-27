/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  safelist: [
    { pattern: /^(snap-x|snap-start|scrollbar-hide)$/ },
    { pattern: /^animate-slide-in-right$/ },
    { pattern: /^animate-slide-in-left$/ },
    { pattern: /^animate-active-pulse$/ },
    { pattern: /^animate-slide-to-active$/ },
    { pattern: /^delay-[1-9]$/ },
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cream: "#FBF7F0",
        "cream-2": "#F4EEE1",
        beige: "#EAE0C8",
        peach: "#F6E7DC",
        "brown-900": "#33261A",
        "brown-700": "#5C4732",
        "brown-500": "#8C7355",
        terra: "#C1723C",
        "terra-dark": "#9C5A2C",
        gold: "#C79A4B",
        "dark-bg": "#211A12",
        "dark-card": "#2C2116",
        "dark-text": "#EFE3CC",
        "dark-muted": "#B9A484"
      },
      fontFamily: {
        display: ["'Playfair Display'", "serif"],
        arabic: ["Amiri", "serif"],
        sans: ["Inter", "sans-serif"]
      }
    }
  },
  plugins: []
};
