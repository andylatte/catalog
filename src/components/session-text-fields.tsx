"use client";

import { useId } from "react";

import { RICH_TEXT_HINT } from "@/components/rich-text";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SESSION_TEXTS, type Session } from "@/lib/types";

/** Die drei Textfelder einer Sitzung; `onInput` meldet die erste Änderung. */
export function SessionTextFields({
  session,
  onInput,
}: {
  session?: Pick<Session, "methods" | "observations" | "self_reflection">;
  onInput: () => void;
}) {
  const id = useId();
  return (
    <div className="space-y-6">
      {SESSION_TEXTS.map((text) => (
        <div key={text.name} className="space-y-2">
          <Label htmlFor={`${id}-${text.name}`}>{text.label}</Label>
          <Textarea
            id={`${id}-${text.name}`}
            name={text.name}
            defaultValue={session?.[text.name] ?? ""}
            onInput={onInput}
            className={text.rows}
          />
        </div>
      ))}
      <p className="text-xs text-muted-foreground">{RICH_TEXT_HINT}</p>
    </div>
  );
}
