import {
  File,
  FileArchive,
  FileAudio,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Presentation,
  type LucideIcon,
} from "lucide-react";

import { formatFileSize } from "@/lib/format";
import { cn } from "@/lib/utils";

const IMAGE = /\.(jpe?g|png|webp|gif|avif|heic|heif)$/i;

export function isImageName(name: string) {
  return IMAGE.test(name);
}

const READABLE = /\.(txt|md|markdown|vtt|docx|pdf)$/i;

/** Anhänge, deren Inhalt sich direkt auf der Seite lesen lässt (siehe SessionAttachments). */
export function isReadableName(name: string) {
  return READABLE.test(name);
}

const ICONS: [RegExp, LucideIcon][] = [
  [/\.(pdf|docx?|odt|rtf|txt|md|markdown|vtt|pages)$/i, FileText],
  [/\.(xlsx?|ods|csv|numbers)$/i, FileSpreadsheet],
  [/\.(pptx?|odp|key)$/i, Presentation],
  [/\.(mp3|m4a|wav|ogg|aac|flac)$/i, FileAudio],
  [/\.(mp4|mov|m4v|webm|avi|mkv)$/i, FileVideo],
  [/\.(zip|rar|7z|tar|gz)$/i, FileArchive],
];

function extension(name: string) {
  const match = /\.([a-z0-9]{1,5})$/i.exec(name);
  return match ? match[1].toUpperCase() : null;
}

type Props = {
  name: string;
  size?: number | null;
  /** Vorschaubild; nur für Bilder. */
  previewUrl?: string;
  /** Öffnet die Datei in einem neuen Tab. */
  href?: string;
  /** Statt eines Links, z. B. um die Datei auf der Seite zu lesen. */
  onClick?: () => void;
  /** Beim Bearbeiten zum Löschen vorgemerkt. */
  muted?: boolean;
  /** Hervorgehoben, z. B. noch nicht hochgeladene Dateien. */
  highlight?: boolean;
  /** Knopf oben rechts, z. B. Entfernen. */
  action?: React.ReactNode;
};

/** Quadratische Kachel: Bilder als Vorschau, andere Dateien mit Typ-Symbol und Endung. */
export function AttachmentTile({ name, size, previewUrl, href, onClick, muted, highlight, action }: Props) {
  const Icon = ICONS.find(([pattern]) => pattern.test(name))?.[1] ?? File;
  const ext = extension(name);

  const body = (
    <div className={cn(muted && "opacity-40")}>
      <div className="relative aspect-square overflow-hidden rounded-md border bg-muted">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-1.5 text-muted-foreground">
            <Icon className="size-8 stroke-[1.5]" />
            {ext && <span className="text-[11px] font-semibold tracking-wide">{ext}</span>}
          </div>
        )}
        {highlight && <span className="absolute inset-0 rounded-md ring-2 ring-primary ring-inset" />}
      </div>
      <p className="mt-1.5 truncate text-xs" title={name}>
        {name}
      </p>
      {size != null && <p className="text-[11px] text-muted-foreground">{formatFileSize(size)}</p>}
    </div>
  );

  const interactive =
    "block w-full rounded-md text-left transition-opacity hover:opacity-85 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none";

  return (
    <li className="relative min-w-0">
      {onClick ? (
        <button type="button" onClick={onClick} title={name} aria-pressed={highlight} className={interactive}>
          {body}
        </button>
      ) : href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          title={name}
          className={interactive}
        >
          {body}
        </a>
      ) : (
        body
      )}
      {action && <div className="absolute top-1 right-1">{action}</div>}
    </li>
  );
}

/** Raster für Kacheln, auf dem Handy drei, sonst fünf nebeneinander. */
export function AttachmentGrid({ children }: { children: React.ReactNode }) {
  return <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">{children}</ul>;
}
