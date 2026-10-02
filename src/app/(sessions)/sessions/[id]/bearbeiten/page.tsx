import { notFound, redirect } from "next/navigation";

import { SessionForm } from "@/components/session-form";
import { getParticipants } from "@/lib/sessions";
import { createClient, getUserId } from "@/lib/supabase/server";
import { SESSION_COLUMNS, type Session, type SessionFile } from "@/lib/types";

export default async function EditSessionPage({ params }: PageProps<"/sessions/[id]/bearbeiten">) {
  const { id } = await params;
  const userId = await getUserId();
  if (!userId) redirect("/login");

  const supabase = await createClient();
  const [{ data: session }, { data: files }, participants] = await Promise.all([
    supabase.from("sessions").select(SESSION_COLUMNS).eq("id", id).maybeSingle<Session>(),
    supabase
      .from("session_files")
      .select("id, path, name, size")
      .eq("session_id", id)
      .order("created_at")
      .returns<SessionFile[]>(),
    getParticipants(),
  ]);
  if (!session) notFound();

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Metadaten bearbeiten</h1>
      <SessionForm
        sessionId={session.id}
        userId={userId}
        session={session}
        files={files ?? []}
        knownParticipants={participants.map((p) => p.name)}
        cancelHref={`/sessions/${session.id}`}
      />
    </div>
  );
}
