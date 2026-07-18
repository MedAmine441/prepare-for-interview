// ============================================================================
// BUNDLE SIZE & TREE SHAKING
// ============================================================================

import { CreateQuestionInput, QUESTION_CATEGORIES } from "@/types";

export const bundleTreeShakingQuestions: CreateQuestionInput[] = [
  {
    category: QUESTION_CATEGORIES.BUNDLE_TREE_SHAKING,
    difficulty: "senior",
    question:
      "Explain how tree shaking works in modern bundlers. Why do some libraries not tree-shake well, and how would you audit and fix bundle size issues?",
    answer: `## How Tree Shaking Works

Tree shaking is dead code elimination based on ES Module static analysis. Bundlers analyze import/export statements to determine which code is actually used.

### Prerequisites for Tree Shaking

\`\`\`typescript
// ✅ ES Modules - static, analyzable
import { map, filter } from 'lodash-es';
export const utils = { map, filter };

// ❌ CommonJS - dynamic, not analyzable
const _ = require('lodash');
module.exports = { map: _.map };
\`\`\`

### Why Some Libraries Don't Tree-Shake

**1. Side Effects in Module Scope:**
\`\`\`typescript
// ❌ Bad: Side effect at module level
console.log('Utils loaded!'); // Bundler can't remove this file
export const add = (a: number, b: number) => a + b;
\`\`\`

**2. Missing sideEffects Field:**
\`\`\`json
{
  "name": "my-library",
  "sideEffects": false
}
\`\`\`

**3. Barrel Files Anti-Pattern:**
\`\`\`typescript
// ❌ Bad: Re-exporting everything
export * from './Button';
export * from './Card';
// ... 50 more components
\`\`\`

### Auditing Bundle Size

\`\`\`bash
# Webpack Bundle Analyzer
npx webpack-bundle-analyzer stats.json

# Vite
npm install rollup-plugin-visualizer
\`\`\`

### Fixing Bundle Issues

\`\`\`typescript
// 1. Direct imports instead of barrel files
import { Button } from './components/Button';

// 2. Replace heavy libraries
import { debounce } from 'lodash-es'; // Instead of full lodash

// 3. Dynamic imports for conditional features
const PDFExport = lazy(() => import('./PDFExport'));
\`\`\``,
    keyPoints: [
      "Understands ES Modules requirement for tree shaking",
      "Knows sideEffects field in package.json",
      "Can identify barrel file anti-pattern",
      "Familiar with bundle analysis tools",
    ],
    followUpQuestions: [
      "How does tree shaking differ between Webpack and Rollup?",
      "What's the impact of CSS-in-JS on bundle size?",
    ],
    relatedTopics: ["webpack", "vite", "code-splitting", "performance"],
    source: "seed",
    commonAt: ["Vercel", "Shopify"],
  },
  {
    category: QUESTION_CATEGORIES.BUNDLE_TREE_SHAKING,
    difficulty: "mid",
    question:
      "Explain code splitting strategies in React. When would you use route-based vs component-based splitting?",
    answer: `## Code Splitting Strategies

### Route-Based Splitting
Best for: Pages/routes users may never visit

\`\`\`typescript
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}
\`\`\`

### Component-Based Splitting
Best for: Heavy components not immediately visible

\`\`\`typescript
const HeavyModal = lazy(() => import('./HeavyModal'));

function Page() {
  const [showModal, setShowModal] = useState(false);
  
  return (
    <>
      <button onClick={() => setShowModal(true)}>Open</button>
      {showModal && (
        <Suspense fallback={<Spinner />}>
          <HeavyModal />
        </Suspense>
      )}
    </>
  );
}
\`\`\`

### Preloading Strategies

\`\`\`typescript
// Preload on hover
<Link 
  to="/dashboard"
  onMouseEnter={() => import('./pages/Dashboard')}
>
  Dashboard
</Link>
\`\`\`

| Strategy | Use When |
|----------|----------|
| Route-based | Separate pages |
| Component-based | Heavy below-fold content |
| Feature-based | Conditional features |`,
    keyPoints: [
      "Understands route vs component splitting",
      "Knows React.lazy and Suspense usage",
      "Can implement preloading strategies",
    ],
    followUpQuestions: [
      "How would you handle chunk loading errors?",
      "What's the overhead of too many small chunks?",
    ],
    relatedTopics: ["react-lazy", "suspense", "webpack"],
    source: "seed",
    commonAt: ["Most React companies"],
  },
  {
    category: QUESTION_CATEGORIES.BUNDLE_TREE_SHAKING,
    difficulty: "mid",
    question:
      "Your app's bundle has grown to 2MB. Walk through your process to find and eliminate the bloat.",
    answer: `## 1. Measure before touching anything

Generate a treemap of what's actually inside: \`webpack-bundle-analyzer\`, \`rollup-plugin-visualizer\`, \`source-map-explorer\`, or \`next build\` output. Look for: duplicate packages (two versions of the same lib), huge single dependencies, vendored code that should be split, and things that shouldn't be client-side at all.

## 2. The usual suspects and fixes

- **Heavyweight libraries with light alternatives**: moment (+locales!) → date-fns/dayjs; lodash → lodash-es with named imports or native methods; big charting/editor libs → dynamic import.
- **Barrel-file imports** dragging whole libraries: \`import { X } from "big-ui-lib"\` can pull everything if the package isn't tree-shakeable — check with the analyzer, use per-module imports or \`optimizePackageImports\`.
- **Duplicate dependencies**: dedupe via lockfile resolution; check why two majors coexist.
- **Polyfills for browsers you don't support**: modern browserslist target.
- **JSON/data/locales bundled in**: load on demand.

## 3. Split what remains

Route-level splitting first (frameworks do this), then component-level \`React.lazy\` for heavy below-the-fold or modal content (editors, charts, maps). Keep an eye on the waterfall cost of over-splitting.

## 4. Lock it in

- **Budgets in CI**: size-limit / bundlesize fail the PR on regression.
- Import linting (no default lodash, no moment).
- Periodic dependency audit — bundle bloat is a process problem, not a one-time fix.

Rule of thumb to cite: initial JS budget ~150-200KB gzipped for good mobile TTI; everything else lazy.`,
    keyPoints: [
      "Analyze first — treemap the bundle, find duplicates and whales",
      "Swap heavy deps, fix barrel imports, dedupe versions",
      "Route-level then component-level code splitting for the rest",
      "CI size budgets prevent regression — it's a process, not a cleanup",
    ],
    followUpQuestions: [
      "How do you decide the boundary for a dynamic import?",
      "What makes a library tree-shakeable or not?",
    ],
    relatedTopics: ["tree-shaking", "code-splitting", "ci", "lighthouse"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.BUNDLE_TREE_SHAKING,
    difficulty: "mid",
    question:
      "Dynamic import() patterns: how do you lazy-load without hurting UX? Cover preloading, prefetching, and loading states.",
    answer: `## The tension

Splitting saves initial bytes but adds a **load-on-demand delay** exactly when the user wants the feature. Good lazy-loading hides that delay.

## Patterns

**1. Lazy with Suspense (React)**

\`\`\`jsx
const Editor = React.lazy(() => import("./Editor"));
<Suspense fallback={<EditorSkeleton />}>{open && <Editor />}</Suspense>
\`\`\`

**2. Preload on intent** — start fetching before the user commits:

\`\`\`jsx
const preload = () => import("./Editor"); // browser caches the module promise
<button onMouseEnter={preload} onFocus={preload} onClick={openEditor}>
\`\`\`

Hover-to-click gap (~100-300ms) often covers most of the chunk load. Same idea at the router level: Next/Router prefetches viewport-visible links' chunks automatically.

**3. Declarative hints** — \`<link rel="prefetch">\` (idle-time, low priority — likely-next routes) vs \`<link rel="preload">\` (this navigation, high priority — critical chunks). Bundlers expose these as magic comments (\`/* webpackPrefetch: true */\`).

**4. Idle-time warmup** — \`requestIdleCallback(() => import("./HeavyTab"))\` for things the user visits often.

## Failure handling

Chunk loads fail (deploys change hashes, flaky networks): wrap in an error boundary with retry; on \`ChunkLoadError\` after a deploy, a full reload picks up the new manifest.

## What not to lazy-load

The LCP-critical path, tiny components (request overhead > savings), and anything needed within the first interaction.`,
    keyPoints: [
      "Lazy-load charges the cost at click time — preloading hides it",
      "Preload on hover/focus intent; prefetch likely-next routes at idle",
      "prefetch = low-priority future; preload = high-priority now",
      "Handle ChunkLoadError (deploy hash changes) with retry/reload",
      "Don't split the critical path or tiny components",
    ],
    followUpQuestions: [
      "How does the framework router decide what to prefetch?",
      "Why can a dynamic import fail right after a deploy?",
    ],
    relatedTopics: ["code-splitting", "resource-hints", "suspense", "error-boundaries"],
    source: "seed",
  },
];
