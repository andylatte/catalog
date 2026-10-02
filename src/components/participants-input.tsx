"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  id: string;
  name: string;
  defaultValue: string[];
  /** Bekannte Namen aus früheren Sitzungen, als Vorschläge beim Tippen. */
  suggestions: string[];
};

/** Namen als Chips: Enter, Komma oder Auswahl eines Vorschlags fügt hinzu. */
export function ParticipantsInput({ id, name, defaultValue, suggestions }: Props) {
  const [names, setNames] = useState(defaultValue);
  const [draft, setDraft] = useState("");

  const taken = new Set(names.map((n) => n.toLowerCase()));
  const query = draft.trim().toLowerCase();
  const matches = query
    ? suggestions
        .filter((s) => !taken.has(s.toLowerCase()) && s.toLowerCase().includes(query))
        .slice(0, 6)
    : [];

  function add(value: string) {
    const clean = value.trim().replace(/\s+/g, " ");
    if (clean && !taken.has(clean.toLowerCase())) setNames((current) => [...current, clean]);
    setDraft("");
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      // Enter nimmt den ersten Vorschlag, wenn der Name so begonnen wurde.
      const first = matches.find((m) => m.toLowerCase().startsWith(query));
      add(event.key === "Enter" && first ? first : draft);
    } else if (event.key === "Backspace" && !draft && names.length) {
      setNames((current) => current.slice(0, -1));
    }
  }

  return (
    <div className="relative">
      <input type="hidden" name={name} value={names.join("\n")} />
      <div
        className={cn(
          "flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border bg-transparent px-2 py-1.5 shadow-xs transition-[color,box-shadow] dark:bg-input/30",
          "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
        )}
      >
        {names.map((n) => (
          <span
            key={n}
            className="inline-flex items-center gap-1 rounded-full bg-secondary py-0.5 pr-1 pl-2.5 text-sm text-secondary-foreground"
          >
            {n}
            <button
              type="button"
              onClick={() => setNames((current) => current.filter((c) => c !== n))}
              aria-label={`${n} entfernen`}
              className="rounded-full p-0.5 hover:bg-background/60"
            >
              <X className="size-3.5" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(event) => setDraft(event.target.value.replace(/,/g, ""))}
          onKeyDown={onKeyDown}
          onBlur={() => draft.trim() && add(draft)}
          placeholder={names.length ? "" : "Name eingeben …"}
          autoComplete="off"
          enterKeyHint="enter"
          className="min-w-32 flex-1 bg-transparent px-1 py-0.5 text-base outline-none placeholder:text-muted-foreground md:text-sm"
        />
      </div>
      {matches.length > 0 && (
        <ul
          role="listbox"
          className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-md border bg-popover py-1 text-sm shadow-md"
        >
          {matches.map((match) => (
            <li key={match} role="option" aria-selected={false}>
              <button
                type="button"
                // mousedown statt click, damit das Feld den Fokus nicht vorher verliert
                onMouseDown={(event) => {
                  event.preventDefault();
                  add(match);
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-accent hover:text-accent-foreground"
              >
                {match}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
