import { useMemo, useState } from "react";
import Icon from "../lib/Icon.jsx";
import TemplateCard from "./TemplateCard.jsx";
import { searchTemplates } from "../lib/templateOps.js";

export default function TemplatesPage({ templates, onStart, onCreate, onEdit, onDelete, onBack, onPrivacy, t }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => searchTemplates(templates, query), [templates, query]);

  return (
    <div className="min-h-screen pattern-bg safe-top pb-10 -ms-[var(--nav-gutter)] [--bg-bleed:0px]">
      <div className="max-w-[300px] ms-auto me-4 px-4 pt-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1">
            <button
              aria-label={t.back}
              onClick={onBack}
              className="p-2 -ml-2 rounded-full text-[var(--brown-700)] dark:text-[var(--dark-muted)] hover:bg-black/5 dark:hover:bg-white/10"
            >
              <Icon name="arrowLeft" size={20} />
            </button>
            <h1 className="font-semibold text-xl text-[var(--brown-900)] dark:text-[var(--dark-text)]">{t.templates}</h1>
          </div>
          <button
            onClick={onCreate}
            className="flex items-center gap-1 px-4 py-2 rounded-full bg-white dark:bg-white/10 border border-[var(--beige)] dark:border-white/10 text-[var(--terra-dark)] dark:text-[var(--gold)] text-sm font-semibold active:scale-95 shadow-sm"
          >
            <Icon name="plus" size={15} /> {t.create}
          </button>
        </div>
        <div className="relative mb-5">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--brown-500)] dark:text-[var(--dark-muted)]">
            <Icon name="search" size={16} />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            aria-label={t.searchPlaceholder}
            className="w-full pl-11 pr-4 py-2.5 rounded-full bg-white/80 dark:bg-white/5 border border-[var(--beige)]/70 dark:border-white/10 text-sm text-[var(--brown-900)] dark:text-[var(--dark-text)] outline-none focus:ring-2 focus:ring-[var(--terra)]/40"
          />
        </div>
        {filtered.length === 0 ? (
          <p className="text-center text-[var(--brown-500)] dark:text-[var(--dark-muted)] py-16">{t.noTemplatesFound}</p>
        ) : (
          <div className="flex flex-col gap-3 pb-3">
            {filtered.map((tpl) => (
              <TemplateCard key={tpl.id} tpl={tpl} onStart={onStart} onEdit={onEdit} onDelete={onDelete} t={t} />
            ))}
          </div>
        )}

        <button onClick={onPrivacy} className="w-full text-center text-xs text-[var(--brown-500)] dark:text-[var(--dark-muted)] mt-5 underline underline-offset-2">
          {t.privacyPolicy}
        </button>
      </div>
    </div>
  );
}
