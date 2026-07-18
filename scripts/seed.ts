// scripts/seed.ts

/**
 * Database Seeding Script (SQLite)
 *
 * Run with: npm run seed          — add missing seed questions (idempotent)
 *           npm run seed:clear    — remove seed questions + ALL progress, reseed
 *
 * Seed question ids are positional per category (e.g. css-layout-003),
 * so append new seed questions at the end of their category arrays.
 */

import { ALL_SEED_QUESTIONS } from "../data/seed-data";
import { getDb, setMeta } from "../src/lib/db";

function generateQuestionId(category: string, index: number): string {
  return `${category}-${String(index).padStart(3, "0")}`;
}

async function seed(options: { clearExisting?: boolean } = {}) {
  console.log("🌱 Starting database seeding...\n");

  const db = getDb();

  if (options.clearExisting) {
    console.log("🗑️  Clearing existing seed questions and all progress...");
    db.exec("BEGIN");
    try {
      db.prepare("DELETE FROM questions WHERE source = 'seed'").run();
      db.exec("DELETE FROM progress");
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
    setMeta("studyStreak", 0);
    setMeta("lastStudyDate", null);
  }

  const insertQuestion = db.prepare(
    `INSERT OR IGNORE INTO questions
       (id, category, difficulty, question, answer, key_points,
        follow_up_questions, related_topics, source, common_at,
        created_at, updated_at, is_archived)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
  );
  const insertProgress = db.prepare(
    `INSERT OR IGNORE INTO progress
       (id, question_id, ease_factor, sm2_interval, repetitions,
        next_review_date, last_review_date, total_reviews, correct_reviews,
        average_quality, review_history, created_at, updated_at)
     VALUES (?, ?, 2.5, 0, 0, ?, NULL, 0, 0, 0, '[]', ?, ?)`,
  );

  const categoryCounters: Record<string, number> = {};
  const now = new Date().toISOString();
  let addedCount = 0;
  let skippedCount = 0;

  db.exec("BEGIN");
  try {
    for (const input of ALL_SEED_QUESTIONS) {
      const category = input.category;
      categoryCounters[category] = (categoryCounters[category] || 0) + 1;
      const questionId = generateQuestionId(category, categoryCounters[category]);

      const result = insertQuestion.run(
        questionId,
        input.category,
        input.difficulty,
        input.question,
        input.answer,
        JSON.stringify(input.keyPoints),
        JSON.stringify(input.followUpQuestions),
        JSON.stringify(input.relatedTopics),
        input.source,
        input.commonAt ? JSON.stringify(input.commonAt) : null,
        now,
        now,
      );

      if (result.changes > 0) {
        insertProgress.run(`progress-${questionId}`, questionId, now, now, now);
        addedCount++;
      } else {
        skippedCount++;
      }
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  setMeta("updatedAt", now);

  const total = (
    db.prepare("SELECT COUNT(*) AS n FROM questions").get() as { n: number }
  ).n;
  const progressTotal = (
    db.prepare("SELECT COUNT(*) AS n FROM progress").get() as { n: number }
  ).n;

  console.log("✅ Seeding complete!\n");
  console.log("📊 Summary:");
  console.log(`   • Questions added: ${addedCount}`);
  console.log(`   • Questions skipped (already exist): ${skippedCount}`);
  console.log(`   • Total questions in database: ${total}`);
  console.log(`   • Progress records: ${progressTotal}`);
  console.log(`\n📁 Database: data/frontmaster.db`);

  console.log("\n📚 Questions by category:");
  const rows = db
    .prepare(
      "SELECT category, COUNT(*) AS n FROM questions GROUP BY category ORDER BY n DESC",
    )
    .all() as unknown as Array<{ category: string; n: number }>;
  rows.forEach(({ category, n }) => console.log(`   • ${category}: ${n}`));
}

// Run the seed script
const args = process.argv.slice(2);
const clearExisting = args.includes("--clear") || args.includes("-c");

seed({ clearExisting })
  .then(() => {
    console.log("\n🎉 Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });
