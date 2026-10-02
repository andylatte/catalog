import { cn } from "@/lib/utils";

/**
 * Einfache Formatierung ohne Menü:
 *   - Aufzählung (auch "* " oder "• ")      1. Nummerierte Liste
 *   **fett**                                 [rot]farbig[/rot] (rot, grün, blau, orange, lila)
 */
export const RICH_TEXT_HINT = "Formatierung: - Aufzählung, **fett**, [rot]Text[/rot] (auch grün, blau, orange, lila)";

const COLORS: Record<string, string> = {
  rot: "text-mark-red",
  gruen: "text-mark-green",
  grün: "text-mark-green",
  blau: "text-mark-blue",
  orange: "text-mark-orange",
  lila: "text-mark-purple",
};

const INLINE = /\*\*(.+?)\*\*|\[(rot|grün|gruen|blau|orange|lila)\]([\s\S]+?)\[\/\2\]/gi;

function inline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    if (match[1] !== undefined) {
      nodes.push(<strong key={match.index} className="font-semibold">{inline(match[1])}</strong>);
    } else {
      nodes.push(
        <span key={match.index} className={COLORS[match[2].toLowerCase()]}>
          {inline(match[3])}
        </span>,
      );
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

type Block =
  | { type: "text"; lines: string[] }
  | { type: "ul" | "ol"; items: string[] };

const BULLET = /^\s*[-*•]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;

function blocks(source: string) {
  const result: Block[] = [];
  for (const line of source.replace(/\r\n?/g, "\n").split("\n")) {
    const bullet = BULLET.exec(line);
    const numbered = bullet ? null : NUMBERED.exec(line);
    const type = bullet ? "ul" : numbered ? "ol" : "text";
    const current = result.at(-1);
    if (type === "text") {
      if (current?.type === "text") current.lines.push(line);
      else result.push({ type: "text", lines: [line] });
    } else {
      const item = (bullet ?? numbered)![1];
      if (current?.type === type) current.items.push(item);
      else result.push({ type, items: [item] });
    }
  }
  return result;
}

/** Zeigt Text mit der einfachen Formatierung an; alles andere bleibt, wie es getippt wurde. */
export function RichText({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn("space-y-2 leading-relaxed", className)}>
      {blocks(text).map((block, index) => {
        if (block.type === "text") {
          const content = block.lines.join("\n").replace(/^\n+|\n+$/g, "");
          if (!content) return null;
          return (
            <p key={index} className="whitespace-pre-wrap">
              {inline(content)}
            </p>
          );
        }
        const List = block.type;
        return (
          <List
            key={index}
            className={cn("space-y-1 pl-5", List === "ul" ? "list-disc" : "list-decimal")}
          >
            {block.items.map((item, i) => (
              <li key={i} className="pl-1 marker:text-muted-foreground">
                {inline(item)}
              </li>
            ))}
          </List>
        );
      })}
    </div>
  );
}

