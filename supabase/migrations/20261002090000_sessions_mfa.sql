-- Sitzungsdoku nur mit zweitem Faktor --------------------------------------
-- Zusätzliche restriktive Policies: Sie gelten neben den bestehenden
-- Eigentümer-Policies und verlangen eine Anmeldung mit MFA (aal2).
-- Wer nur das Passwort kennt, sieht so auch über die API keine Sitzungen.

create policy "Sitzungen nur mit MFA" on public.sessions
  as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

create policy "Anhänge nur mit MFA" on public.session_files
  as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

create policy "Sitzungskommentare nur mit MFA" on public.session_comments
  as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2')
  with check ((select auth.jwt() ->> 'aal') = 'aal2');

-- Im Storage betrifft die Sperre nur den Bucket der Sitzungsanhänge.
create policy "Sitzungsanhänge nur mit MFA" on storage.objects
  as restrictive for all to authenticated
  using (bucket_id <> 'anhaenge' or (select auth.jwt() ->> 'aal') = 'aal2')
  with check (bucket_id <> 'anhaenge' or (select auth.jwt() ->> 'aal') = 'aal2');
