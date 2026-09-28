export default function IntroScreen({ onStart, onExplore, t }) {
  return (
    // `pattern-bg` + `--bg-bleed: 0px`, the same background stack every other
    // screen uses, so the start page shows the identical photo and scrim.
    //
    // This page used to carry two extra blurred colour blobs (a mint one at the
    // top left, a pink one at the top right, each at 40% opacity) as absolutely
    // positioned children. They sat *above* the background rather than behind
    // it, so the start page was washed with green and pink light that no other
    // page had — the backdrop looked like a different photo until the blobs
    // scrolled away, which they never did, because this page is one screen
    // tall. `-ms-[var(--nav-gutter)]` is deliberately absent: there is no nav
    // rail on the start page, so the container is the full 412px and the
    // background needs no gutter to bleed into.
    <div
      className="min-h-screen flex flex-col items-center justify-center px-8 text-center safe-top safe-bottom relative overflow-hidden pattern-bg [--bg-bleed:0px]"
    >
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
