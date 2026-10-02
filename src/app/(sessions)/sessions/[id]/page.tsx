import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, MapPin, Monitor, Paperclip, Pencil, Trash2, User, Users } from "lucide-react";

import { addSessionComment, deleteSession, deleteSessionComment } from "@/app/session-actions";
import { ConfirmButton } from "@/components/confirm-button";
import { RichText } from "@/components/rich-text";
import { SessionCommentForm } from "@/components/session-comment-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatDateTime, formatFileSize, formatTimeSpan, slugify } from "@/lib/format";
import { participantsForSlug } from "@/lib/sessions";
import { createClient } from "@/lib/supabase/server";
import {
  SESSION_COLUMNS,
  SESSION_KINDS,
  type Session,
  type SessionComment,
  type SessionFile,
} from "@/lib/types";

import { ParticipantSessions } from "../participant-sessions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const IMAGE = /\.(jpe?g|png|webp|gif|heic|heif)$/i;

async function loadSession(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sessions")
    .select(SESSION_COLUMNS)
    .eq("id", id)
    .maybeSingle<Session>();
  return data;
}

function heading(session: Session) {
  return session.client ?? `${SESSION_KINDS[session.kind]} am ${formatDate(session.held_on)}`;
}

export async function generateMetadata({ params }: PageProps<"/sessions/[id]">): Promise<Metadata> {
  const { id } = await params;
  // /sessions/<uuid> ist eine Sitzung, alles andere ein Teilnehmer.
  if (!UUID.test(id)) {
    const [name] = await participantsForSlug(id);
    return { title: name ? `Sitzungen mit ${name} · Sitzungsdoku` : "Sitzungsdoku" };
  }
  const session = await loadSession(id);
  return { title: session ? `${heading(session)} · Sitzungsdoku` : "Sitzungsdoku" };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</h2>
      {children}
    </section>
  );
}

export default async function SessionPage({ params }: PageProps<"/sessions/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) return <ParticipantSessions slug={id} />;
  const session = await loadSession(id);
  if (!session) notFound();

  const supabase = await createClient();
  const [fileResult, commentResult] = await Promise.all([
    supabase
      .from("session_files")
      .select("id, path, name, size")
      .eq("session_id", id)
      .order("created_at")
      .returns<SessionFile[]>(),
    supabase
      .from("session_comments")
      .select("id, body, created_at")
      .eq("session_id", id)
      .order("created_at")
      .returns<SessionComment[]>(),
  ]);
  const files = fileResult.data ?? [];
  const comments = commentResult.data ?? [];

  // Anhänge liegen privat; für die Anzeige gibt es zeitlich begrenzte Links.
  const fileUrls = new Map<string, string>();
  if (files.length) {
    const { data: signed } = await supabase.storage
      .from("anhaenge")
      .createSignedUrls(files.map((file) => file.path), 60 * 60);
    signed?.forEach((s) => s.path && s.signedUrl && fileUrls.set(s.path, s.signedUrl));
  }
  const images = files.filter((file) => IMAGE.test(file.name));
  const documents = files.filter((file) => !IMAGE.test(file.name));

  const time = formatTimeSpan(session.start_time, session.end_time, session.duration_minutes);
  const hasMeta = time || session.setting || session.online !== null || session.location;

  return (
    <article className="space-y-10">
      <div className="space-y-4">
        <Link
          href="/sessions"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Alle Sitzungen
        </Link>
        <div className="flex items-center gap-2 text-sm">
          <Badge>{SESSION_KINDS[session.kind]}</Badge>
          <time dateTime={session.held_on} className="font-medium">
            {formatDate(session.held_on)}
          </time>
        </div>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{heading(session)}</h1>
          <div className="flex shrink-0 gap-1">
            <Button asChild variant="ghost" size="icon" aria-label="Bearbeiten">
              <Link href={`/sessions/${session.id}/bearbeiten`}>
                <Pencil />
              </Link>
            </Button>
            <ConfirmButton
              variant="ghost"
              size="icon"
              aria-label="Löschen"
              question="Diese Sitzung mit allen Anhängen und Kommentaren löschen?"
              onConfirm={deleteSession.bind(null, session.id)}
            >
              <Trash2 />
            </ConfirmButton>
          </div>
        </div>
        {hasMeta && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {time && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4" />
                {time}
              </span>
            )}
            {session.setting && (
              <span className="inline-flex items-center gap-1.5">
                {session.setting === "einzel" ? <User className="size-4" /> : <Users className="size-4" />}
                {session.setting === "einzel" ? "Einzel" : "Gruppe"}
              </span>
            )}
            {(session.online !== null || session.location) && (
              <span className="inline-flex items-center gap-1.5">
                {session.online ? <Monitor className="size-4" /> : <MapPin className="size-4" />}
                {[session.online === true ? "Online" : session.online === false ? "Live" : null, session.location]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            )}
          </div>
        )}
      </div>

      {session.participants.length > 0 && (
        <Section title="Teilnehmer">
          <ul className="flex flex-wrap gap-1.5">
            {session.participants.map((name) => (
              <li key={name}>
                <Badge asChild variant="outline" className="rounded-full px-3 py-1 text-sm font-normal">
                  <Link href={`/sessions/${slugify(name)}`}>{name}</Link>
                </Badge>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {session.methods && (
        <Section title="Methoden / Programm">
          <RichText text={session.methods} />
        </Section>
      )}

      {session.observations && (
        <Section title="Beobachtungen">
          <RichText text={session.observations} />
        </Section>
      )}

      {files.length > 0 && (
        <Section title="Anhänge">
          <div className="space-y-3">
            {images.length > 0 && (
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {images.map((file) => {
                  const url = fileUrls.get(file.path);
                  return (
                    <li key={file.id} className="aspect-square overflow-hidden rounded-md bg-muted">
                      {url && (
                        <a href={url} target="_blank" rel="noreferrer" title={file.name}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={file.name}
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
            {documents.length > 0 && (
              <ul className="divide-y rounded-md border text-sm">
                {documents.map((file) => (
                  <li key={file.id}>
                    <a
                      href={fileUrls.get(file.path)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-accent/50"
                    >
                      <Paperclip className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate">{file.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Section>
      )}

      <section className="space-y-6 border-t pt-8">
        <h2 className="text-lg font-semibold tracking-tight">Kommentare</h2>

        {comments.length > 0 ? (
          <ol className="space-y-6">
            {comments.map((comment) => (
              <li key={comment.id} className="group space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <time dateTime={comment.created_at} className="text-sm text-muted-foreground">
                    {formatDateTime(comment.created_at)}
                  </time>
                  <ConfirmButton
                    variant="ghost"
                    size="icon"
                    aria-label="Kommentar löschen"
                    question="Diesen Kommentar löschen?"
                    onConfirm={deleteSessionComment.bind(null, comment.id, session.id)}
                    className="size-8 text-muted-foreground sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                  >
                    <Trash2 />
                  </ConfirmButton>
                </div>
                <RichText text={comment.body} />
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">
            Noch keine Kommentare. Hier ist Platz für Nachträge und Reflexionen.
          </p>
        )}

        <SessionCommentForm action={addSessionComment.bind(null, session.id)} />
      </section>
    </article>
  );
}
