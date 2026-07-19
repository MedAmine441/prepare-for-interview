// src/lib/utils/question-format.ts

import type { Difficulty } from '@/types';

/**
 * Shared display helpers for questions.
 * Single source of truth — previously duplicated across 5 components.
 */

export function formatCategory(category: string): string {
  return category
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function getCategoryEmoji(slug: string): string {
  const emojiMap: Record<string, string> = {
    'js-fundamentals': '📜',
    'react-patterns': '🪝',
    typescript: '🔷',
    'web-performance': '⚡',
    'system-design': '🏗️',
    'caching-memoization': '💾',
    'bundle-tree-shaking': '📦',
    'security-auth': '🔒',
    'feature-flags': '🚩',
    'css-layout': '🎨',
    'js-event-loop': '🔄',
    accessibility: '♿',
    'react-internals': '⚛️',
    behavioral: '🗣️',
    testing: '🧪',
    'coding-challenges': '💻',
  };
  return emojiMap[slug] || '📚';
}

/** Badge classes for difficulty, safe in both light and dark mode */
export function getDifficultyColor(difficulty?: string): string {
  switch (difficulty) {
    case 'junior':
      return 'text-green-600 border-green-300 dark:text-green-400 dark:border-green-900';
    case 'mid':
      return 'text-yellow-600 border-yellow-300 dark:text-yellow-400 dark:border-yellow-900';
    case 'senior':
      return 'text-red-600 border-red-300 dark:text-red-400 dark:border-red-900';
    default:
      return '';
  }
}

export function getEstimatedTime(difficulty: string): number {
  switch (difficulty) {
    case 'junior':
      return 3;
    case 'mid':
      return 5;
    case 'senior':
      return 8;
    default:
      return 5;
  }
}

export function formatSource(source: string): string {
  return formatCategory(source);
}
