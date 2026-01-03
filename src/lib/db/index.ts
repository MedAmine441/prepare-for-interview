// src/lib/db/index.ts

import { join } from "path";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import type { DatabaseSchema } from "./schema";
import { DEFAULT_DATABASE, isValidDatabaseSchema } from "./schema";

/**
 * Database file path - uses data/db.json relative to project root
 */
const DB_PATH = join(process.cwd(), "data", "db.json");

/**
 * Singleton database instance
 */
let db: Low<DatabaseSchema> | null = null;

/**
 * Get or create the database instance
 * This ensures we only have one database connection throughout the app
 */
export async function getDatabase(): Promise<Low<DatabaseSchema>> {
  if (db) {
    return db;
  }

  // Create adapter
  const adapter = new JSONFile<DatabaseSchema>(DB_PATH);

  // Initialize database
  db = new Low<DatabaseSchema>(adapter, DEFAULT_DATABASE);

  // Read from file
  await db.read();

  // Only initialize if data is null or invalid structure
  // Don't reset if it's just empty arrays (that's valid!)
  if (!db.data) {
    console.log("No database found, initializing new database...");
    db.data = DEFAULT_DATABASE;
    await db.write();
  } else if (!isValidDatabaseSchema(db.data)) {
    console.warn("Invalid database structure detected, resetting...");
    db.data = DEFAULT_DATABASE;
    await db.write();
  }
  // If data exists and is valid, don't touch it even if arrays are empty

  return db;
}

/**
 * Write database to disk
 * Helper function to ensure consistent write operations
 */
export async function writeDatabase(
  database: Low<DatabaseSchema>
): Promise<void> {
  await database.write();
}

/**
 * Reset database to default state
 * WARNING: This will delete all data
 */
export async function resetDatabase(): Promise<void> {
  const database = await getDatabase();
  database.data = DEFAULT_DATABASE;
  await database.write();
}
