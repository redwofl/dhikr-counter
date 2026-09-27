import Icon from "../lib/Icon.jsx";

export default function ScreenHeader({ title, onBack, right, t }) {
  return (
    <div className="flex items-center justify-between px-5 pt-5 pb-3 max-w-md ms-auto me-4 w-full">
      <div className="flex items-center gap-2">
        {onBack && (
          <button
            aria-label={t?.back || "Back"}
            onClick={onBack}
            className="p-2 -ml-2 rounded-full text-[var(--brown-700)] dark:text-[var(--dark-muted)] hover:bg-black/5 dark:hover:bg-white/10"
          >
            <Icon name="arrowLeft" size={20} />
          </button>
        )}
        <h1 className="font-semibold text-lg text-[var(--brown-900)] dark:text-[var(--dark-text)]">{title}</h1>
      </div>
      {right}
    </div>
  );
}
