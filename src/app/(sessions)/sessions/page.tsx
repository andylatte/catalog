import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { formatShortDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { SESSION_KINDS, type Session, type SessionKind } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Sitzungsdoku" };

type ListItem = Pick<Session, "id" | "kind" | "held_on" | "start_time" | "client" | "participants">;

const FILTERS: { value: SessionKind | null; label: string }[] = [
  { value: null, label: "Alle" },
  { value: "supervision", label: SESSION_KINDS.supervision },
  { value: "therapie", label: SESSION_KINDS.therapie },
];

export default async function SessionsPage({ searchParams }: PageProps<"/sessions">) {
  const params = await searchParams;
  const kind = params.typ === "supervision" || params.typ === "therapie" ? params.typ : null;

  const supabase = await createClient();
  let query = supabase
    .from("sessions")
    .select("id, kind, held_on, start_time, client, participants")
    .order("held_on", { ascending: false })
    .order("start_time", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (kind) query = query.eq("kind", kind);
  const { data, error } = await query;
  const sessions = data as ListItem[] | null;

  return (
    <div className="space-y-6">
      <nav aria-label="Nach Art filtern" className="flex flex-wrap gap-1.5">
        {FILTERS.map((filter) => {
          const active = filter.value === kind;
          return (
            <Badge
              key={filter.label}
              asChild
              variant={active ? "default" : "outline"}
              className={cn("rounded-full px-3 py-1 text-sm", !active && "text-muted-foreground")}
            >
              <Link
                href={filter.value ? `/sessions?typ=${filter.value}` : "/sessions"}
                scroll={false}
                aria-pressed={active}
              >
                {filter.label}
              </Link>
            </Badge>
          );
        })}
      </nav>

      {error && (
        <p className="text-sm text-destructive">Die Sitzungen konnten nicht geladen werden.</p>
      )}

      {sessions && (
        <>
          <p className="text-sm text-muted-foreground">
            {sessions.length === 1 ? "1 Sitzung" : `${sessions.length} Sitzungen`}
          </p>

          {sessions.length === 0 ? (
            <div className="rounded-xl border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
              {kind ? (
                `Noch keine ${SESSION_KINDS[kind]}-Sitzungen.`
              ) : (
                <>
                  Noch keine Sitzungen.{" "}
                  <Link href="/sessions/neu" className="underline underline-offset-4 hover:text-foreground">
                    Erste Sitzung dokumentieren
                  </Link>
                </>
              )}
            </div>
          ) : (
            <ul className="divide-y rounded-xl border">
              {sessions.map((session) => (
                <li key={session.id}>
                  <Link
                    href={`/sessions/${session.id}`}
                    className="grid gap-1 px-4 py-4 transition-colors hover:bg-accent/50 sm:grid-cols-[8.5rem_1fr_1fr] sm:items-baseline sm:gap-4 sm:px-5"
                  >
                    <div className="flex items-center gap-2 sm:flex-col sm:items-start sm:gap-1">
                      <time dateTime={session.held_on} className="text-sm font-medium tabular-nums">
                        {formatShortDate(session.held_on)}
                      </time>
                      <Badge variant="secondary" className="font-normal">
                        {SESSION_KINDS[session.kind]}
                      </Badge>
                    </div>
                    <p className={cn("font-medium leading-snug", !session.client && "text-muted-foreground")}>
                      {session.client ?? "Ohne Auftraggeber"}
                    </p>
                    {session.participants && (
                      <p className="line-clamp-2 text-sm text-muted-foreground">{session.participants}</p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
