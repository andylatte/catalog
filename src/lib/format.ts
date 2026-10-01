const dateFormat = new Intl.DateTimeFormat("de-DE", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** "2026-09-14" → "14. September 2026" */
export function formatDate(isoDate: string) {
  return dateFormat.format(new Date(`${isoDate.slice(0, 10)}T00:00:00Z`));
}

/** "Wahrnehmung, Kontakt ,  , Körper" → ["Wahrnehmung", "Kontakt", "Körper"] */
export function parseTags(value: string) {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const raw of value.split(",")) {
    const tag = raw.trim().replace(/\s+/g, " ");
    if (tag && !seen.has(tag.toLowerCase())) {
      seen.add(tag.toLowerCase());
      tags.push(tag);
    }
  }
  return tags;
}
