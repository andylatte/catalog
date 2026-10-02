"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { minutesBetween } from "@/lib/format";
import { createClient, getUserId } from "@/lib/supabase/server";

const FILE_BUCKET = "anhaenge";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type NewSessionFile = { path: string; name: string; size: number };

export type SaveSessionInput = {
  id: string;
  isNew: boolean;
  fields: Record<string, string>;
  newFiles: NewSessionFile[];
  removeFileIds: string[];
};

export type SaveSessionResult = { error?: string; id?: string };

function field(fields: Record<string, string>, name: string) {
  const value = fields[name];
  return typeof value === "string" ? value.trim() : "";
}

const TIME = /^\d{2}:\d{2}(:\d{2})?$/;

/** Ein Name pro Zeile; doppelte (ohne Groß/klein) fallen weg. */
function parseParticipants(value: string) {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const raw of value.split("\n")) {
    const name = raw.trim().replace(/\s+/g, " ").slice(0, 120);
    if (name && !seen.has(name.toLowerCase())) {
      seen.add(name.toLowerCase());
      names.push(name);
    }
  }
  return names;
}

function sessionFromFields(fields: Record<string, string>) {
  const kind = field(fields, "kind");
  const setting = field(fields, "setting");
  const format = field(fields, "format");
  const startTime = TIME.test(field(fields, "start_time")) ? field(fields, "start_time") : null;
  const endTime = TIME.test(field(fields, "end_time")) ? field(fields, "end_time") : null;
  return {
    kind: kind === "supervision" || kind === "therapie" ? kind : null,
    held_on: /^\d{4}-\d{2}-\d{2}$/.test(field(fields, "held_on")) ? field(fields, "held_on") : null,
    start_time: startTime,
    end_time: endTime,
    duration_minutes: minutesBetween(startTime, endTime),
    participants: parseParticipants(fields.participants ?? ""),
    client: field(fields, "client") || null,
    setting: setting === "einzel" || setting === "gruppe" ? setting : null,
    methods: field(fields, "methods") || null,
    observations: field(fields, "observations") || null,
    online: format === "online" ? true : format === "live" ? false : null,
    location: field(fields, "location") || null,
  };
}

/** Legt eine Sitzung an oder speichert sie; Anhänge sind schon hochgeladen. */
export async function saveSession(input: SaveSessionInput): Promise<SaveSessionResult> {
  const userId = await getUserId();
  if (!userId) return { error: "Bitte melde dich neu an." };
  if (!UUID.test(input.id)) return { error: "Ungültige Sitzung." };

  const session = sessionFromFields(input.fields);
  if (!session.kind) return { error: "Bitte wähle Supervision oder Therapie." };
  if (!session.held_on) return { error: "Bitte gib ein Datum ein." };

  const supabase = await createClient();
  const { error } = input.isNew
    ? await supabase.from("sessions").insert({ id: input.id, ...session })
    : await supabase.from("sessions").update(session).eq("id", input.id);
  if (error) return { error: "Speichern hat nicht geklappt. Bitte versuch es noch einmal." };

  const prefix = `${userId}/${input.id}/`;
  const newFiles = input.newFiles.filter((file) => file.path.startsWith(prefix));
  if (newFiles.length) {
    const { error: fileError } = await supabase.from("session_files").insert(
      newFiles.map((file) => ({
        session_id: input.id,
        path: file.path,
        name: file.name.slice(0, 255) || "Datei",
        size: Number.isFinite(file.size) ? file.size : null,
      })),
    );
    if (fileError) {
      await supabase.storage.from(FILE_BUCKET).remove(newFiles.map((file) => file.path));
      return { id: input.id, error: "Die Sitzung ist gespeichert, die Anhänge leider nicht." };
    }
  }

  if (!input.isNew && input.removeFileIds.length) {
    const { data: removed } = await supabase
      .from("session_files")
      .delete()
      .eq("session_id", input.id)
      .in("id", input.removeFileIds)
      .select("path");
    if (removed?.length) {
      await supabase.storage.from(FILE_BUCKET).remove(removed.map((file) => file.path));
    }
  }

  revalidatePath("/sessions");
  revalidatePath(`/sessions/${input.id}`);
  return { id: input.id };
}

export async function deleteSession(id: string) {
  const supabase = await createClient();

  const { data: files } = await supabase.from("session_files").select("path").eq("session_id", id);
  if (files?.length) {
    await supabase.storage.from(FILE_BUCKET).remove(files.map((file) => file.path));
  }

  await supabase.from("sessions").delete().eq("id", id);
  revalidatePath("/sessions");
  redirect("/sessions");
}

/** Hochgeladene Anhänge, die nicht gespeichert wurden (z. B. Fehler beim Speichern). */
export async function discardSessionUploads(sessionId: string, paths: string[]) {
  const userId = await getUserId();
  if (!userId) return;
  const prefix = `${userId}/${sessionId}/`;
  const own = paths.filter((path) => path.startsWith(prefix));
  if (!own.length) return;
  const supabase = await createClient();
  await supabase.storage.from(FILE_BUCKET).remove(own);
}

// Kommentare ------------------------------------------------------------

export async function addSessionComment(
  sessionId: string,
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string } | undefined> {
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Schreib zuerst einen Kommentar." };

  const supabase = await createClient();
  const { error } = await supabase.from("session_comments").insert({ session_id: sessionId, body });
  if (error) return { error: "Kommentar konnte nicht gespeichert werden." };

  revalidatePath(`/sessions/${sessionId}`);
  return {};
}

export async function deleteSessionComment(commentId: string, sessionId: string) {
  const supabase = await createClient();
  await supabase.from("session_comments").delete().eq("id", commentId);
  revalidatePath(`/sessions/${sessionId}`);
}
