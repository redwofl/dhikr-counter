/**
 * Pure helpers for template list operations, kept separate from React
 * state so they're easy to unit test.
 */

export function addTemplate(customTemplates, tpl) {
  return [...customTemplates, tpl];
}

export function updateTemplate(customTemplates, tpl) {
  return customTemplates.map((c) => (c.id === tpl.id ? tpl : c));
}

export function removeTemplate(customTemplates, id) {
  return customTemplates.filter((c) => c.id !== id);
}

export function isCustomTemplateId(id) {
  return typeof id === "string" && id.startsWith("custom-");
}

export function searchTemplates(templates, query) {
  const q = query.trim().toLowerCase();
  if (!q) return templates;
  return templates.filter((tpl) => {
    if (tpl.name.toLowerCase().includes(q)) return true;
    if (tpl.description && tpl.description.toLowerCase().includes(q)) return true;
    return tpl.items.some((it) => it.transliteration.toLowerCase().includes(q) || it.arabic.includes(q));
  });
}

export function validateTemplateDraft(name, lines) {
  const errors = {};
  if (!name.trim()) errors.name = true;
  lines.forEach((l) => {
    if (!l.transliteration.trim() || !l.arabic.trim() || !(Number(l.count) > 0)) errors[l.id] = true;
  });
  return errors;
}
