import { slugify } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { ParticipantCount } from "@/lib/types";

/** Alle bekannten Teilnehmer mit Anzahl ihrer Sitzungen. */
export async function getParticipants() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("session_participants");
  return (data as ParticipantCount[] | null) ?? [];
}

/** Namen, die zu einem URL-Teil passen ("Anna" und "anna" landen beide unter /sessions/anna). */
export async function participantsForSlug(slug: string) {
  const all = await getParticipants();
  return all.filter((participant) => slugify(participant.name) === slug).map((p) => p.name);
}
