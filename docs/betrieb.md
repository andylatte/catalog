# Betrieb: Checkliste, Backup, Wiederherstellung

modulo läuft auf dem kostenlosen Supabase-Plan. Der hat keine eigenen Backups, deshalb
sichert eine GitHub Action jeden Sonntag Datenbank und Dateien verschlüsselt. Die
Sitzungsdoku ist zusätzlich mit einer Authenticator-App (MFA) geschützt.

## Checkliste vor dem Start

### Supabase

- [ ] Projekt in der Region **Central EU (Frankfurt)** anlegen. Die Region lässt sich später
      nicht ändern.
- [ ] Alle Dateien aus `supabase/migrations/` der Reihe nach im *SQL Editor* ausführen.
      Die letzte, `20261002090000_sessions_mfa.sql`, sperrt die Sitzungsdoku ohne MFA.
- [ ] *Authentication → Users → Add user*: dein Konto mit einem Passwort aus dem
      Passwortmanager (mindestens 12 Zeichen).
- [ ] *Authentication → Sign In / Providers*: „Allow new users to sign up“ ausschalten.
- [ ] *Authentication → Policies* (bzw. *Passwords*): Mindestlänge auf 12 setzen.
- [ ] MFA mit Authenticator-App (TOTP) ist bei Supabase immer an, auch im Free-Plan. Hier ist
      nichts zu tun.
- [ ] *Organization Settings → Legal Documents*: den AVV (Data Processing Addendum)
      herunterladen und ablegen. Er gilt mit den Nutzungsbedingungen bereits.
- [ ] Im eigenen Supabase-Konto (*Account → Security*) MFA einschalten.

### Vercel

- [ ] `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` eintragen.
- [ ] *Settings → Functions → Function Region*: **Frankfurt (fra1)**.
- [ ] Im Vercel-Konto MFA einschalten. Der AVV ist Teil der Vercel-Bedingungen.

### GitHub

- [ ] Im GitHub-Konto MFA einschalten.
- [ ] Im Repo unter *Settings → Secrets and variables → Actions* anlegen:

| Art | Name | Woher |
| --- | --- | --- |
| Secret | `SUPABASE_DB_URL` | Supabase → *Connect* → **Session pooler** → Verbindungs-URL, mit deinem Datenbank-Passwort statt `[YOUR-PASSWORD]` |
| Secret | `SUPABASE_SECRET_KEY` | Supabase → *Project Settings → API Keys* → Secret key (`sb_secret_…`) |
| Secret | `BACKUP_PASSWORD` | Selbst ausdenken, lang. **Zusätzlich im Passwortmanager speichern**, ohne es lässt sich kein Backup öffnen. |
| Variable (Reiter *Variables*) | `SUPABASE_URL` | dieselbe URL wie `NEXT_PUBLIC_SUPABASE_URL` |

Die Session-Pooler-URL ist nötig, weil GitHub keine IPv6-Verbindung zur direkten
Datenbank-Adresse aufbauen kann.

- [ ] Unter *Actions → Backup → Run workflow* einmal von Hand starten und prüfen, dass
      ein Download erscheint. Ebenso *Keep-alive* einmal starten.

### Erste Anmeldung

- [ ] In der App die Sitzungsdoku öffnen und die Authenticator-App einrichten.
- [ ] Den angezeigten Schlüssel zusätzlich im Passwortmanager speichern.

## Was automatisch läuft

| Workflow | Wann | Was |
| --- | --- | --- |
| `Backup` | sonntags 3 Uhr UTC | Datenbank-Inhalte, Konto mit MFA-Faktor und alle Fotos und Anhänge, verschlüsselt mit `BACKUP_PASSWORD`. Liegt 90 Tage unter *Actions* als Download, also etwa die letzten 12 Sicherungen. |
| `Keep-alive` | täglich | Eine kleine Anfrage, damit Supabase das Projekt nicht pausiert. |

Schlägt ein Lauf fehl, schickt GitHub eine E-Mail.

## Handy verloren

Mit dem gespeicherten Schlüssel aus dem Passwortmanager kannst du den Code in einer neuen
Authenticator-App wieder erzeugen. Ohne Schlüssel: Supabase-Dashboard → *Authentication →
Users* → dein Konto → MFA-Faktor löschen. Beim nächsten Öffnen der Sitzungsdoku richtest du
die App dann neu ein.

## Wiederherstellen

1. **Backup holen:** *Actions → Backup* → gewünschter Lauf → unter *Artifacts* herunterladen
   und das ZIP entpacken.
2. **Entschlüsseln** (gpg ist auf macOS über `brew install gnupg` erhältlich):

   ```bash
   mkdir wiederherstellung
   gpg -d backup-JJJJ-MM-TT.tar.gz.gpg | tar -xzf - -C wiederherstellung
   ```

   Darin liegen `db/public.sql` (Inhalte), `db/auth.sql` (Konto und MFA-Faktor),
   `db/schema.sql` (zum Nachschlagen) und `storage/` mit allen Dateien.
3. **Neues Supabase-Projekt** in Frankfurt anlegen und alle Migrationen ausführen
   (siehe Checkliste). Kein Konto anlegen, das kommt aus dem Backup.
4. **Datenbank einspielen** mit der Session-Pooler-URL des neuen Projekts, erst das Konto,
   dann die Inhalte:

   ```bash
   psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f wiederherstellung/db/auth.sql
   psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f wiederherstellung/db/public.sql
   ```

5. **Dateien hochladen:**

   ```bash
   npm ci
   SUPABASE_URL=… SUPABASE_SECRET_KEY=… node scripts/restore-storage.mjs wiederherstellung/storage
   ```

6. In Vercel und in den GitHub-Einstellungen die Werte des neuen Projekts eintragen.
