import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";

import { deleteComment, deleteExercise } from "@/app/actions";
import { CommentForm } from "@/components/comment-form";
import { ConfirmButton } from "@/components/confirm-button";
import { ExerciseMeta } from "@/components/exercise-meta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { EXERCISE_COLUMNS, type Comment, type Exercise } from "@/lib/types";

async function loadExercise(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("exercises")
    .select(EXERCISE_COLUMNS)
    .eq("id", id)
    .maybeSingle<Exercise>();
  return data;
}

export async function generateMetadata({
  params,
}: PageProps<"/uebungen/[id]">): Promise<Metadata> {
  const exercise = await loadExercise((await params).id);
  return { title: exercise ? `${exercise.title} · Übungskatalog` : "Übungskatalog" };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</h2>
      {children}
    </section>
  );
}

export default async function ExercisePage({ params }: PageProps<"/uebungen/[id]">) {
  const { id } = await params;
  const exercise = await loadExercise(id);
  if (!exercise) notFound();

  const supabase = await createClient();
  const [commentResult, { data: claims }] = await Promise.all([
    supabase
      .from("comments")
      .select("id, exercise_id, body, practiced_on, created_at, comment_photos(id, path)")
      .eq("exercise_id", id)
      .order("practiced_on", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.auth.getClaims(),
  ]);
  const comments = commentResult.data as Comment[] | null;
  const userId = claims?.claims.sub;

  // Fotos liegen privat; für die Anzeige gibt es zeitlich begrenzte Links.
  const paths = (comments ?? []).flatMap((c) => c.comment_photos.map((p) => p.path));
  const photoUrls = new Map<string, string>();
  if (paths.length) {
    const { data: signed } = await supabase.storage.from("fotos").createSignedUrls(paths, 60 * 60);
    signed?.forEach((s) => s.path && s.signedUrl && photoUrls.set(s.path, s.signedUrl));
  }

  return (
    <article className="space-y-10">
      <div className="space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Alle Übungen
        </Link>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{exercise.title}</h1>
          <div className="flex shrink-0 gap-1">
            <Button asChild variant="ghost" size="icon" aria-label="Bearbeiten">
              <Link href={`/uebungen/${exercise.id}/bearbeiten`}>
                <Pencil />
              </Link>
            </Button>
            <ConfirmButton
              variant="ghost"
              size="icon"
              aria-label="Löschen"
              question={`„${exercise.title}“ mit allen Einträgen und Fotos löschen?`}
              onConfirm={deleteExercise.bind(null, exercise.id)}
            >
              <Trash2 />
            </ConfirmButton>
          </div>
        </div>
        <ExerciseMeta exercise={exercise} />
        {exercise.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {exercise.tags.map((tag) => (
              <Badge key={tag} asChild variant="secondary" className="font-normal">
                <Link href={`/?tag=${encodeURIComponent(tag)}`}>{tag}</Link>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {exercise.suitable_for && (
        <Section title="Wofür geeignet">
          <p className="whitespace-pre-wrap">{exercise.suitable_for}</p>
        </Section>
      )}

      <Section title="Ablauf">
        <p className="leading-relaxed whitespace-pre-wrap">{exercise.procedure}</p>
      </Section>

      {exercise.material && (
        <Section title="Material">
          <p className="whitespace-pre-wrap">{exercise.material}</p>
        </Section>
      )}

      {exercise.origin && (
        <Section title="Herkunft">
          <p className="whitespace-pre-wrap">{exercise.origin}</p>
        </Section>
      )}

      <section className="space-y-6 border-t pt-8">
        <h2 className="text-lg font-semibold tracking-tight">Praxis-Log</h2>

        {userId && <CommentForm exerciseId={exercise.id} userId={userId} />}

        {comments && comments.length > 0 ? (
          <ol className="space-y-8">
            {comments.map((comment) => (
              <li key={comment.id} className="group space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <time dateTime={comment.practiced_on} className="text-sm font-medium">
                    {formatDate(comment.practiced_on)}
                  </time>
                  <ConfirmButton
                    variant="ghost"
                    size="icon"
                    aria-label="Eintrag löschen"
                    question="Diesen Eintrag mit seinen Fotos löschen?"
                    onConfirm={deleteComment.bind(null, comment.id, exercise.id)}
                    className="size-8 text-muted-foreground sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                  >
                    <Trash2 />
                  </ConfirmButton>
                </div>
                {comment.body && <p className="leading-relaxed whitespace-pre-wrap">{comment.body}</p>}
                {comment.comment_photos.length > 0 && (
                  <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {comment.comment_photos.map((photo) => {
                      const url = photoUrls.get(photo.path);
                      return (
                        <li key={photo.id} className="aspect-square overflow-hidden rounded-md bg-muted">
                          {url && (
                            <a href={url} target="_blank" rel="noreferrer">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={url}
                                alt=""
                                loading="lazy"
                                className="size-full object-cover transition-opacity hover:opacity-90"
                              />
                            </a>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">
            Noch keine Einträge. Halte hier fest, wie die Übung in der Praxis lief.
          </p>
        )}
      </section>
    </article>
  );
}
