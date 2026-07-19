// src/app/api/backup/route.ts

import { getDb } from "@/lib/db";

/**
 * Full JSON backup of the database — questions (including archived),
 * study progress, interview sessions, and metadata. The bank contains
 * hand-tuned and AI-generated content that lives nowhere else, so this
 * is the "one bad seed:clear away from losing it" insurance.
 *
 * Restore with: npm run restore -- <backup-file.json>
 */
export async function GET() {
  const db = getDb();

  const backup = {
    format: "frontmaster-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    questions: db.prepare("SELECT * FROM questions").all(),
    progress: db.prepare("SELECT * FROM progress").all(),
    sessions: db.prepare("SELECT * FROM sessions").all(),
    metadata: db.prepare("SELECT * FROM metadata").all(),
  };

  const date = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="frontmaster-backup-${date}.json"`,
    },
  });
}
