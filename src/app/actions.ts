"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { parseTags } from "@/lib/format";
import { createClient, getUserId } from "@/lib/supabase/server";

export type FormState = { error?: string } | undefined;

const PHOTO_BUCKET = "fotos";

function text(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function exerciseFromForm(formData: FormData) {
  const online = text(formData, "online");
  return {
    title: text(formData, "title"),
    procedure: text(formData, "procedure"),
    suitable_for: text(formData, "suitable_for") || null,
    tags: parseTags(text(formData, "tags")),
    online: online === "ja" ? true : online === "nein" ? false : null,
    origin: text(formData, "origin") || null,
    group_size: text(formData, "group_size") || null,
    material: text(formData, "material") || null,
  };
}

function validateExercise(exercise: ReturnType<typeof exerciseFromForm>) {
  if (!exercise.title) return "Bitte gib einen Titel ein.";
  if (!exercise.procedure) return "Bitte beschreibe den Ablauf.";
  return null;
}

// Anmeldung -------------------------------------------------------------

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: text(formData, "email"),
    password: String(formData.get("password") ?? ""),
  });
  if (error) return { error: "Anmeldung fehlgeschlagen. Bitte E-Mail und Passwort prüfen." };
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// Übungen ---------------------------------------------------------------

export async function createExercise(_prev: FormState, formData: FormData): Promise<FormState> {
  const exercise = exerciseFromForm(formData);
  const invalid = validateExercise(exercise);
  if (invalid) return { error: invalid };

  const supabase = await createClient();
  const { data, error } = await supabase.from("exercises").insert(exercise).select("id").single();
  if (error) return { error: "Speichern hat nicht geklappt. Bitte versuch es noch einmal." };

  revalidatePath("/exercises");
  redirect(`/exercises/${data.id}`);
}

export async function updateExercise(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const exercise = exerciseFromForm(formData);
  const invalid = validateExercise(exercise);
  if (invalid) return { error: invalid };

  const supabase = await createClient();
  const { error } = await supabase.from("exercises").update(exercise).eq("id", id);
  if (error) return { error: "Speichern hat nicht geklappt. Bitte versuch es noch einmal." };

  revalidatePath("/exercises");
  revalidatePath(`/exercises/${id}`);
  redirect(`/exercises/${id}`);
}

export async function deleteExercise(id: string) {
  const supabase = await createClient();

  const { data: photos } = await supabase
    .from("comment_photos")
    .select("path, comments!inner(exercise_id)")
    .eq("comments.exercise_id", id);
  if (photos?.length) {
    await supabase.storage.from(PHOTO_BUCKET).remove(photos.map((photo) => photo.path));
  }

  await supabase.from("exercises").delete().eq("id", id);
  revalidatePath("/exercises");
  redirect("/exercises");
}

// Praxis-Log ------------------------------------------------------------

export async function addComment(input: {
  exerciseId: string;
  body: string;
  practicedOn: string;
  photoPaths: string[];
}): Promise<FormState> {
  const userId = await getUserId();
  if (!userId) return { error: "Bitte melde dich neu an." };

  const body = input.body.trim();
  const prefix = `${userId}/${input.exerciseId}/`;
  const photoPaths = input.photoPaths.filter((path) => path.startsWith(prefix));
  if (!body && photoPaths.length === 0) {
    return { error: "Schreib etwas oder füge ein Foto hinzu." };
  }

  const supabase = await createClient();
  const { data: comment, error } = await supabase
    .from("comments")
    .insert({
      exercise_id: input.exerciseId,
      body,
      practiced_on: /^\d{4}-\d{2}-\d{2}$/.test(input.practicedOn) ? input.practicedOn : undefined,
    })
    .select("id")
    .single();
  if (error) return { error: "Eintrag konnte nicht gespeichert werden." };

  if (photoPaths.length) {
    const { error: photoError } = await supabase
      .from("comment_photos")
      .insert(photoPaths.map((path) => ({ comment_id: comment.id, path })));
    if (photoError) {
      await supabase.storage.from(PHOTO_BUCKET).remove(photoPaths);
      return { error: "Der Text ist gespeichert, die Fotos leider nicht." };
    }
  }

  revalidatePath(`/exercises/${input.exerciseId}`);
}

export async function deleteComment(commentId: string, exerciseId: string) {
  const supabase = await createClient();

  const { data: photos } = await supabase
    .from("comment_photos")
    .select("path")
    .eq("comment_id", commentId);
  if (photos?.length) {
    await supabase.storage.from(PHOTO_BUCKET).remove(photos.map((photo) => photo.path));
  }

  await supabase.from("comments").delete().eq("id", commentId);
  revalidatePath(`/exercises/${exerciseId}`);
}

/** Fotos, die hochgeladen, aber nicht gespeichert wurden (z. B. Fehler beim Eintrag). */
export async function discardUploads(exerciseId: string, paths: string[]) {
  const userId = await getUserId();
  if (!userId) return;
  const prefix = `${userId}/${exerciseId}/`;
  const own = paths.filter((path) => path.startsWith(prefix));
  if (!own.length) return;
  const supabase = await createClient();
  await supabase.storage.from(PHOTO_BUCKET).remove(own);
}
