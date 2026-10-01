"use client";

import { useActionState } from "react";
import Link from "next/link";

import type { FormState } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Exercise } from "@/lib/types";

type Props = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  exercise?: Exercise;
  cancelHref: string;
};

function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function ExerciseForm({ action, exercise, cancelHref }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const online = exercise?.online === true ? "ja" : exercise?.online === false ? "nein" : "";

  return (
    <form action={formAction} className="space-y-8">
      <div className="space-y-6">
        <Field label="Titel" htmlFor="title">
          <Input id="title" name="title" defaultValue={exercise?.title} required autoFocus={!exercise} />
        </Field>
        <Field label="Ablauf" htmlFor="procedure">
          <Textarea
            id="procedure"
            name="procedure"
            defaultValue={exercise?.procedure}
            required
            className="min-h-48"
          />
        </Field>
      </div>

      <details className="group rounded-xl border px-4 py-3 sm:px-5" open={Boolean(exercise)}>
        <summary className="cursor-pointer list-none text-sm font-medium text-muted-foreground select-none group-open:mb-6 group-open:text-foreground">
          <span className="group-open:hidden">+ Weitere Angaben (optional)</span>
          <span className="hidden group-open:inline">Weitere Angaben (optional)</span>
        </summary>
        <div className="space-y-6 pb-2">
          <Field
            label="Wofür geeignet"
            htmlFor="suitable_for"
            hint="Setting, Zielgruppe, Anlass, z. B. „zur Klärung eines unklaren Auftrags“"
          >
            <Textarea id="suitable_for" name="suitable_for" defaultValue={exercise?.suitable_for ?? ""} />
          </Field>
          <Field label="Tags" htmlFor="tags" hint="Mit Komma trennen, z. B. Warm-up, Körper, Supervision">
            <Input id="tags" name="tags" defaultValue={exercise?.tags.join(", ")} />
          </Field>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Online geeignet" htmlFor="online">
              <select
                id="online"
                name="online"
                defaultValue={online}
                className="border-input dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border bg-transparent px-3 text-base shadow-xs outline-none focus-visible:ring-[3px] md:text-sm"
              >
                <option value="">keine Angabe</option>
                <option value="ja">Ja</option>
                <option value="nein">Nein</option>
              </select>
            </Field>
            <Field label="Gruppengröße" htmlFor="group_size" hint="z. B. 4–16, ab 3, Einzel">
              <Input id="group_size" name="group_size" defaultValue={exercise?.group_size ?? ""} />
            </Field>
          </div>
          <Field label="Benötigtes Material" htmlFor="material">
            <Textarea id="material" name="material" defaultValue={exercise?.material ?? ""} />
          </Field>
          <Field label="Herkunft" htmlFor="origin" hint="Wo kennengelernt, selbst erfahren, Quelle">
            <Input id="origin" name="origin" defaultValue={exercise?.origin ?? ""} />
          </Field>
        </div>
      </details>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button asChild variant="ghost">
          <Link href={cancelHref}>Abbrechen</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Speichern …" : "Speichern"}
        </Button>
      </div>
    </form>
  );
}
