// src/lib/constants/categories.ts

import type { CategoryId, CategoryMetadata, QuestionCategory } from '@/types';
import { QUESTION_CATEGORIES, createCategoryId } from '@/types';

/**
 * Complete category metadata for UI display and filtering
 */
export const CATEGORY_METADATA: Record<QuestionCategory, CategoryMetadata> = {
  [QUESTION_CATEGORIES.JS_FUNDAMENTALS]: {
    id: createCategoryId('js-fundamentals'),
    slug: QUESTION_CATEGORIES.JS_FUNDAMENTALS,
    name: 'JavaScript Fundamentals',
    description:
      'Closures, scope and hoisting, this binding, prototypes, coercion, promises and async patterns, modules, and core language mechanics.',
    icon: 'Braces',
    color: 'bg-amber-500',
  },
  [QUESTION_CATEGORIES.REACT_PATTERNS]: {
    id: createCategoryId('react-patterns'),
    slug: QUESTION_CATEGORIES.REACT_PATTERNS,
    name: 'React Patterns & Hooks',
    description:
      'Practical React: useEffect pitfalls, memoization, state design, custom hooks, data fetching, error boundaries, and concurrent features.',
    icon: 'Anchor',
    color: 'bg-sky-500',
  },
  [QUESTION_CATEGORIES.TYPESCRIPT]: {
    id: createCategoryId('typescript'),
    slug: QUESTION_CATEGORIES.TYPESCRIPT,
    name: 'TypeScript',
    description:
      'Type system essentials: interfaces vs types, generics, narrowing, utility and mapped types, discriminated unions, and typing React code.',
    icon: 'FileType',
    color: 'bg-indigo-500',
  },
  [QUESTION_CATEGORIES.WEB_PERFORMANCE]: {
    id: createCategoryId('web-performance'),
    slug: QUESTION_CATEGORIES.WEB_PERFORMANCE,
    name: 'Web Performance',
    description:
      'Core Web Vitals, critical rendering path, image and font loading, main-thread scheduling, layout thrashing, and performance measurement.',
    icon: 'Gauge',
    color: 'bg-emerald-500',
  },
  [QUESTION_CATEGORIES.SYSTEM_DESIGN]: {
    id: createCategoryId('system-design'),
    slug: QUESTION_CATEGORIES.SYSTEM_DESIGN,
    name: 'System Design & Architecture',
    description:
      'Frontend architecture patterns, scalability, component design, state management strategies, and real-world system design scenarios.',
    icon: 'Layout',
    color: 'bg-blue-500',
  },
  [QUESTION_CATEGORIES.CACHING_MEMOIZATION]: {
    id: createCategoryId('caching-memoization'),
    slug: QUESTION_CATEGORIES.CACHING_MEMOIZATION,
    name: 'Caching & Memoization',
    description:
      'Browser caching, HTTP cache headers, React memoization patterns, selector optimization, and performance through strategic caching.',
    icon: 'Database',
    color: 'bg-green-500',
  },
  [QUESTION_CATEGORIES.BUNDLE_TREE_SHAKING]: {
    id: createCategoryId('bundle-tree-shaking'),
    slug: QUESTION_CATEGORIES.BUNDLE_TREE_SHAKING,
    name: 'Bundle Size & Tree Shaking',
    description:
      'Webpack/Vite optimization, code splitting, dynamic imports, tree shaking mechanics, and bundle analysis strategies.',
    icon: 'Package',
    color: 'bg-yellow-500',
  },
  [QUESTION_CATEGORIES.SECURITY_AUTH]: {
    id: createCategoryId('security-auth'),
    slug: QUESTION_CATEGORIES.SECURITY_AUTH,
    name: 'Security & Authentication',
    description:
      'XSS prevention, CSRF protection, secure token storage, HttpOnly cookies vs localStorage, and frontend security best practices.',
    icon: 'Shield',
    color: 'bg-red-500',
  },
  [QUESTION_CATEGORIES.FEATURE_FLAGS]: {
    id: createCategoryId('feature-flags'),
    slug: QUESTION_CATEGORIES.FEATURE_FLAGS,
    name: 'Feature Flags',
    description:
      'Feature flag implementation, gradual rollouts, A/B testing integration, trunk-based development, and feature management patterns.',
    icon: 'Flag',
    color: 'bg-purple-500',
  },
  [QUESTION_CATEGORIES.CSS_LAYOUT]: {
    id: createCategoryId('css-layout'),
    slug: QUESTION_CATEGORIES.CSS_LAYOUT,
    name: 'CSS & Layout',
    description:
      'CSS architecture, Flexbox vs Grid decisions, BFC, stacking context, responsive design, container queries, and CSS-in-JS patterns.',
    icon: 'Palette',
    color: 'bg-pink-500',
  },
  [QUESTION_CATEGORIES.JS_EVENT_LOOP]: {
    id: createCategoryId('js-event-loop'),
    slug: QUESTION_CATEGORIES.JS_EVENT_LOOP,
    name: 'JavaScript Event Loop',
    description:
      'Event loop mechanics, microtasks vs macrotasks, async patterns, Web Workers, memory management, and runtime optimization.',
    icon: 'RefreshCw',
    color: 'bg-orange-500',
  },
  [QUESTION_CATEGORIES.ACCESSIBILITY]: {
    id: createCategoryId('accessibility'),
    slug: QUESTION_CATEGORIES.ACCESSIBILITY,
    name: 'Accessibility (A11y)',
    description:
      'WCAG compliance, ARIA patterns, keyboard navigation, screen reader optimization, focus management, and inclusive design.',
    icon: 'Eye',
    color: 'bg-teal-500',
  },
  [QUESTION_CATEGORIES.REACT_INTERNALS]: {
    id: createCategoryId('react-internals'),
    slug: QUESTION_CATEGORIES.REACT_INTERNALS,
    name: 'React Internals',
    description:
      'Fiber architecture, reconciliation algorithm, concurrent features, Suspense, Server Components, and React optimization patterns.',
    icon: 'Atom',
    color: 'bg-cyan-500',
  },
  [QUESTION_CATEGORIES.BEHAVIORAL]: {
    id: createCategoryId('behavioral'),
    slug: QUESTION_CATEGORIES.BEHAVIORAL,
    name: 'Behavioral & Stories',
    description:
      'STAR-format storytelling: conflict, failure, leadership, feedback, and the classic non-technical questions that decide offers.',
    icon: 'Users',
    color: 'bg-rose-500',
  },
  [QUESTION_CATEGORIES.TESTING]: {
    id: createCategoryId('testing'),
    slug: QUESTION_CATEGORIES.TESTING,
    name: 'Testing & Quality',
    description:
      'Jest, React Testing Library, Playwright, mocking strategy, async testing, flaky-test debugging, and what to test at which level.',
    icon: 'FlaskConical',
    color: 'bg-lime-600',
  },
  [QUESTION_CATEGORIES.CODING_CHALLENGES]: {
    id: createCategoryId('coding-challenges'),
    slug: QUESTION_CATEGORIES.CODING_CHALLENGES,
    name: 'Coding Challenges',
    description:
      'Implement-from-scratch JavaScript: debounce, promises, event emitters, currying — type your solution and get it reviewed like a live coding round.',
    icon: 'Code2',
    color: 'bg-slate-700',
  },
};

/**
 * Get all categories as an array for iteration
 */
export const ALL_CATEGORIES = Object.values(CATEGORY_METADATA);

/**
 * Get category metadata by slug
 */
export function getCategoryBySlug(slug: QuestionCategory): CategoryMetadata {
  return CATEGORY_METADATA[slug];
}

/**
 * Difficulty metadata for UI
 */
export const DIFFICULTY_METADATA = {
  junior: {
    label: 'Junior',
    description: 'Entry-level concepts, fundamentals',
    color: 'bg-green-100 text-green-800',
    estimatedMinutes: 3,
  },
  mid: {
    label: 'Mid-Level',
    description: 'Practical application, common patterns',
    color: 'bg-yellow-100 text-yellow-800',
    estimatedMinutes: 5,
  },
  senior: {
    label: 'Senior',
    description: 'Deep knowledge, edge cases, trade-offs',
    color: 'bg-red-100 text-red-800',
    estimatedMinutes: 8,
  },
} as const;
