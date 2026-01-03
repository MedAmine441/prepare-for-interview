// data/seed-data.ts

/**
 * Import and combine all seed data parts
 */

import {
  systemDesignQuestions,
  cachingMemoizationQuestions,
  bundleTreeShakingQuestions,
  securityAuthQuestions,
  featureFlagsQuestions,
} from "./seed-data-part1";

import {
  featureFlagsQuestionsContinued,
  cssLayoutQuestions,
  jsEventLoopQuestions,
  accessibilityQuestions,
} from "./seed-data-part2";

import { reactInternalsQuestions } from "./seed-data-part3";

import type { CreateQuestionInput } from "../src/types";

// Combine all feature flags questions
const allFeatureFlagsQuestions = [
  ...featureFlagsQuestions,
  ...featureFlagsQuestionsContinued,
];

// Export all questions combined
export const ALL_SEED_QUESTIONS: CreateQuestionInput[] = [
  ...systemDesignQuestions,
  ...cachingMemoizationQuestions,
  ...bundleTreeShakingQuestions,
  ...securityAuthQuestions,
  ...allFeatureFlagsQuestions,
  ...cssLayoutQuestions,
  ...jsEventLoopQuestions,
  ...accessibilityQuestions,
  ...reactInternalsQuestions,
];

// Export individual categories for selective seeding
export {
  systemDesignQuestions,
  cachingMemoizationQuestions,
  bundleTreeShakingQuestions,
  securityAuthQuestions,
  cssLayoutQuestions,
  jsEventLoopQuestions,
  accessibilityQuestions,
  reactInternalsQuestions,
};

export { allFeatureFlagsQuestions as featureFlagsQuestions };
