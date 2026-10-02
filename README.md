# modulo

Persönliche Web-App für Theatertherapie und Supervision. Die Startseite führt in zwei Bereiche.

Der **Übungskatalog** unter `/catalog`: Übungen anlegen, per Suchschlitz und Tags finden, und unter jeder Übung ein Praxis-Log mit Datum und Fotos führen.

Dazu gehört die **Sitzungsdoku** unter `/sessions`: Supervisions- und Therapiestunden mit Anhängen und Kommentaren dokumentieren, im gleichen Stil mit Petrol als Akzentfarbe.

Gebaut mit Next.js (App Router), Tailwind CSS, shadcn/ui und Supabase (Datenbank, Login, Foto-Speicher).

## Einrichten

1. **Supabase-Projekt anlegen** auf [supabase.com](https://supabase.com).
2. **Datenbank einrichten:** Im Dashboard unter *SQL Editor* den Inhalt von
   [`supabase/migrations/20261001000000_init.sql`](supabase/migrations/20261001000000_init.sql)
   ausführen, danach ebenso
   [`supabase/migrations/20261001120000_sessions.sql`](supabase/migrations/20261001120000_sessions.sql)
   für die Sitzungsdoku und danach
   [`supabase/migrations/20261002080000_sessions_endzeit_teilnehmer.sql`](supabase/migrations/20261002080000_sessions_endzeit_teilnehmer.sql)
   (Endzeit, Teilnehmerliste). Das legt Tabellen, Suche, Zugriffsregeln und die privaten Buckets
   `fotos` und `anhaenge` an.
   (Alternativ mit der Supabase CLI: `npx supabase link` und `npx supabase db push`.)
3. **Eigenes Konto anlegen:** *Authentication → Users → Add user* mit E-Mail und Passwort.
   Danach unter *Authentication → Sign In / Providers* die Option „Allow new users to sign up“
   ausschalten, damit sich niemand sonst registrieren kann.
4. **Umgebungsvariablen:** `.env.example` nach `.env.local` kopieren und URL sowie
   Publishable Key aus *Project Settings → API Keys* eintragen.
5. **Starten:**

   ```bash
   npm install
   npm run dev
   ```

   Die App läuft dann auf http://localhost:3000.

## Online stellen

Am einfachsten über [Vercel](https://vercel.com): Repository importieren, die beiden
Umgebungsvariablen aus `.env.local` eintragen, fertig. Danach ist die App von jedem Gerät
erreichbar; ohne Anmeldung sieht man nur die Login-Seite.

## Aufbau

| Pfad | Inhalt |
| --- | --- |
| `src/app/page.tsx` | Startseite mit Logo und den beiden Bereichen |
| `src/app/(katalog)/catalog/` | Übersicht mit Suche und Tag-Filter; Übung anlegen, ansehen, bearbeiten |
| `src/app/actions.ts` | Speichern, Löschen, Anmelden (Server Actions) |
| `src/components/comment-form.tsx` | Praxis-Log-Eintrag mit Foto-Upload |
| `src/app/(sessions)/sessions/` | Sitzungsdoku: Liste, anlegen, ansehen, bearbeiten; `/sessions/<name>` zeigt alle Sitzungen mit einer Person |
| `src/app/session-actions.ts` | Sitzungen und Kommentare speichern und löschen |
| `src/components/session-form.tsx` | Eingabemaske einer Sitzung mit Datei-Upload |
| `src/proxy.ts` | Leitet Abgemeldete zum Login |
| `supabase/migrations/` | Datenbankschema, Suchfunktion, Zugriffsregeln |

**Felder einer Übung:** Pflicht sind Titel und Ablauf. Optional: wofür geeignet, Tags,
online geeignet (ja/nein/keine Angabe), Herkunft, Gruppengröße, Material.

**Suche:** Jedes eingegebene Wort muss vorkommen, Wortanfänge reichen („spieg“ findet
„Spiegeln“), Umlaute und Beugungen werden toleriert. Durchsucht werden alle Felder der
Übung und die Praxis-Log-Einträge. Tags filtern zusätzlich; mehrere Tags bedeuten „alle davon“.

**Fotos** werden vor dem Hochladen auf höchstens 2000 px verkleinert und liegen in einem
privaten Bucket. Angezeigt werden sie über Links, die nach einer Stunde ablaufen.

**Felder einer Sitzung:** Pflicht sind Art (Supervision oder Therapie) und Datum. Optional:
Beginn und Ende (die Dauer wird daraus berechnet), Auftraggeber, Teilnehmer, Einzel/Gruppe, Live/Online mit Ort bzw.
Plattform, Methoden/Programm, Beobachtungen, Dateianhänge (bis 25 MB je Datei, Fotos werden
wie im Katalog verkleinert). Die Übersicht zeigt Datum, Art, Dauer, Auftraggeber und Teilnehmer und lässt
sich nach Art filtern; auf der Detailseite stehen die Kommentare. Teilnehmer werden als Namen
eingegeben (bekannte werden vorgeschlagen); ein Klick auf einen Namen zeigt alle Sitzungen mit ihm.

**Formatierung** in Methoden, Beobachtungen und Kommentaren: `- ` oder `1. ` am Zeilenanfang
für Listen, `**fett**`, `[rot]Text[/rot]` (auch `grün`, `blau`, `orange`, `lila`).
