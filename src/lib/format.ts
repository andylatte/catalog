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

const shortDateFormat = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

/** "2026-09-14" → "14.09.2026" */
export function formatShortDate(isoDate: string) {
  return shortDateFormat.format(new Date(`${isoDate.slice(0, 10)}T00:00:00Z`));
}

const dateTimeFormat = new Intl.DateTimeFormat("de-DE", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Berlin",
});

/** Zeitstempel → "14. September 2026 um 18:30" */
export function formatDateTime(timestamp: string) {
  return dateTimeFormat.format(new Date(timestamp));
}

/** "10:00:00" + 90 → "10:00–11:30 · 90 Min." (jeder Teil darf fehlen) */
export function formatTimeSpan(startTime: string | null, minutes: number | null) {
  const start = startTime?.slice(0, 5);
  const length = minutes ? `${minutes} Min.` : null;
  if (!start) return length;
  if (!minutes) return `${start} Uhr`;
  const [h, m] = start.split(":").map(Number);
  const end = (h * 60 + m + minutes) % (24 * 60);
  const endText = `${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`;
  return `${start}–${endText} · ${length}`;
}

/** 1536000 → "1,5 MB" */
export function formatFileSize(bytes: number | null) {
  if (bytes === null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toLocaleString("de-DE", { maximumFractionDigits: 1 })} MB`;
}
