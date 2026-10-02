import Link from "next/link";

import { plainText } from "@/components/rich-text";
import { Badge } from "@/components/ui/badge";
import { formatDuration, formatShortDate, slugify } from "@/lib/format";
import { SESSION_KINDS, SESSION_TEXTS, type Session } from "@/lib/types";
import { cn } from "@/lib/utils";

export type SessionListItem = Pick<
  Session,
  "id" | "kind" | "held_on" | "start_time" | "duration_minutes" | "client" | "participants"
>;

export const SESSION_LIST_COLUMNS = "id, kind, held_on, start_time, duration_minutes, client, participants";

/** Fundstelle eines Suchworts in den Textfeldern, für die Trefferliste. */
export type SearchSnippet = { label: string; before: string; hit: string; after: string };

export function findSnippet(session: Pick<Session, (typeof SESSION_TEXTS)[number]["name"]>, query: string) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  for (const text of SESSION_TEXTS) {
    const value = session[text.name];
    if (!value) continue;
    const plain = plainText(value);
    const lower = plain.toLowerCase();
    for (const word of words) {
      const at = lower.indexOf(word);
      if (at === -1) continue;
      const start = Math.max(0, at - 60);
      const end = Math.min(plain.length, at + word.length + 80);
      return {
        label: text.label,
        before: (start > 0 ? "…" : "") + plain.slice(start, at),
        hit: plain.slice(at, at + word.length),
        after: plain.slice(at + word.length, end) + (end < plain.length ? "…" : ""),
      } satisfies SearchSnippet;
    }
  }
  return null;
}

/** Sitzungsliste; Teilnehmer sind eigene Links zur Liste ihrer Sitzungen. */
export function SessionList({
  sessions,
  snippets,
}: {
  sessions: SessionListItem[];
  /** Bei einer Suche: Fundstelle je Sitzung. */
  snippets?: Map<string, SearchSnippet>;
}) {
  return (
    <ul className="divide-y rounded-xl border">
      {sessions.map((session) => {
        const duration = formatDuration(session.duration_minutes);
        const snippet = snippets?.get(session.id);
        return (
          <li
            key={session.id}
            className="relative grid gap-1 px-4 py-4 transition-colors hover:bg-accent/50 sm:grid-cols-[8.5rem_1fr_1fr] sm:items-baseline sm:gap-4 sm:px-5"
          >
            <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-start sm:gap-1">
              <time dateTime={session.held_on} className="text-sm font-medium tabular-nums">
                {formatShortDate(session.held_on)}
              </time>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-normal">
                  {SESSION_KINDS[session.kind]}
                </Badge>
                {duration && <span className="text-xs text-muted-foreground tabular-nums">{duration}</span>}
              </div>
            </div>
            {/* Der Link deckt die ganze Zeile ab; die Teilnehmer-Links liegen darüber. */}
            <Link
              href={`/sessions/${session.id}`}
              className={cn(
                "font-medium leading-snug after:absolute after:inset-0",
                !session.client && "text-muted-foreground",
              )}
            >
              {session.client ?? "Ohne Auftraggeber"}
            </Link>
            {session.participants.length > 0 && (
              <p className="pointer-events-none relative z-10 line-clamp-2 text-sm text-muted-foreground">
                {session.participants.map((name, index) => (
                  <span key={name}>
                    {index > 0 && ", "}
                    <Link
                      href={`/sessions/${slugify(name)}`}
                      className="underline-offset-4 hover:text-foreground hover:underline pointer-events-auto"
                    >
                      {name}
                    </Link>
                  </span>
                ))}
              </p>
            )}
            {snippet && (
              <p className="line-clamp-3 text-sm text-muted-foreground sm:col-span-2 sm:col-start-2">
                <span className="text-xs font-medium tracking-wide uppercase">{snippet.label}:</span>{" "}
                {snippet.before}
                <mark className="rounded-sm bg-primary/15 px-0.5 text-foreground">{snippet.hit}</mark>
                {snippet.after}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
