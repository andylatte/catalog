"use client";

import { useState } from "react";
import { ChevronRight, ExternalLink } from "lucide-react";

import { RichText } from "@/components/rich-text";
import { htmlToMarkup } from "@/lib/paste-markup";

const DOCX = /\.docx$/i;
const PDF = /\.pdf$/i;

/** Zoom-Transkripte (.vtt): Nummern und Zeitstempel weglassen, nur „Name: Text“ behalten. */
function fromVtt(source: string) {
  return source
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .filter((line) => line.trim() && line.trim() !== "WEBVTT" && !/^\d+$/.test(line.trim()) && !line.includes("-->"))
    .join("\n");
}

/** Markdown-Überschriften ab #### auf ### kürzen, __fett__ in **fett**. */
function fromMarkdown(source: string) {
  return source.replace(/^(\s{0,3})#{4,6}(\s)/gm, "$1###$2").replace(/__(.+?)__/g, "**$1**");
}

async function load(name: string, url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(String(response.status));
  if (DOCX.test(name)) {
    const mammoth = await import("mammoth");
    const arrayBuffer = await response.arrayBuffer();
    const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
    return htmlToMarkup(html) ?? (await mammoth.extractRawText({ arrayBuffer })).value;
  }
  const text = await response.text();
  if (/\.vtt$/i.test(name)) return fromVtt(text);
  if (/\.(md|markdown)$/i.test(name)) return fromMarkdown(text);
  return text;
}

type State = { status: "idle" | "loading" | "error" } | { status: "done"; text: string };

/** Zuklappbare Leseansicht für einen Anhang; der Inhalt wird erst beim Aufklappen geladen. */
function Reader({ name, url }: { name: string; url: string }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<State>({ status: "idle" });
  const pdf = PDF.test(name);

  function toggle(event: React.SyntheticEvent<HTMLDetailsElement>) {
    const isOpen = event.currentTarget.open;
    setOpen(isOpen);
    if (!isOpen || pdf || state.status === "loading" || state.status === "done") return;
    setState({ status: "loading" });
    load(name, url).then(
      (text) => setState({ status: "done", text }),
      () => setState({ status: "error" }),
    );
  }

  return (
    <details onToggle={toggle} className="group rounded-md border">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm hover:bg-accent/50 [&::-webkit-details-marker]:hidden">
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
        <span className="min-w-0 flex-1 truncate">{name}</span>
        <span className="shrink-0 text-xs text-muted-foreground">{open ? "Zuklappen" : "Lesen"}</span>
      </summary>
      {open && (
        <div className="border-t px-3 py-3 text-sm">
          {pdf ? (
            <div className="space-y-2">
              <iframe src={url} title={name} className="h-[70vh] w-full rounded-md border bg-muted" />
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="size-3.5" />
                In neuem Tab öffnen
              </a>
            </div>
          ) : state.status === "done" ? (
            state.text.trim() ? (
              <RichText text={state.text} />
            ) : (
              <p className="text-muted-foreground">Die Datei ist leer.</p>
            )
          ) : state.status === "error" ? (
            <p className="text-destructive">Die Datei konnte nicht gelesen werden.</p>
          ) : (
            <p className="text-muted-foreground">Wird geladen …</p>
          )}
        </div>
      )}
    </details>
  );
}

export function AttachmentReaders({ files }: { files: { id: string; name: string; url: string }[] }) {
  if (!files.length) return null;
  return (
    <div className="space-y-2 pt-2">
      {files.map((file) => (
        <Reader key={file.id} name={file.name} url={file.url} />
      ))}
    </div>
  );
}
