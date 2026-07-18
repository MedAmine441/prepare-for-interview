// src/lib/db/index.ts

import { join, dirname } from "path";
import { mkdirSync } from "fs";
import { DatabaseSync } from "node:sqlite";

/**
 * SQLite database at data/frontmaster.db (WAL mode).
 * Uses Node's built-in sqlite driver — no native build step.
 *
 * The driver is synchronous; repositories keep async signatures so
 * server actions and any future driver swap stay source-compatible.
 *
 * FRONTMASTER_DB_PATH overrides the location — the test suite points it
 * at a throwaway file so tests never touch real study data.
 */
let db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (db) return db;

  const dbPath =
    process.env.FRONTMASTER_DB_PATH ||
    join(process.cwd(), "data", "frontmaster.db");
  mkdirSync(dirname(dbPath), { recursive: true });
  db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  initSchema(db);
  return db;
}

function initSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      key_points TEXT NOT NULL DEFAULT '[]',
      follow_up_questions TEXT NOT NULL DEFAULT '[]',
      related_topics TEXT NOT NULL DEFAULT '[]',
      source TEXT NOT NULL,
      common_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      is_archived INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
    CREATE INDEX IF NOT EXISTS idx_questions_archived ON questions(is_archived);

    CREATE TABLE IF NOT EXISTS progress (
      id TEXT PRIMARY KEY,
      question_id TEXT NOT NULL UNIQUE,
      ease_factor REAL NOT NULL,
      sm2_interval INTEGER NOT NULL,
      repetitions INTEGER NOT NULL,
      next_review_date TEXT NOT NULL,
      last_review_date TEXT,
      total_reviews INTEGER NOT NULL DEFAULT 0,
      correct_reviews INTEGER NOT NULL DEFAULT 0,
      average_quality REAL NOT NULL DEFAULT 0,
      review_history TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_progress_next_review ON progress(next_review_date);

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      started_at TEXT NOT NULL,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // First-run metadata
  const now = JSON.stringify(new Date().toISOString());
  const insertMeta = db.prepare(
    "INSERT OR IGNORE INTO metadata (key, value) VALUES (?, ?)",
  );
  insertMeta.run("version", "2");
  insertMeta.run("createdAt", now);
  insertMeta.run("totalStudySessions", "0");
  insertMeta.run("totalInterviewSessions", "0");
  insertMeta.run("studyStreak", "0");
  insertMeta.run("lastStudyDate", "null");
}

/**
 * Metadata helpers — values are stored JSON-encoded.
 */
export function getMeta<T>(key: string, fallback: T): T {
  const row = getDb()
    .prepare("SELECT value FROM metadata WHERE key = ?")
    .get(key) as { value: string } | undefined;
  if (!row) return fallback;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return fallback;
  }
}

export function setMeta(key: string, value: unknown): void {
  getDb()
    .prepare(
      "INSERT INTO metadata (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    )
    .run(key, JSON.stringify(value ?? null));
}

/**
 * Run a set of writes atomically.
 */
export function transaction<T>(fn: () => T): T {
  const database = getDb();
  database.exec("BEGIN");
  try {
    const result = fn();
    database.exec("COMMIT");
    return result;
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}
