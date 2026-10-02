"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";

type Props = {
  initialQuery: string;
  /** Seite, deren Liste gefiltert wird, z. B. /catalog. */
  path: string;
  /** Weitere Filter, die beim Tippen erhalten bleiben, z. B. [["tag", "Warm-up"]]. */
  keep?: [string, string][];
  label: string;
};

/** Suchschlitz: aktualisiert die Liste während des Tippens. */
export function SearchBox({ initialQuery, path, keep = [], label }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [pending, startTransition] = useTransition();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const timeout = setTimeout(() => {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      keep.forEach(([key, value]) => params.append(key, value));
      const search = params.toString();
      startTransition(() => router.replace(search ? `${path}?${search}` : path, { scroll: false }));
    }, 250);
    return () => clearTimeout(timeout);
    // keep kommt vom Server und ändert sich nur über Links, nicht beim Tippen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <form role="search" onSubmit={(event) => event.preventDefault()} className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        name="q"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={`${label} …`}
        aria-label={label}
        autoComplete="off"
        className="h-12 rounded-full pr-12 pl-12 text-base shadow-sm md:text-base [&::-webkit-search-cancel-button]:hidden"
        data-pending={pending ? "" : undefined}
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery("")}
          aria-label="Suche leeren"
          className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      )}
    </form>
  );
}
