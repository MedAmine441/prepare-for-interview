// scripts/restore.ts
//
// Restore a backup produced by GET /api/backup into the database.
//
//   npm run restore -- path/to/frontmaster-backup-2026-07-19.json
//
// Rows are upserted by primary key: existing rows with the same id are
// overwritten, everything else in the current database is left alone.
// (For a byte-identical restore, delete data/frontmaster.db* first.)

import { readFileSync } from "fs";
import { getDb, transaction } from "@/lib/db";

interface BackupFile {
  format: string;
  version: number;
  exportedAt: string;
  questions: Record<string, unknown>[];
  progress: Record<string, unknown>[];
  sessions: Record<string, unknown>[];
  metadata: Array<{ key: string; value: string }>;
}

function upsertAll(table: string, rows: Record<string, unknown>[]): number {
  if (rows.length === 0) return 0;
  const db = getDb();
  const columns = Object.keys(rows[0]);
  const stmt = db.prepare(
    `INSERT OR REPLACE INTO ${table} (${columns.join(", ")})
     VALUES (${columns.map(() => "?").join(", ")})`,
  );
  for (const row of rows) {
    stmt.run(...(columns.map((c) => row[c]) as never[]));
  }
  return rows.length;
}

function main(): void {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: npm run restore -- <backup-file.json>");
    process.exit(1);
  }

  let backup: BackupFile;
  try {
    backup = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    console.error(`Could not read ${file}:`, error);
    process.exit(1);
  }

  if (backup.format !== "frontmaster-backup" || !Array.isArray(backup.questions)) {
    console.error("Not a FrontMaster backup file (missing format marker).");
    process.exit(1);
  }

  console.log(`Restoring backup from ${backup.exportedAt}...`);

  transaction(() => {
    // Questions first — progress rows reference them via foreign key
    console.log(`  questions: ${upsertAll("questions", backup.questions)}`);
    console.log(`  progress:  ${upsertAll("progress", backup.progress ?? [])}`);
    console.log(`  sessions:  ${upsertAll("sessions", backup.sessions ?? [])}`);
    console.log(`  metadata:  ${upsertAll("metadata", backup.metadata ?? [])}`);
  });

  console.log("✅ Restore complete.");
}

main();
