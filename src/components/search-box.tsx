"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";

/** Suchschlitz: aktualisiert die Liste während des Tippens. */
export function SearchBox({ initialQuery, tags }: { initialQuery: string; tags: string[] }) {
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
      tags.forEach((tag) => params.append("tag", tag));
      const search = params.toString();
      startTransition(() => router.replace(search ? `/catalog?${search}` : "/catalog", { scroll: false }));
    }, 250);
    return () => clearTimeout(timeout);
    // tags kommen vom Server und ändern sich nur über Links, nicht beim Tippen.
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
        placeholder="Übungen durchsuchen …"
        aria-label="Übungen durchsuchen"
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
