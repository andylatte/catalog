import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SessionTextsForm } from "@/components/session-texts-form";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { SESSION_KINDS, type Session } from "@/lib/types";

export const metadata: Metadata = { title: "Inhalt bearbeiten · Sitzungsdoku" };

type TextSession = Pick<
  Session,
  "id" | "kind" | "held_on" | "client" | "methods" | "observations" | "self_reflection" | "notes"
>;

export default async function EditSessionTextsPage({ params }: PageProps<"/sessions/[id]/inhalt">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: session } = await supabase
    .from("sessions")
    .select("id, kind, held_on, client, methods, observations, self_reflection, notes")
    .eq("id", id)
    .maybeSingle<TextSession>();
  if (!session) notFound();

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Inhalt bearbeiten</h1>
        <p className="text-sm text-muted-foreground">
          {session.client ?? SESSION_KINDS[session.kind]} · {formatDate(session.held_on)}
        </p>
      </div>
      <SessionTextsForm session={session} />
    </div>
  );
}
