// Lädt alle Dateien aus den Storage-Buckets in ein lokales Verzeichnis.
// Aufruf: node scripts/backup-storage.mjs <zielverzeichnis>
// Braucht SUPABASE_URL und SUPABASE_SECRET_KEY (Secret- oder service_role-Key).

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

const BUCKETS = ["fotos", "anhaenge"];
const PAGE = 1000;

const target = process.argv[2];
const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
if (!target || !SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error("Aufruf: SUPABASE_URL=… SUPABASE_SECRET_KEY=… node scripts/backup-storage.mjs <ziel>");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Liefert alle Dateipfade unter prefix, Ordner werden rekursiv durchlaufen. */
async function listFiles(bucket, prefix = "") {
  const files = [];
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(prefix, { limit: PAGE, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw new Error(`${bucket}/${prefix}: ${error.message}`);
    for (const item of data) {
      const itemPath = prefix ? `${prefix}/${item.name}` : item.name;
      // Ordner haben in der Storage-API keine id.
      if (item.id === null) files.push(...(await listFiles(bucket, itemPath)));
      else files.push(itemPath);
    }
    if (data.length < PAGE) return files;
  }
}

let total = 0;
for (const bucket of BUCKETS) {
  const files = await listFiles(bucket);
  for (const file of files) {
    const { data, error } = await supabase.storage.from(bucket).download(file);
    if (error) throw new Error(`${bucket}/${file}: ${error.message}`);
    const out = path.join(target, bucket, file);
    await mkdir(path.dirname(out), { recursive: true });
    await writeFile(out, Buffer.from(await data.arrayBuffer()));
  }
  console.log(`${bucket}: ${files.length} Dateien`);
  total += files.length;
}
console.log(`Gesamt: ${total} Dateien`);
