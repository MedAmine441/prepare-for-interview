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
];
