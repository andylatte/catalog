import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SessionForm } from "@/components/session-form";
import { getParticipants } from "@/lib/sessions";
import { getUserId } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Neue Sitzung · Sitzungsdoku" };

export default async function NewSessionPage() {
  const userId = await getUserId();
  if (!userId) redirect("/login");
  const participants = await getParticipants();

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Neue Sitzung</h1>
      <SessionForm
        userId={userId}
        knownParticipants={participants.map((p) => p.name)}
        cancelHref="/sessions"
      />
    </div>
  );
}
