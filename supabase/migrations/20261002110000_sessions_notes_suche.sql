-- Sitzungsdoku: Session-Notes (z. B. KI-Notizen aus Zoom) und Suche über alle Sitzungen.

alter table public.sessions add column notes text;

-- Sucht in allen Textfeldern, Auftraggeber, Ort und Teilnehmern. Jedes Wort der
-- Anfrage muss irgendwo vorkommen (Groß/klein egal). Läuft mit den Rechten der
-- Aufrufenden, die Policies (Eigentümer, MFA) gelten also weiter.
create or replace function public.search_sessions(query text)
returns setof public.sessions
language sql
stable
security invoker
set search_path = ''
as $$
  select s.*
  from public.sessions s
  where not exists (
    select 1
    from regexp_split_to_table(lower(trim(query)), '\s+') as word
    where word <> ''
      and strpos(
        lower(concat_ws(' ',
          s.client, s.location, array_to_string(s.participants, ' '),
          s.methods, s.observations, s.self_reflection, s.notes
        )),
        word
      ) = 0
  )
  order by s.held_on desc, s.start_time desc nulls last, s.created_at desc;
$$;
