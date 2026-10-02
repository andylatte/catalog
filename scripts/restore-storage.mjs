// Lädt ein entpacktes Storage-Backup wieder in die Buckets hoch.
// Aufruf: node scripts/restore-storage.mjs <verzeichnis mit fotos/ und anhaenge/>
// Braucht SUPABASE_URL und SUPABASE_SECRET_KEY (Secret- oder service_role-Key).

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

const BUCKETS = ["fotos", "anhaenge"];
const TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".heic": "image/heic",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

const source = process.argv[2];
const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
if (!source || !SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error("Aufruf: SUPABASE_URL=… SUPABASE_SECRET_KEY=… node scripts/restore-storage.mjs <quelle>");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

for (const bucket of BUCKETS) {
  const root = path.join(source, bucket);
  const entries = await readdir(root, { recursive: true, withFileTypes: true }).catch(() => []);
  let count = 0;
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const file = path.join(entry.parentPath, entry.name);
    const key = path.relative(root, file).split(path.sep).join("/");
    const { error } = await supabase.storage
      .from(bucket)
      .upload(key, await readFile(file), {
        upsert: true,
        contentType: TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream",
      });
    if (error) throw new Error(`${bucket}/${key}: ${error.message}`);
    count++;
  }
  console.log(`${bucket}: ${count} Dateien hochgeladen`);
}
