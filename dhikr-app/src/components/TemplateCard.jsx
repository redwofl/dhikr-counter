import Icon from "../lib/Icon.jsx";

export default function TemplateCard({ tpl, onStart, onEdit, onDelete, t }) {
  return (
    <div className="rounded-2xl bg-white/70 dark:bg-white/5 border border-[var(--beige)]/70 dark:border-white/10 p-5 h-full">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-[var(--brown-900)] dark:text-[var(--dark-text)]">{tpl.name}</h3>
        {!tpl.isDefault && (
          <div className="flex gap-1 shrink-0 -mt-1 -mr-1">
            <button aria-label={t.edit} onClick={() => onEdit(tpl)} className="p-1.5 rounded-full text-[var(--brown-500)] dark:text-[var(--dark-muted)] hover:bg-black/5 dark:hover:bg-white/10">
              <Icon name="edit" size={14} />
            </button>
            <button aria-label={t.delete} onClick={() => onDelete(tpl)} className="p-1.5 rounded-full text-[var(--brown-500)] dark:text-[var(--dark-muted)] hover:bg-black/5 dark:hover:bg-white/10">
              <Icon name="trash" size={14} />
            </button>
          </div>
        )}
      </div>
      <div className="space-y-0.5 mb-4">
        {tpl.items.slice(0, 4).map((it) => (
          <p key={it.id} className="text-xs text-[var(--brown-700)] dark:text-[var(--dark-muted)]">
            {it.transliteration}/<span className="font-arabic text-[0.9375rem] ms-1.5">{it.arabic}</span> ({it.count}x)
          </p>
        ))}
        {tpl.items.length > 4 && <p className="text-xs text-[var(--brown-500)] dark:text-[var(--dark-muted)]">+{tpl.items.length - 4} more</p>}
      </div>
      <button onClick={() => onStart(tpl)} className="text-sm font-semibold text-[var(--terra-dark)] dark:text-[var(--gold)] flex items-center gap-1 active:opacity-60">
        {t.start} <Icon name="chevronRight" size={15} />
      </button>
    </div>
  );
}
