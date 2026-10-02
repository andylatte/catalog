-- Sitzungsdoku, zweite Runde: Endzeit statt Dauer-Eingabe, Teilnehmer als Liste.

-- Endzeit ---------------------------------------------------------------

-- Die Dauer wird ab jetzt aus Start und Ende berechnet und bleibt als Spalte erhalten,
-- damit Listen sie direkt anzeigen können. Bestehende Sitzungen bekommen ihr Ende
-- aus Start + Dauer.
alter table public.sessions add column end_time time;

update public.sessions
set end_time = start_time + make_interval(mins => duration_minutes)
where start_time is not null and duration_minutes is not null;

-- Teilnehmer ------------------------------------------------------------

-- Bisher ein Freitext; jetzt eine Namensliste, damit man nach Personen filtern kann.
-- Bestehende Einträge werden an Komma, Semikolon und Zeilenumbruch aufgeteilt.
alter table public.sessions add column participant_list text[] not null default '{}';

update public.sessions
set participant_list = array_remove(
  array(
    select trim(name)
    from regexp_split_to_table(participants, E'[,;\n]+') as name
  ),
  ''
)
where participants is not null;

alter table public.sessions drop column participants;
alter table public.sessions rename column participant_list to participants;

create index sessions_participants_idx on public.sessions using gin (participants);

-- Alle Teilnehmer mit Anzahl der Sitzungen, für Vorschläge und Filter.
create or replace function public.session_participants()
returns table (name text, count bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select p, count(*)
  from public.sessions, unnest(participants) as p
  group by p
  order by lower(p);
$$;
