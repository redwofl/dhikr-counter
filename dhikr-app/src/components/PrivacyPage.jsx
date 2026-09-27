import ScreenHeader from "./ScreenHeader.jsx";

export default function PrivacyPage({ t, onBack }) {
  return (
    <div className="min-h-screen pattern-bg safe-top pb-10 -ms-[var(--nav-gutter)] [--bg-bleed:0px]">
      <div className="max-w-[300px] ms-auto me-4 px-4">
        <ScreenHeader title={t.privacyPolicy} onBack={onBack} t={t} />
        <div className="space-y-4 text-sm text-[var(--brown-700)] dark:text-[var(--dark-muted)] leading-relaxed">
          <p>{t.privacy1}</p>
          <p>{t.privacy2}</p>
          <p>{t.privacy3}</p>
        </div>
      </div>
    </div>
  );
}
