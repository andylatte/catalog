#!/usr/bin/env bash
# Einmalige Übernahme: Die ersten Migrationen wurden von Hand im SQL Editor
# eingespielt. Supabase kennt sie deshalb nicht. Dieses Skript erkennt am
# Schema, was schon da ist, und trägt genau diese Versionen als erledigt ein.
# Danach spielt `supabase db push` nur noch die fehlenden ein.
# Läuft die Historie schon, tut das Skript nichts.
set -euo pipefail

db_url="${SUPABASE_DB_URL:?SUPABASE_DB_URL fehlt}"
q() { psql "$db_url" -tAX -v ON_ERROR_STOP=1 -c "$1"; }

has_history=$(q "select to_regclass('supabase_migrations.schema_migrations') is not null")
if [ "$has_history" = "t" ] && [ "$(q 'select count(*) from supabase_migrations.schema_migrations')" != "0" ]; then
  echo "Migrations-Historie vorhanden, nichts zu übernehmen."
  exit 0
fi

applied=()
# Version und eine Prüfung, die nur nach dieser Migration wahr ist.
check() {
  if [ "$(q "select $2")" = "t" ]; then
    applied+=("$1")
    echo "schon eingespielt: $1"
  fi
}
check 20261001000000 "to_regclass('public.exercises') is not null"
check 20261001120000 "to_regclass('public.sessions') is not null"
check 20261002080000 "exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'sessions' and column_name = 'end_time')"
check 20261002090000 "exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'sessions' and policyname = 'Sitzungen nur mit MFA')"

if [ ${#applied[@]} -eq 0 ]; then
  echo "Leere Datenbank, alle Migrationen laufen über db push."
  exit 0
fi

supabase migration repair --status applied --db-url "$db_url" --yes "${applied[@]}"
