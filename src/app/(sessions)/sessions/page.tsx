import type { Metadata } from "next";
import Link from "next/link";

import { SearchBox } from "@/components/search-box";
import {
  findSnippet,
  SESSION_LIST_COLUMNS,
  SessionList,
  type SearchSnippet,
  type SessionListItem,
} from "@/components/session-list";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { SESSION_KINDS, type Session, type SessionKind } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Sitzungsdoku" };

const FILTERS: { value: SessionKind | null; label: string }[] = [
  { value: null, label: "Alle" },
  { value: "supervision", label: SESSION_KINDS.supervision },
  { value: "therapie", label: SESSION_KINDS.therapie },
];

export default async function SessionsPage({ searchParams }: PageProps<"/sessions">) {
  const params = await searchParams;
  const kind = params.typ === "supervision" || params.typ === "therapie" ? params.typ : null;
  const search = (typeof params.q === "string" ? params.q : "").trim();

  const supabase = await createClient();
  let sessions: SessionListItem[] | null;
  let failed: boolean;
  const snippets = new Map<string, SearchSnippet>();
  if (search) {
    // Die Suche liefert die ganzen Sitzungen, damit sich die Fundstelle zeigen lässt.
    let query = supabase.rpc("search_sessions", { query: search });
    if (kind) query = query.eq("kind", kind);
    const result = await query;
    const found = result.data as Session[] | null;
    found?.forEach((session) => {
      const snippet = findSnippet(session, search);
      if (snippet) snippets.set(session.id, snippet);
    });
    sessions = found;
    failed = Boolean(result.error);
  } else {
    let query = supabase
      .from("sessions")
      .select(SESSION_LIST_COLUMNS)
      .order("held_on", { ascending: false })
      .order("start_time", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (kind) query = query.eq("kind", kind);
    const result = await query;
    sessions = result.data as SessionListItem[] | null;
    failed = Boolean(result.error);
  }

  function filterHref(value: SessionKind | null) {
    const next = new URLSearchParams();
    if (search) next.set("q", search);
    if (value) next.set("typ", value);
    const query = next.toString();
    return query ? `/sessions?${query}` : "/sessions";
  }

  return (
    <div className="space-y-6">
      <SearchBox
        key={kind ?? ""}
        initialQuery={search}
        path="/sessions"
        keep={kind ? [["typ", kind]] : []}
        label="Sitzungen durchsuchen"
      />

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
                href={filterHref(filter.value)}
                scroll={false}
                aria-pressed={active}
              >
                {filter.label}
              </Link>
            </Badge>
          );
        })}
      </nav>

      {failed && (
        <p className="text-sm text-destructive">Die Sitzungen konnten nicht geladen werden.</p>
      )}

      {sessions && (
        <>
          <p className="text-sm text-muted-foreground">
            {sessions.length === 1 ? "1 Sitzung" : `${sessions.length} Sitzungen`}
          </p>

          {sessions.length === 0 ? (
            <div className="rounded-xl border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
              {search ? (
                "Keine Sitzung gefunden."
              ) : kind ? (
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
            <SessionList sessions={sessions} snippets={snippets} />
          )}
        </>
      )}
    </div>
  );
}
