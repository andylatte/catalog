-- Übungskatalog: Übungen, Praxis-Log (Kommentare) mit Fotos, Volltextsuche.
-- Einzelnutzer-App: jede Zeile gehört genau einem Konto (owner_id), RLS lässt
-- nur dieses Konto lesen und schreiben.

create extension if not exists unaccent with schema extensions;

-- Übungen ---------------------------------------------------------------

create table public.exercises (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title        text not null check (length(trim(title)) > 0),
  procedure    text not null check (length(trim(procedure)) > 0),
  suitable_for text,
  tags         text[] not null default '{}',
  online       boolean,
  origin       text,
  group_size   text,
  material     text,
  fts          tsvector,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index exercises_owner_idx on public.exercises (owner_id);
create index exercises_tags_idx on public.exercises using gin (tags);
create index exercises_fts_idx on public.exercises using gin (fts);

-- Praxis-Log ------------------------------------------------------------

create table public.comments (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  exercise_id  uuid not null references public.exercises (id) on delete cascade,
  body         text not null default '',
  practiced_on date not null default current_date,
  fts          tsvector,
  created_at   timestamptz not null default now()
);

create index comments_exercise_idx on public.comments (exercise_id, practiced_on desc);
create index comments_fts_idx on public.comments using gin (fts);

create table public.comment_photos (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  comment_id uuid not null references public.comments (id) on delete cascade,
  path       text not null,
  created_at timestamptz not null default now()
);

create index comment_photos_comment_idx on public.comment_photos (comment_id);

-- Suchindex pflegen -----------------------------------------------------

create or replace function public.search_text(value text)
returns tsvector
language sql
immutable
set search_path = ''
as $$
  select to_tsvector('german'::regconfig, extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(value, '')));
$$;

create or replace function public.exercises_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.tags := coalesce(new.tags, '{}');
  new.fts :=
    setweight(public.search_text(new.title), 'A') ||
    setweight(public.search_text(array_to_string(new.tags, ' ')), 'A') ||
    setweight(public.search_text(new.suitable_for), 'B') ||
    setweight(public.search_text(new.procedure), 'C') ||
    setweight(public.search_text(concat_ws(' ', new.origin, new.material, new.group_size)), 'D');
  new.updated_at := now();
  return new;
end;
$$;

create trigger exercises_before_write
before insert or update on public.exercises
for each row execute function public.exercises_before_write();

create or replace function public.comments_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.fts := public.search_text(new.body);
  return new;
end;
$$;

create trigger comments_before_write
before insert or update on public.comments
for each row execute function public.comments_before_write();

-- Suche -----------------------------------------------------------------

-- Freitextsuche wie ein Suchschlitz: jedes Wort muss vorkommen, Wortanfänge
-- reichen ("spieg" findet "Spiegeln"). Durchsucht Übung und Praxis-Log.
-- tag_filter: nur Übungen, die alle diese Tags haben.
create or replace function public.search_exercises(q text default '', tag_filter text[] default '{}')
returns setof public.exercises
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  w text;
  word_query tsquery;
  tsq tsquery;
begin
  for w in
    select distinct t
    from regexp_split_to_table(
      lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(q, ''))),
      '[^[:alnum:]]+'
    ) as t
    where t <> ''
  loop
    -- Füllwörter ("und", "der") stehen nicht im Index und werden übersprungen.
    if numnode(to_tsquery('german', quote_literal(w) || ':*')) = 0 then
      continue;
    end if;
    -- 'simple' trifft Wortanfänge ohne Stemming, 'german' trifft Flexionen
    -- ("Gruppen" findet "Gruppe"). Eines von beiden reicht pro Wort.
    word_query := to_tsquery('simple', quote_literal(w) || ':*')
               || to_tsquery('german', quote_literal(w) || ':*');
    tsq := case when tsq is null then word_query else tsq && word_query end;
  end loop;

  return query
    select e.*
    from public.exercises e
    where (cardinality(tag_filter) = 0 or e.tags @> tag_filter)
      and (
        tsq is null
        or e.fts @@ tsq
        or exists (
          select 1 from public.comments c
          where c.exercise_id = e.id and c.fts @@ tsq
        )
      )
    order by
      case when tsq is null then 0 else ts_rank(e.fts, tsq) end desc,
      lower(e.title);
end;
$$;

-- Alle Tags mit Anzahl, für die Filterleiste.
create or replace function public.all_tags()
returns table (tag text, count bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select t, count(*)
  from public.exercises, unnest(tags) as t
  group by t
  order by lower(t);
$$;

-- Row Level Security ----------------------------------------------------

alter table public.exercises enable row level security;
alter table public.comments enable row level security;
alter table public.comment_photos enable row level security;

create policy "Eigene Übungen" on public.exercises
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Eigene Kommentare" on public.comments
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Eigene Fotos" on public.comment_photos
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- Foto-Speicher ---------------------------------------------------------

-- Privater Bucket; Dateien liegen unter <user-id>/<übung-id>/<datei>.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', false, 15728640, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
on conflict (id) do nothing;

create policy "Eigene Fotos lesen" on storage.objects
  for select to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Eigene Fotos hochladen" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Eigene Fotos löschen" on storage.objects
  for delete to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = (select auth.uid())::text);
