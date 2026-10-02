-- Sitzungsdoku: Supervisions- und Therapiestunden mit Anhängen und Kommentaren.
-- Gleiche Regeln wie der Katalog: jede Zeile gehört einem Konto (owner_id),
-- RLS lässt nur dieses Konto lesen und schreiben.

-- Sitzungen -------------------------------------------------------------

create table public.sessions (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind             text not null check (kind in ('supervision', 'therapie')),
  held_on          date not null,
  start_time       time,
  duration_minutes integer check (duration_minutes > 0),
  participants     text,
  client           text,
  setting          text check (setting in ('einzel', 'gruppe')),
  methods          text,
  observations     text,
  online           boolean,
  location         text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index sessions_owner_date_idx on public.sessions (owner_id, held_on desc, start_time desc);

create or replace function public.sessions_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger sessions_before_update
before update on public.sessions
for each row execute function public.sessions_before_update();

-- Anhänge ---------------------------------------------------------------

create table public.session_files (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  session_id uuid not null references public.sessions (id) on delete cascade,
  path       text not null,
  name       text not null,
  size       bigint,
  created_at timestamptz not null default now()
);

create index session_files_session_idx on public.session_files (session_id);

-- Kommentare ------------------------------------------------------------

create table public.session_comments (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  session_id uuid not null references public.sessions (id) on delete cascade,
  body       text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

create index session_comments_session_idx on public.session_comments (session_id, created_at);

-- Row Level Security ----------------------------------------------------

alter table public.sessions enable row level security;
alter table public.session_files enable row level security;
alter table public.session_comments enable row level security;

create policy "Eigene Sitzungen" on public.sessions
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Eigene Anhänge" on public.session_files
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Eigene Sitzungskommentare" on public.session_comments
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- Anhang-Speicher -------------------------------------------------------

-- Privater Bucket; Dateien liegen unter <user-id>/<sitzung-id>/<zufall>/<dateiname>.
-- Alle Dateitypen erlaubt (PDF, Fotos, Dokumente), höchstens 25 MB pro Datei.
insert into storage.buckets (id, name, public, file_size_limit)
values ('anhaenge', 'anhaenge', false, 26214400)
on conflict (id) do nothing;

create policy "Eigene Anhänge lesen" on storage.objects
  for select to authenticated
  using (bucket_id = 'anhaenge' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Eigene Anhänge hochladen" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'anhaenge' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Eigene Anhänge löschen" on storage.objects
  for delete to authenticated
  using (bucket_id = 'anhaenge' and (storage.foldername(name))[1] = (select auth.uid())::text);
