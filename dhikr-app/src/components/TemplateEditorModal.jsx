import { useEffect, useState } from "react";
import Modal from "./Modal.jsx";
import Icon from "../lib/Icon.jsx";
import { uid } from "../data/templates.js";
import { validateTemplateDraft } from "../lib/templateOps.js";

const emptyLine = () => ({ id: uid(), transliteration: "", arabic: "", count: 33 });

export default function TemplateEditorModal({ open, initial, onClose, onSave, t }) {
  const [name, setName] = useState("");
  const [lines, setLines] = useState([emptyLine()]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setName(initial ? initial.name : "");
      setLines(initial ? initial.items.map((it) => ({ ...it })) : [emptyLine()]);
      setErrors({});
    }
  }, [open, initial]);

  if (!open) return null;

  const updateLine = (id, patch) => setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const addLine = () => setLines((ls) => [...ls, emptyLine()]);
  const removeLine = (id) => setLines((ls) => (ls.length > 1 ? ls.filter((l) => l.id !== id) : ls));

  const validate = () => {
    const errs = validateTemplateDraft(name, lines);
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      id: initial ? initial.id : `custom-${uid()}`,
      name: name.trim(),
      description: initial ? initial.description : "",
      isDefault: false,
      items: lines.map((l) => ({ ...l, count: Math.max(1, Math.min(10000, parseInt(l.count, 10) || 1)) })),
      createdAt: initial ? initial.createdAt : Date.now(),
      updatedAt: Date.now()
    });
  };

  const reset = () => {
    setName(initial ? initial.name : "");
    setLines(initial ? initial.items.map((it) => ({ ...it })) : [emptyLine()]);
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? t.editTemplate : t.createTemplate} labelledBy="editor-title" wide t={t}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t.templateNamePlaceholder}
        className={`w-full mb-4 px-3 py-2.5 rounded-xl bg-white/80 dark:bg-white/5 border ${
          errors.name ? "border-red-400" : "border-[var(--beige)]/70 dark:border-white/10"
        } outline-none font-semibold text-[var(--brown-900)] dark:text-[var(--dark-text)]`}
      />

      <div className="max-h-[40vh] overflow-y-auto -mx-1 px-1">
        {lines.map((line) => (
          <div key={line.id} className={`flex items-center gap-2 py-2 border-b ${errors[line.id] ? "border-red-300" : "border-[var(--beige)]/60 dark:border-white/10"}`}>
            <div className="flex-1 min-w-0">
              <input
                value={line.transliteration}
                onChange={(e) => updateLine(line.id, { transliteration: e.target.value })}
                placeholder={t.transliterationPlaceholder}
                className="w-full text-sm bg-transparent outline-none text-[var(--brown-900)] dark:text-[var(--dark-text)] mb-0.5"
              />
              <input
                value={line.arabic}
                onChange={(e) => updateLine(line.id, { arabic: e.target.value })}
                dir="rtl"
                placeholder={t.arabicPlaceholder}
                className="w-full text-sm font-arabic bg-transparent outline-none text-[var(--brown-700)] dark:text-[var(--dark-muted)]"
              />
            </div>
            <input
              type="number"
              min={1}
              max={10000}
              value={line.count}
              onChange={(e) => updateLine(line.id, { count: e.target.value })}
              className="w-14 text-sm text-right bg-transparent outline-none text-[var(--terra-dark)] dark:text-[var(--gold)] font-semibold"
            />
            <button aria-label={t.delete} onClick={() => removeLine(line.id)} className="p-1 text-[var(--brown-500)] hover:text-red-500 shrink-0">
              <Icon name="x" size={14} />
            </button>
          </div>
        ))}
      </div>

      <button onClick={addLine} className="flex items-center gap-1 text-[var(--terra-dark)] dark:text-[var(--gold)] text-sm font-semibold mt-3 mb-5 active:opacity-60">
        <Icon name="plus" size={14} /> {t.addLine}
      </button>

      {Object.keys(errors).length > 0 && <p className="text-xs text-red-500 mb-3">{t.requiredField}</p>}

      <div className="flex items-center justify-between">
        <button aria-label={t.resetForm} onClick={reset} className="p-2 -ml-2 rounded-full text-[var(--brown-500)] dark:text-[var(--dark-muted)] hover:bg-black/5 dark:hover:bg-white/10">
          <Icon name="reset" size={17} />
        </button>
        <div className="flex gap-5">
          <button onClick={onClose} className="px-2 py-2 text-[var(--brown-500)] dark:text-[var(--dark-muted)] font-medium active:opacity-60">
            {t.cancel}
          </button>
          <button onClick={handleSave} className="px-2 py-2 font-semibold text-[var(--terra-dark)] dark:text-[var(--gold)] active:opacity-60">
            {t.save}
          </button>
        </div>
      </div>
    </Modal>
  );
}
