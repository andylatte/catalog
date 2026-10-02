"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

import { addComment, discardUploads } from "@/app/actions";
import { RICH_TEXT_HINT } from "@/components/rich-text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { extensionFor, shrinkImage } from "@/lib/images";
import { createClient } from "@/lib/supabase/client";

type Pending = { file: File; preview: string };

function today() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function CommentForm({ exerciseId, userId }: { exerciseId: string; userId: string }) {
  const id = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [body, setBody] = useState("");
  const [date, setDate] = useState(today);
  const [photos, setPhotos] = useState<Pending[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = status !== null;

  // Vorschaubilder freigeben, wenn sie nicht mehr gebraucht werden.
  const previews = useRef<Pending[]>([]);
  useEffect(() => {
    previews.current = photos;
  }, [photos]);
  useEffect(() => () => previews.current.forEach((p) => URL.revokeObjectURL(p.preview)), []);

  function addFiles(files: FileList | null) {
    if (!files) return;
    const next = Array.from(files)
      .filter((file) => file.type.startsWith("image/") || /\.(heic|heif)$/i.test(file.name))
      .map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setPhotos((current) => [...current, ...next]);
    if (fileInput.current) fileInput.current.value = "";
  }

  function removePhoto(index: number) {
    setPhotos((current) => {
      URL.revokeObjectURL(current[index].preview);
      return current.filter((_, i) => i !== index);
    });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!body.trim() && photos.length === 0) {
      setError("Schreib etwas oder füge ein Foto hinzu.");
      return;
    }
    setError(null);

    const supabase = createClient();
    const uploaded: string[] = [];
    try {
      for (const [index, photo] of photos.entries()) {
        setStatus(`Foto ${index + 1} von ${photos.length} wird hochgeladen …`);
        const blob = await shrinkImage(photo.file);
        const path = `${userId}/${exerciseId}/${crypto.randomUUID()}.${extensionFor(blob)}`;
        const { error: uploadError } = await supabase.storage
          .from("fotos")
          .upload(path, blob, { contentType: blob.type || "image/jpeg" });
        if (uploadError) throw new Error("upload");
        uploaded.push(path);
      }

      setStatus("Speichern …");
      const result = await addComment({ exerciseId, body, practicedOn: date, photoPaths: uploaded });
      if (result?.error) {
        if (uploaded.length) await discardUploads(exerciseId, uploaded);
        setError(result.error);
        return;
      }

      photos.forEach((p) => URL.revokeObjectURL(p.preview));
      setPhotos([]);
      setBody("");
      setDate(today());
    } catch {
      if (uploaded.length) await discardUploads(exerciseId, uploaded);
      setError("Fotos konnten nicht hochgeladen werden. Bitte versuch es noch einmal.");
    } finally {
      setStatus(null);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border p-4 sm:p-5">
      <div className="space-y-2">
        <Label htmlFor={`${id}-body`} className="sr-only">
          Beobachtung
        </Label>
        <Textarea
          id={`${id}-body`}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Wie lief es? Was ist aufgefallen?"
          className="min-h-24"
        />
        <p className="text-xs text-muted-foreground">{RICH_TEXT_HINT}</p>
      </div>

      {photos.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((photo, index) => (
            <li key={photo.preview} className="relative aspect-square overflow-hidden rounded-md bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.preview} alt="" className="size-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                disabled={busy}
                aria-label="Foto entfernen"
                className="absolute top-1 right-1 rounded-full bg-background/80 p-1 hover:bg-background"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1.5">
            <Label htmlFor={`${id}-date`} className="text-xs text-muted-foreground">
              Datum
            </Label>
            <Input
              id={`${id}-date`}
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
              className="w-auto"
            />
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(event) => addFiles(event.target.files)}
          />
          <Button type="button" variant="outline" onClick={() => fileInput.current?.click()} disabled={busy}>
            <ImagePlus />
            Fotos
          </Button>
        </div>
        <Button type="submit" disabled={busy}>
          Eintragen
        </Button>
      </div>

      {status && <p className="text-sm text-muted-foreground">{status}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
