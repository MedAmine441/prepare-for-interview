// data/seed-data.ts
/**
 * FrontMaster Seed Data
 *
 * High-quality frontend interview questions covering:
 * - System Design & Architecture
 * - Caching & Memoization
 * - Bundle Size & Tree Shaking
 * - Security & Authentication
 * - Feature Flags
 * - CSS & Layout
 * - JavaScript Event Loop
 * - Accessibility
 * - React Internals
 *
 * Each question is crafted to reflect real interview scenarios at
 * top tech companies (Meta, Google, Netflix, Vercel, etc.)
 */

/**
 * Import and combine all seed data parts
 */

import { systemDesignQuestions } from "./system-design-questions";

import type { CreateQuestionInput } from "../src/types";
import { featureFlagsQuestions } from "./feature-flags-questions";
import { cachingMemoizationQuestions } from "./caching-memoization-questions";
import { bundleTreeShakingQuestions } from "./bundle-tree-shaking-questions";
import { securityAuthQuestions } from "./security-auth-questions";
import { cssLayoutQuestions } from "./css-layout-questions";
import { jsEventLoopQuestions } from "./js-eventloop-questions";
import { accessibilityQuestions } from "./accessibility-questions";
import { reactInternalsQuestions } from "./react-internals-questions";

// Export all questions combined
export const ALL_SEED_QUESTIONS: CreateQuestionInput[] = [
  ...featureFlagsQuestions,
  ...systemDesignQuestions,
  ...cachingMemoizationQuestions,
  ...bundleTreeShakingQuestions,
  ...securityAuthQuestions,
  ...cssLayoutQuestions,
  ...jsEventLoopQuestions,
  ...accessibilityQuestions,
  ...reactInternalsQuestions,
];

// Export individual categories for selective seeding
export {
  featureFlagsQuestions,
  systemDesignQuestions,
  cachingMemoizationQuestions,
  bundleTreeShakingQuestions,
  securityAuthQuestions,
  cssLayoutQuestions,
  jsEventLoopQuestions,
  accessibilityQuestions,
  reactInternalsQuestions,
};
