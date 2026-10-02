"use client";

import { useEffect, useState } from "react";
import { ExternalLink, X } from "lucide-react";

import { AttachmentGrid, AttachmentTile, isReadableName } from "@/components/attachment-tile";
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

type State = { status: "loading" | "error" } | { status: "done"; text: string };

/** Leseansicht für einen Anhang: Text, Word und Transkripte als Text, PDF eingebettet. */
function Reader({ name, url, onClose }: { name: string; url: string; onClose: () => void }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const pdf = PDF.test(name);

  useEffect(() => {
    if (pdf) return;
    let current = true;
    load(name, url).then(
      (text) => current && setState({ status: "done", text }),
      () => current && setState({ status: "error" }),
    );
    return () => {
      current = false;
    };
  }, [name, url, pdf]);

  return (
    <div className="rounded-md border">
      <div className="flex items-center gap-2 border-b px-3 py-2 text-sm">
        <span className="min-w-0 flex-1 truncate font-medium">{name}</span>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          aria-label="In neuem Tab öffnen"
          title="In neuem Tab öffnen"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <ExternalLink className="size-4" />
        </a>
        <button
          type="button"
          onClick={onClose}
          aria-label="Schließen"
          title="Schließen"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="px-3 py-3 text-sm">
        {pdf ? (
          <iframe src={url} title={name} className="h-[70vh] w-full rounded-md border bg-muted" />
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
    </div>
  );
}

export type AttachmentItem = {
  id: string;
  name: string;
  size: number | null;
  url?: string;
  previewUrl?: string;
};

/**
 * Anhänge als Kacheln. Lesbare Dateien (Text, Word, PDF, Transkripte) öffnen sich
 * per Klick darunter, alle anderen in einem neuen Tab.
 */
export function SessionAttachments({ files }: { files: AttachmentItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = files.find((file) => file.id === openId && file.url);

  return (
    <div className="space-y-4">
      <AttachmentGrid>
        {files.map((file) => {
          const readable = file.url && isReadableName(file.name);
          return (
            <AttachmentTile
              key={file.id}
              name={file.name}
              size={file.size}
              previewUrl={file.previewUrl}
              href={readable ? undefined : file.url}
              onClick={readable ? () => setOpenId(openId === file.id ? null : file.id) : undefined}
              highlight={file.id === openId}
            />
          );
        })}
      </AttachmentGrid>
      {open && <Reader key={open.id} name={open.name} url={open.url!} onClose={() => setOpenId(null)} />}
    </div>
  );
}
