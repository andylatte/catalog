import { cn } from "@/lib/utils";

/**
 * Einfache Formatierung ohne Menü:
 *   # Überschrift (auch ## und ###)
 *   - Aufzählung (auch "* " oder "• ")      1. Nummerierte Liste; eingerückt = Unterpunkt
 *   **fett**                                 [rot]farbig[/rot] (rot, grün, blau, orange, lila)
 */
export const RICH_TEXT_HINT =
  "Formatierung: # Überschrift, - Aufzählung, **fett**, [rot]Text[/rot] (auch grün, blau, orange, lila)";

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

type Item = { text: string; level: number };

type Block =
  | { type: "text"; lines: string[] }
  | { type: "heading"; text: string }
  | { type: "ul" | "ol"; items: Item[] };

const HEADING = /^\s{0,3}#{1,3}\s+(.*)$/;
const BULLET = /^(\s*)[-*•]\s+(.*)$/;
const NUMBERED = /^(\s*)\d+[.)]\s+(.*)$/;

function blocks(source: string) {
  const result: Block[] = [];
  for (const line of source.replace(/\r\n?/g, "\n").split("\n")) {
    const heading = HEADING.exec(line);
    if (heading) {
      result.push({ type: "heading", text: heading[1] });
      continue;
    }
    const bullet = BULLET.exec(line);
    const numbered = bullet ? null : NUMBERED.exec(line);
    const type = bullet ? "ul" : numbered ? "ol" : "text";
    const current = result.at(-1);
    if (type === "text") {
      if (current?.type === "text") current.lines.push(line);
      else result.push({ type: "text", lines: [line] });
    } else {
      const [, indent, text] = (bullet ?? numbered)!;
      // Zwei Leerzeichen (oder ein Tab) Einrückung sind eine Ebene tiefer.
      const item = { text, level: Math.min(Math.floor(indent.replace(/\t/g, "  ").length / 2), 3) };
      if (current?.type === type) current.items.push(item);
      else result.push({ type, items: [item] });
    }
  }
  return result;
}

/** Text ohne Formatierungszeichen, für kurze Vorschauen in Listen. */
export function plainText(text: string) {
  return text
    .replace(INLINE, (_match, bold, _color, colored) => bold ?? colored)
    .replace(/^\s*(?:[-*•]|\d+[.)]|#{1,3})\s+/gm, "")
    .replace(/\s*\n\s*/g, " · ");
}

/** Zeigt Text mit der einfachen Formatierung an; alles andere bleibt, wie es getippt wurde. */
export function RichText({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn("space-y-2 leading-relaxed", className)}>
      {blocks(text).map((block, index) => {
        if (block.type === "heading") {
          return (
            <p key={index} className="pt-2 font-semibold first:pt-0">
              {inline(block.text)}
            </p>
          );
        }
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
              <li
                key={i}
                className={cn("pl-1 marker:text-muted-foreground", item.level > 0 && List === "ul" && "list-[circle]")}
                style={item.level ? { marginLeft: `${item.level * 1.25}rem` } : undefined}
              >
                {inline(item.text)}
              </li>
            ))}
          </List>
        );
      })}
    </div>
  );
}

