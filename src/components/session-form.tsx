"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Paperclip, Undo2, X } from "lucide-react";

import { discardSessionUploads, saveSession, type NewSessionFile } from "@/app/session-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatFileSize } from "@/lib/format";
import { extensionFor, shrinkImage } from "@/lib/images";
import { createClient } from "@/lib/supabase/client";
import type { Session, SessionFile } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  /** Fehlt bei einer neuen Sitzung; dann wird die ID hier vergeben. */
  sessionId?: string;
  userId: string;
  session?: Session;
  files?: SessionFile[];
  cancelHref: string;
};

function today() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

/** Dateiname, der als Speicherpfad taugt: "Protokoll März.pdf" → "Protokoll-Maerz.pdf" */
function safeName(name: string) {
  const cleaned = name
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue")
    .replace(/Ä/g, "Ae").replace(/Ö/g, "Oe").replace(/Ü/g, "Ue").replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|-+$/g, "")
    .slice(-120);
  return cleaned || "datei";
}

function Field({
  label,
  hint,
  htmlFor,
  className,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Zwei bis drei Knöpfe nebeneinander, von denen einer gewählt ist (Radio-Gruppe). */
function Choice({
  name,
  label,
  options,
  value,
  onChange,
  required,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-sm leading-none font-medium">{label}</legend>
      <div className="inline-flex rounded-md border p-0.5 shadow-xs">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "cursor-pointer rounded-[5px] px-3 py-1.5 text-sm transition-colors select-none",
              "has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
              value === option.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              onClick={() => !required && value === option.value && onChange("")}
              required={required}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function SessionForm({ userId, session, files = [], cancelHref, ...props }: Props) {
  const id = useId();
  // Die ID steht schon vor dem Speichern fest, damit Anhänge in den richtigen Ordner kommen.
  const [sessionId] = useState(() => props.sessionId ?? crypto.randomUUID());
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);

  const [saved, setSaved] = useState(Boolean(session));
  const [kind, setKind] = useState<string>(session?.kind ?? "");
  const [setting, setSetting] = useState<string>(session?.setting ?? "");
  const [format, setFormat] = useState(
    session?.online === true ? "online" : session?.online === false ? "live" : "",
  );
  const [pending, setPending] = useState<File[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = status !== null;

  function addFiles(list: FileList | null) {
    if (!list) return;
    // Erst kopieren: das Leeren des Feldes leert auch die FileList.
    const added = Array.from(list);
    setPending((current) => [...current, ...added]);
    if (fileInput.current) fileInput.current.value = "";
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError(null);

    const fields: Record<string, string> = {};
    new FormData(event.currentTarget).forEach((value, key) => {
      if (typeof value === "string") fields[key] = value;
    });

    const supabase = createClient();
    const uploaded: NewSessionFile[] = [];
    try {
      for (const [index, file] of pending.entries()) {
        setStatus(`Anhang ${index + 1} von ${pending.length} wird hochgeladen …`);
        // Fotos werden wie im Katalog verkleinert, alles andere bleibt unverändert.
        let blob: Blob = file;
        let name = file.name;
        if (file.type.startsWith("image/")) {
          blob = await shrinkImage(file);
          if (blob !== file) name = name.replace(/\.[^.]+$/, "") + "." + extensionFor(blob);
        }
        const path = `${userId}/${sessionId}/${crypto.randomUUID()}/${safeName(name)}`;
        const { error: uploadError } = await supabase.storage
          .from("anhaenge")
          .upload(path, blob, { contentType: blob.type || "application/octet-stream" });
        if (uploadError) throw new Error("upload");
        uploaded.push({ path, name, size: blob.size });
      }

      setStatus("Speichern …");
      const result = await saveSession({
        id: sessionId,
        isNew: !saved,
        fields,
        newFiles: uploaded,
        removeFileIds: removed,
      });
      if (result.id) setSaved(true);
      if (result.error) {
        if (!result.id && uploaded.length) {
          await discardSessionUploads(sessionId, uploaded.map((file) => file.path));
        }
        setError(result.error);
        setStatus(null);
        return;
      }
      router.push(`/sessions/${sessionId}`);
    } catch {
      if (uploaded.length) {
        await discardSessionUploads(sessionId, uploaded.map((file) => file.path));
      }
      setError("Anhänge konnten nicht hochgeladen werden. Bitte versuch es noch einmal.");
      setStatus(null);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      <div className="space-y-6">
        <Choice
          name="kind"
          label="Art"
          required
          value={kind}
          onChange={setKind}
          options={[
            { value: "supervision", label: "Supervision" },
            { value: "therapie", label: "Therapie" },
          ]}
        />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-[1fr_8rem_8rem]">
          <Field label="Datum" htmlFor={`${id}-date`} className="col-span-2 sm:col-span-1">
            <Input
              id={`${id}-date`}
              name="held_on"
              type="date"
              defaultValue={session?.held_on ?? today()}
              required
            />
          </Field>
          <Field label="Uhrzeit" htmlFor={`${id}-time`}>
            <Input
              id={`${id}-time`}
              name="start_time"
              type="time"
              defaultValue={session?.start_time?.slice(0, 5) ?? ""}
            />
          </Field>
          <Field label="Dauer (Min.)" htmlFor={`${id}-duration`}>
            <Input
              id={`${id}-duration`}
              name="duration_minutes"
              type="number"
              inputMode="numeric"
              min={1}
              defaultValue={session?.duration_minutes ?? ""}
            />
          </Field>
        </div>

        <Field label="Auftraggeber" htmlFor={`${id}-client`}>
          <Input id={`${id}-client`} name="client" defaultValue={session?.client ?? ""} />
        </Field>

        <Field label="Teilnehmer" htmlFor={`${id}-participants`} hint="Namen oder Kürzel, bei Gruppen gern auch die Anzahl">
          <Textarea
            id={`${id}-participants`}
            name="participants"
            defaultValue={session?.participants ?? ""}
            className="min-h-12"
          />
        </Field>

        <div className="flex flex-wrap gap-x-8 gap-y-6">
          <Choice
            name="setting"
            label="Setting"
            value={setting}
            onChange={setSetting}
            options={[
              { value: "einzel", label: "Einzel" },
              { value: "gruppe", label: "Gruppe" },
            ]}
          />
          <Choice
            name="format"
            label="Format"
            value={format}
            onChange={setFormat}
            options={[
              { value: "live", label: "Live" },
              { value: "online", label: "Online" },
            ]}
          />
        </div>

        <Field
          label={format === "online" ? "Plattform / Link" : "Ort"}
          htmlFor={`${id}-location`}
          hint={format === "online" ? "z. B. Zoom" : "Raum oder Adresse"}
        >
          <Input id={`${id}-location`} name="location" defaultValue={session?.location ?? ""} />
        </Field>

        <Field label="Methoden / Programm" htmlFor={`${id}-methods`}>
          <Textarea
            id={`${id}-methods`}
            name="methods"
            defaultValue={session?.methods ?? ""}
            className="min-h-24"
          />
        </Field>

        <Field label="Beobachtungen" htmlFor={`${id}-observations`}>
          <Textarea
            id={`${id}-observations`}
            name="observations"
            defaultValue={session?.observations ?? ""}
            className="min-h-40"
          />
        </Field>

        <div className="space-y-3">
          <p className="text-sm leading-none font-medium">Anhänge</p>
          {(files.length > 0 || pending.length > 0) && (
            <ul className="divide-y rounded-md border text-sm">
              {files.map((file) => {
                const isRemoved = removed.includes(file.id);
                return (
                  <li key={file.id} className="flex items-center gap-3 px-3 py-2">
                    <Paperclip className="size-4 shrink-0 text-muted-foreground" />
                    <span className={cn("min-w-0 flex-1 truncate", isRemoved && "text-muted-foreground line-through")}>
                      {file.name}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        setRemoved((current) =>
                          isRemoved ? current.filter((f) => f !== file.id) : [...current, file.id],
                        )
                      }
                      aria-label={isRemoved ? "Doch behalten" : "Anhang entfernen"}
                      className="rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                    >
                      {isRemoved ? <Undo2 className="size-4" /> : <X className="size-4" />}
                    </button>
                  </li>
                );
              })}
              {pending.map((file, index) => (
                <li key={`${file.name}-${index}`} className="flex items-center gap-3 px-3 py-2">
                  <Paperclip className="size-4 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1 truncate">{file.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setPending((current) => current.filter((_, i) => i !== index))}
                    aria-label="Anhang entfernen"
                    className="rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <input
            ref={fileInput}
            type="file"
            multiple
            hidden
            onChange={(event) => addFiles(event.target.files)}
          />
          <Button type="button" variant="outline" onClick={() => fileInput.current?.click()} disabled={busy}>
            <Paperclip />
            Dateien hinzufügen
          </Button>
          {removed.length > 0 && (
            <p className="text-xs text-muted-foreground">Durchgestrichene Anhänge werden beim Speichern gelöscht.</p>
          )}
        </div>
      </div>

      {status && <p className="text-sm text-muted-foreground">{status}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button asChild variant="ghost">
          <Link href={saved ? `/sessions/${sessionId}` : cancelHref}>Abbrechen</Link>
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? "Speichern …" : "Speichern"}
        </Button>
      </div>
    </form>
  );
}
