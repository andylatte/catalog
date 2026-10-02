import type { Metadata } from "next";
import Link from "next/link";

import { ExerciseMeta } from "@/components/exercise-meta";
import { plainText } from "@/components/rich-text";
import { SearchBox } from "@/components/search-box";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import type { Exercise, TagCount } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Übungskatalog" };

type ListItem = Pick<Exercise, "id" | "title" | "suitable_for" | "tags" | "online" | "group_size" | "origin">;

function toList(value: string | string[] | undefined) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function href(query: string, tags: string[]) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  tags.forEach((tag) => params.append("tag", tag));
  const search = params.toString();
  return search ? `/catalog?${search}` : "/catalog";
}

export default async function CatalogPage({ searchParams }: PageProps<"/catalog">) {
  const params = await searchParams;
  const query = (toList(params.q)[0] ?? "").trim();
  const selectedTags = toList(params.tag);

  const supabase = await createClient();
  const [search, tagResult] = await Promise.all([
    supabase
      .rpc("search_exercises", { q: query, tag_filter: selectedTags })
      .select("id, title, suitable_for, tags, online, group_size, origin"),
    supabase.rpc("all_tags"),
  ]);
  const exercises = search.data as ListItem[] | null;
  const tagCounts = tagResult.data as TagCount[] | null;
  const error = search.error;

  const filtering = Boolean(query || selectedTags.length);

  return (
    <div className="space-y-6">
      <SearchBox key={selectedTags.join("\u0000")} initialQuery={query} tags={selectedTags} />

      {tagCounts && tagCounts.length > 0 && (
        <nav aria-label="Nach Tags filtern" className="flex flex-wrap gap-1.5">
          {tagCounts.map(({ tag }) => {
            const active = selectedTags.includes(tag);
            const next = active ? selectedTags.filter((t) => t !== tag) : [...selectedTags, tag];
            return (
              <Badge
                key={tag}
                asChild
                variant={active ? "default" : "outline"}
                className={cn("rounded-full px-3 py-1 text-sm", !active && "text-muted-foreground")}
              >
                <Link href={href(query, next)} scroll={false} aria-pressed={active}>
                  {tag}
                </Link>
              </Badge>
            );
          })}
        </nav>
      )}

      {error && (
        <p className="text-sm text-destructive">Die Übungen konnten nicht geladen werden.</p>
      )}

      {exercises && (
        <>
          <p className="text-sm text-muted-foreground">
            {exercises.length === 1 ? "1 Übung" : `${exercises.length} Übungen`}
            {filtering && (
              <>
                {" · "}
                <Link href="/catalog" className="underline underline-offset-4 hover:text-foreground">
                  Filter zurücksetzen
                </Link>
              </>
            )}
          </p>

          {exercises.length === 0 ? (
            <div className="rounded-xl border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
              {filtering ? (
                "Nichts gefunden. Versuch ein anderes Wort oder weniger Tags."
              ) : (
                <>
                  Noch keine Übungen.{" "}
                  <Link href="/catalog/neu" className="underline underline-offset-4 hover:text-foreground">
                    Erste Übung anlegen
                  </Link>
                </>
              )}
            </div>
          ) : (
            <ul className="divide-y rounded-xl border">
              {exercises.map((exercise) => (
                <li key={exercise.id}>
                  <Link
                    href={`/catalog/${exercise.id}`}
                    className="block space-y-2 px-4 py-4 transition-colors hover:bg-accent/50 sm:px-5"
                  >
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <h2 className="font-medium leading-snug">{exercise.title}</h2>
                      {exercise.origin && (
                        <Badge
                          variant="outline"
                          title="Herkunft"
                          className="max-w-full border-catalog/50 font-normal whitespace-normal text-foreground/80"
                        >
                          {exercise.origin}
                        </Badge>
                      )}
                    </div>
                    {exercise.suitable_for && (
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {plainText(exercise.suitable_for)}
                      </p>
                    )}
                    <ExerciseMeta exercise={exercise} />
                    {exercise.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {exercise.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="font-normal">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
