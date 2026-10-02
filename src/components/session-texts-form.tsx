"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { saveSessionTexts } from "@/app/session-actions";
import { SessionTextFields } from "@/components/session-text-fields";
import { useUnsavedGuard } from "@/components/unsaved-guard";
import { Button } from "@/components/ui/button";
import type { Session } from "@/lib/types";

/** Bearbeiten von Methoden, Beobachtungen und Selbstreflexion, getrennt von den Metadaten. */
export function SessionTextsForm({
  session,
}: {
  session: Pick<Session, "id" | "methods" | "observations" | "self_reflection">;
}) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useUnsavedGuard(form, dirty);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const fields: Record<string, string> = {};
    new FormData(event.currentTarget).forEach((value, key) => {
      if (typeof value === "string") fields[key] = value;
    });
    const result = await saveSessionTexts(session.id, fields);
    if (result.error) {
      setError(result.error);
      setBusy(false);
      return;
    }
    setDirty(false);
    router.push(`/sessions/${session.id}`);
  }

  return (
    <form ref={form} onSubmit={submit} className="space-y-8">
      <SessionTextFields session={session} onInput={() => setDirty(true)} />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button asChild variant="ghost">
          <Link href={`/sessions/${session.id}`}>Abbrechen</Link>
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? "Speichern …" : "Speichern"}
        </Button>
      </div>
    </form>
  );
}
