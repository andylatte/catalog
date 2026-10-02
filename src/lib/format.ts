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

function minutesOf(time: string) {
  const [h, m] = time.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

/** "10:00" bis "11:30" → 90; über Mitternacht wird weitergezählt, gleiche Zeiten ergeben null. */
export function minutesBetween(start: string | null, end: string | null) {
  if (!start || !end) return null;
  const minutes = (minutesOf(end) - minutesOf(start) + 24 * 60) % (24 * 60);
  return minutes || null;
}

/** 90 → "1:30 h", 45 → "45 Min." */
export function formatDuration(minutes: number | null) {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes} Min.`;
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")} h`;
}

/** "10:00:00", "11:30:00", 90 → "10:00–11:30 · 1:30 h" (jeder Teil darf fehlen) */
export function formatTimeSpan(start: string | null, end: string | null, minutes: number | null) {
  const from = start?.slice(0, 5);
  const to = end?.slice(0, 5);
  const length = formatDuration(minutes);
  const span = from && to ? `${from}–${to}` : from ? `ab ${from} Uhr` : to ? `bis ${to} Uhr` : null;
  return [span, length].filter(Boolean).join(" · ") || null;
}

/** URL-Teil für einen Namen: "Jörg Müller" → "joerg-mueller" */
export function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/ß/g, "ss")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "-"
  );
}

/** 1536000 → "1,5 MB" */
export function formatFileSize(bytes: number | null) {
  if (bytes === null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toLocaleString("de-DE", { maximumFractionDigits: 1 })} MB`;
}
