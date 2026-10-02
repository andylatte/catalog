import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { SESSION_LIST_COLUMNS, SessionList, type SessionListItem } from "@/components/session-list";
import { participantsForSlug } from "@/lib/sessions";
import { createClient } from "@/lib/supabase/server";

/** Alle Sitzungen mit einer Person, erreichbar unter /sessions/<name>. */
export async function ParticipantSessions({ slug }: { slug: string }) {
  const names = await participantsForSlug(slug);
  if (!names.length) notFound();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sessions")
    .select(SESSION_LIST_COLUMNS)
    .overlaps("participants", names)
    .order("held_on", { ascending: false })
    .order("start_time", { ascending: false, nullsFirst: false })
    .returns<SessionListItem[]>();
  const sessions = data ?? [];
  const minutes = sessions.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Link
          href="/sessions"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Alle Sitzungen
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Sitzungen mit {names[0]}</h1>
      </div>

      {error ? (
        <p className="text-sm text-destructive">Die Sitzungen konnten nicht geladen werden.</p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {sessions.length === 1 ? "1 Sitzung" : `${sessions.length} Sitzungen`}
            {minutes > 0 && ` · zusammen ${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")} h`}
          </p>
          <SessionList sessions={sessions} />
        </>
      )}
    </div>
  );
}
