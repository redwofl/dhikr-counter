export default function IntroScreen({ onStart, onExplore, t }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-8 text-center safe-top safe-bottom relative overflow-hidden pattern-bg [--bg-bleed:0px]"
    >
      <div
        className="absolute -top-10 -left-10 w-52 h-52 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle,#BFE3C9,transparent 70%)" }}
      />
      <div
        className="absolute top-24 -right-14 w-56 h-56 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle,#F3C8D8,transparent 70%)" }}
      />
      <p className="relative uppercase tracking-[0.2em] text-xs font-semibold text-[var(--ivory)] mb-3">{t.appSubtitle}</p>
      <h1 className="relative font-display text-5xl font-semibold gold-lux [padding:0.12em_0.2em] mb-6">{t.appName}</h1>
      <p className="relative text-[var(--ivory)] opacity-90 max-w-xs mb-10 leading-relaxed">{t.introDesc}</p>
      <button
        onClick={onStart}
        className="relative w-full max-w-xs py-4 rounded-2xl bg-[var(--terra-dark)] text-white font-semibold shadow-lg shadow-[var(--terra-dark)]/20 active:scale-95 transition mb-3"
      >
        {t.startDhikr}
      </button>
      <button
        onClick={onExplore}
        className="relative w-full max-w-xs py-4 rounded-2xl bg-white/70 border border-[var(--beige)] text-[var(--brown-700)] font-medium active:scale-95 transition"
      >
        {t.exploreTemplates}
      </button>
    </div>
  );
}
