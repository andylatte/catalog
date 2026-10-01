"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type State = { error?: string } | undefined;

export function SessionCommentForm({
  action: save,
}: {
  action: (state: State, formData: FormData) => Promise<State>;
}) {
  const [state, action, pending] = useActionState(save, undefined);

  return (
    <form action={action} className="space-y-3 rounded-xl border p-4 sm:p-5">
      <Label htmlFor="comment-body" className="sr-only">
        Kommentar
      </Label>
      <Textarea
        id="comment-body"
        name="body"
        placeholder="Nachtrag, Reflexion, nächste Schritte …"
        className="min-h-20"
        required
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-destructive">{state?.error}</p>
        <Button type="submit" disabled={pending}>
          {pending ? "Speichern …" : "Kommentieren"}
        </Button>
      </div>
    </form>
  );
}
