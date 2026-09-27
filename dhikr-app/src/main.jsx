import React from "react";
import ReactDOM from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import { registerSW } from "virtual:pwa-register";
import App from "./App.jsx";
import "./index.css";
import { loadState } from "./lib/storage.js";
import { TRANSLATIONS } from "./data/translations.js";

// The boundary sits above <App/>, so it can't read the language from app state —
// it reads the saved setting directly and falls back to English.
const currentTranslations = () => {
  try {
    return TRANSLATIONS[loadState()?.settings?.language] || TRANSLATIONS.en;
  } catch {
    return TRANSLATIONS.en;
  }
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: false, errorMsg: "", errorStack: "" };
  }
  static getDerivedStateFromError(err) {
    return { error: true, errorMsg: err?.message || String(err), errorStack: err?.stack || "" };
  }
  componentDidCatch(err, info) {
    console.error("ErrorBoundary caught:", err, info);
  }
  render() {
    if (this.state.error) {
      const t = currentTranslations();
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center">
          <p className="font-display text-2xl mb-3">{t.errorTitle}</p>
          <p className="text-sm text-red-600 mb-4 max-w-xs break-words">{this.state.errorMsg}</p>
          <pre className="text-left text-[10px] text-red-700 bg-white/70 dark:bg-black/20 p-2 rounded-md max-w-xs max-h-40 overflow-auto break-words whitespace-pre-wrap">{this.state.errorStack}</pre>
          <button
            onClick={() => {
              localStorage.removeItem("dhikr_app_v1");
              window.location.reload();
            }}
            className="px-6 py-3 rounded-2xl bg-[var(--terra-dark)] text-white font-medium"
          >
            {t.errorReset}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Offline support is a browser concern only. The Android build serves its
// bundle straight out of the APK over https://localhost, where a service
// worker cannot register — attempting it only produced an unhandled rejection
// on every launch. Registering here (rather than letting the plugin inject a
// script) also means a failure is logged instead of thrown.
if (!Capacitor.isNativePlatform()) {
  registerSW({
    immediate: true,
    onRegisterError: (err) => console.warn("SW registration failed:", err)
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
