import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { formatDuration, formatShortDate, slugify } from "@/lib/format";
import { SESSION_KINDS, type Session } from "@/lib/types";
import { cn } from "@/lib/utils";

export type SessionListItem = Pick<
  Session,
  "id" | "kind" | "held_on" | "start_time" | "duration_minutes" | "client" | "participants"
>;

export const SESSION_LIST_COLUMNS = "id, kind, held_on, start_time, duration_minutes, client, participants";

/** Sitzungsliste; Teilnehmer sind eigene Links zur Liste ihrer Sitzungen. */
export function SessionList({ sessions }: { sessions: SessionListItem[] }) {
  return (
    <ul className="divide-y rounded-xl border">
      {sessions.map((session) => {
        const duration = formatDuration(session.duration_minutes);
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
          </li>
        );
      })}
    </ul>
  );
}
