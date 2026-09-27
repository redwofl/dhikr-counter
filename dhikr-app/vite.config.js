import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      // Register the worker by hand in main.jsx instead. The injected script
      // called register() without handling the rejection, so every launch in
      // the Capacitor WebView logged
      // "Uncaught (in promise) TypeError: Failed to register a ServiceWorker".
      // That WebView serves from local assets, so a worker buys it nothing.
      injectRegister: false,
      // Rasters referenced straight from CSS are listed explicitly rather
      // than swept in by a glob. public/ also holds ~9 MB of background
      // variants the app can pick from but does not load, and precaching
      // those would bloat the install for nothing.
      includeAssets: [
        "icon.svg",
        "counter-bg-kaaba.webp", // photo behind .counter-bg / .pattern-bg
        "eid-bg.jpg",             // body background
        "bg-grain.png",           // overlay grain
      ],
      manifest: {
        name: "Dhikr Counter",
        short_name: "Dhikr Counter",
        description: "Zikr, Tasbih, Misbaha — count your daily Dhikr simply and peacefully.",
        theme_color: "#C1723C",
        background_color: "#FBF7F0",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,woff2}"]
      }
    })
  ],
  server: { port: 5173 }
});
