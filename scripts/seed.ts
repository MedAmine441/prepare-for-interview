// scripts/seed.ts

/**
 * Database Seeding Script
 *
 * Run with: npx tsx scripts/seed.ts
 *
 * This script:
 * 1. Clears existing questions (optional)
 * 2. Seeds the database with high-quality interview questions
 * 3. Creates initial progress records
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";
import { ALL_SEED_QUESTIONS } from "../data/seed-data";
import type { Question, QuestionProgress } from "../src/types";
import {
  createQuestionId,
  createProgressId,
  createEaseFactor,
} from "../src/types";
import { nanoid } from "nanoid";

// Database file path
const DB_PATH = join(process.cwd(), "data", "db.json");

interface DatabaseSchema {
  questions: Question[];
  progress: QuestionProgress[];
  sessions: unknown[];
  metadata: {
    version: number;
    createdAt: string;
    updatedAt: string;
    totalStudySessions: number;
    totalInterviewSessions: number;
    studyStreak: number;
    lastStudyDate: string | null;
  };
}

const defaultData: DatabaseSchema = {
  questions: [],
  progress: [],
  sessions: [],
  metadata: {
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalStudySessions: 0,
    totalInterviewSessions: 0,
    studyStreak: 0,
    lastStudyDate: null,
  },
};

function loadDatabase(): DatabaseSchema {
  if (!existsSync(DB_PATH)) {
    return { ...defaultData };
  }

  try {
    const content = readFileSync(DB_PATH, "utf-8");
    return JSON.parse(content) as DatabaseSchema;
  } catch {
    console.warn("Could not parse existing database, starting fresh");
    return { ...defaultData };
  }
}

function saveDatabase(data: DatabaseSchema): void {
  const dir = join(process.cwd(), "data");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function generateQuestionId(category: string, index: number): string {
  return `${category}-${String(index).padStart(3, "0")}`;
}

async function seed(options: { clearExisting?: boolean } = {}) {
  console.log("🌱 Starting database seeding...\n");

  const db = loadDatabase();

  if (options.clearExisting) {
    console.log("🗑️  Clearing existing seed questions...");
    db.questions = db.questions.filter((q) => q.source !== "seed");
    db.progress = [];
  }

  // Track questions by category for ID generation
  const categoryCounters: Record<string, number> = {};

  // Get existing seed question IDs to avoid duplicates
  const existingIds = new Set(
    db.questions.filter((q) => q.source === "seed").map((q) => q.id)
  );

  let addedCount = 0;
  let skippedCount = 0;

  const now = new Date().toISOString();

  for (const questionInput of ALL_SEED_QUESTIONS) {
    // Generate ID based on category
    const category = questionInput.category;
    categoryCounters[category] = (categoryCounters[category] || 0) + 1;
    const questionId = createQuestionId(
      generateQuestionId(category, categoryCounters[category])
    );

    // Skip if already exists
    if (existingIds.has(questionId)) {
      skippedCount++;
      continue;
    }

    // Create full question object
    const question: Question = {
      id: questionId,
      ...questionInput,
      createdAt: now,
      updatedAt: now,
      isArchived: false,
    };

    db.questions.push(question);

    // Create initial progress record
    const progress: QuestionProgress = {
      id: createProgressId(`progress-${questionId}`),
      questionId: questionId,
      sm2: {
        easeFactor: createEaseFactor(2.5),
        interval: 0,
        repetitions: 0,
        nextReviewDate: now,
        lastReviewDate: null,
      },
      totalReviews: 0,
      correctReviews: 0,
      averageQuality: 0,
      reviewHistory: [],
      createdAt: now,
      updatedAt: now,
    };

    db.progress.push(progress);
    addedCount++;
  }

  // Update metadata
  db.metadata.updatedAt = now;
  db.metadata.totalStudySessions = 0;

  // Save to disk
  saveDatabase(db);

  // Print summary
  console.log("✅ Seeding complete!\n");
  console.log("📊 Summary:");
  console.log(`   • Questions added: ${addedCount}`);
  console.log(`   • Questions skipped (already exist): ${skippedCount}`);
  console.log(`   • Total questions in database: ${db.questions.length}`);
  console.log(`   • Progress records: ${db.progress.length}`);
  console.log(`\n📁 Database saved to: ${DB_PATH}`);

  // Print category breakdown
  console.log("\n📚 Questions by category:");
  const categoryCounts: Record<string, number> = {};
  for (const q of db.questions) {
    categoryCounts[q.category] = (categoryCounts[q.category] || 0) + 1;
  }

  Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      console.log(`   • ${category}: ${count}`);
    });
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
