/**
 * Wandelt eingefügtes HTML (z. B. aus Zoom Docs, Google Docs oder Word) in die
 * einfache Formatierung um: Überschriften, Aufzählungen, nummerierte Listen, fett.
 * Läuft nur im Browser (DOMParser).
 */

const SKIP = new Set(["STYLE", "SCRIPT", "META", "TITLE", "HEAD", "LINK", "TEMPLATE"]);
const PARAGRAPH = new Set(["P", "BLOCKQUOTE", "PRE", "TABLE", "FIGURE"]);
const LINE = new Set(["DIV", "SECTION", "ARTICLE", "HEADER", "FOOTER", "MAIN", "ASIDE", "NAV", "DT", "DD"]);

type State = { bold: boolean; heading: boolean; depth: number; pre: boolean };

function isBold(element: HTMLElement) {
  const weight = element.style.fontWeight;
  // Google Docs packt alles in <b style="font-weight:normal">.
  if (weight) return weight === "bold" || weight === "bolder" || Number(weight) >= 600;
  return element.tagName === "B" || element.tagName === "STRONG";
}

function children(node: Node, state: State) {
  return Array.from(node.childNodes, (child) => convert(child, state)).join("");
}

function convert(node: Node, state: State): string {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? "";
    return state.pre ? text : text.replace(/\s+/g, " ");
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  const element = node as HTMLElement;
  const tag = element.tagName;
  if (SKIP.has(tag)) return "";
  if (tag === "BR") return "\n";

  const heading = /^H([1-6])$/.exec(tag);
  if (heading) {
    const text = children(element, { ...state, heading: true }).replace(/\s+/g, " ").trim();
    return text ? `\n\n${"#".repeat(Math.min(Number(heading[1]), 3))} ${text}\n\n` : "";
  }

  if (tag === "UL" || tag === "OL") {
    let number = Number(element.getAttribute("start")) || 1;
    const items = Array.from(element.children)
      .filter((child) => child.tagName === "LI")
      .map((item) => {
        const text = children(item, { ...state, depth: state.depth + 1 })
          .replace(/\n{2,}/g, "\n")
          .trim();
        if (!text) return "";
        const marker = tag === "OL" ? `${number++}.` : "-";
        return `${"  ".repeat(state.depth)}${marker} ${text}\n`;
      });
    return `\n${items.join("")}\n`;
  }

  if (tag === "TR") {
    const cells = Array.from(element.children, (cell) => children(cell, state).replace(/\s+/g, " ").trim());
    return `${cells.filter(Boolean).join(" | ")}\n`;
  }

  if (!state.bold && !state.heading && isBold(element)) {
    const inner = children(element, { ...state, bold: true });
    const match = /^(\s*)([\s\S]*?)(\s*)$/.exec(inner)!;
    return match[2] ? `${match[1]}**${match[2]}**${match[3]}` : inner;
  }

  const content = children(element, { ...state, pre: state.pre || tag === "PRE" });
  if (PARAGRAPH.has(tag)) return `\n\n${content}\n\n`;
  if (LINE.has(tag) || tag === "LI") return `\n${content}\n`;
  return content;
}

/** Ergebnis als Text, oder null, wenn das HTML keine Formatierung enthält, die sich lohnt. */
export function htmlToMarkup(html: string): string | null {
  const doc = new DOMParser().parseFromString(html, "text/html");
  if (!doc.body.querySelector("h1, h2, h3, h4, h5, h6, ul, ol, b, strong, [style*='font-weight'], table")) {
    return null;
  }
  const text = convert(doc.body, { bold: false, heading: false, depth: 0, pre: false })
    .replace(/\*\*\*\*/g, "")
    .replace(/ /g, " ")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text || null;
}

/** onPaste für Textfelder: Formatierung übernehmen statt sie zu verlieren. */
export function pasteAsMarkup(event: React.ClipboardEvent<HTMLTextAreaElement>) {
  const html = event.clipboardData.getData("text/html");
  if (!html) return;
  const markup = htmlToMarkup(html);
  if (!markup) return;
  event.preventDefault();
  const field = event.currentTarget;
  field.focus();
  // execCommand hält Rückgängig (Strg+Z) intakt und löst ein input-Ereignis aus.
  if (!document.execCommand("insertText", false, markup)) {
    field.setRangeText(markup, field.selectionStart, field.selectionEnd, "end");
    field.dispatchEvent(new Event("input", { bubbles: true }));
  }
}
