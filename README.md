# Übungskatalog

Persönliche Web-App für Übungen aus Theatertherapie und Supervision: Übungen anlegen, per Suchschlitz und Tags finden, und unter jeder Übung ein Praxis-Log mit Datum und Fotos führen.

Gebaut mit Next.js (App Router), Tailwind CSS, shadcn/ui und Supabase (Datenbank, Login, Foto-Speicher).

## Einrichten

1. **Supabase-Projekt anlegen** auf [supabase.com](https://supabase.com).
2. **Datenbank einrichten:** Im Dashboard unter *SQL Editor* den Inhalt von
   [`supabase/migrations/20261001000000_init.sql`](supabase/migrations/20261001000000_init.sql)
   ausführen. Das legt Tabellen, Suche, Zugriffsregeln und den privaten Foto-Bucket `fotos` an.
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
| `src/app/(katalog)/page.tsx` | Übersicht mit Suche und Tag-Filter |
| `src/app/(katalog)/uebungen/` | Übung anlegen, ansehen, bearbeiten |
| `src/app/actions.ts` | Speichern, Löschen, Anmelden (Server Actions) |
| `src/components/comment-form.tsx` | Praxis-Log-Eintrag mit Foto-Upload |
| `src/proxy.ts` | Leitet Abgemeldete zum Login |
| `supabase/migrations/` | Datenbankschema, Suchfunktion, Zugriffsregeln |

**Felder einer Übung:** Pflicht sind Titel und Ablauf. Optional: wofür geeignet, Tags,
online geeignet (ja/nein/keine Angabe), Herkunft, Gruppengröße, Material.

**Suche:** Jedes eingegebene Wort muss vorkommen, Wortanfänge reichen („spieg“ findet
„Spiegeln“), Umlaute und Beugungen werden toleriert. Durchsucht werden alle Felder der
Übung und die Praxis-Log-Einträge. Tags filtern zusätzlich; mehrere Tags bedeuten „alle davon“.

**Fotos** werden vor dem Hochladen auf höchstens 2000 px verkleinert und liegen in einem
privaten Bucket. Angezeigt werden sie über Links, die nach einer Stunde ablaufen.
