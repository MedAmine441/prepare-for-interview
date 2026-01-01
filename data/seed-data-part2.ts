// data/seed-data-part2.ts

import type { CreateQuestionInput } from '@/types';
import { QUESTION_CATEGORIES } from '@/types';

// ============================================================================
// FEATURE FLAGS (continued)
// ============================================================================

const featureFlagsQuestionsContinued: CreateQuestionInput[] = [
  {
    category: QUESTION_CATEGORIES.FEATURE_FLAGS,
    difficulty: 'mid',
    question:
      'How do feature flags enable trunk-based development? What are the best practices for managing long-lived feature flags?',
    answer: `## Trunk-Based Development with Feature Flags

\`\`\`
Traditional Git Flow:
main â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–º
       \\                                    /
        feature/new-checkout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–º (merge after weeks)
         \\              /
          fix-1  fix-2  (conflicts accumulate)

Trunk-Based with Flags:
main â”€â—â”€â—â”€â—â”€â—â”€â—â”€â—â”€â—â”€â—â”€â—â”€â—â”€â—â”€â—â”€â—â”€â—â”€â—â”€â—â”€â—â”€â—â”€â—â”€â—â”€â—â”€â—â”€â–º
      â”‚ â”‚ â”‚ â”‚ â”‚ â”‚ â”‚ â”‚ â”‚ â”‚ â”‚ â”‚ â”‚ â”‚ â”‚ â”‚ â”‚ â”‚ â”‚ â”‚ â”‚ â”‚
      (Small commits, always deployable, behind flags)
\`\`\`

## How It Works

\`\`\`typescript
// Day 1: Start new checkout feature (behind flag)
function CheckoutPage() {
  const useNewCheckout = useFeatureFlag('new-checkout');
  
  // New code is deployed but not active
  if (useNewCheckout) {
    return <NewCheckout />; // Work in progress
  }
  
  return <LegacyCheckout />; // Current production
}

// Day 2-10: Continue developing, deploying daily
// Each commit goes to main, but flag is OFF

// Day 11: Enable for internal testing
// Flag: 100% for @company.com emails

// Day 14: Enable for beta users
// Flag: 100% for beta + internal

// Day 21: Gradual rollout
// Flag: 10% â†’ 25% â†’ 50% â†’ 100%

// Day 28: Remove flag (cleanup)
function CheckoutPage() {
  return <NewCheckout />; // Flag removed, old code deleted
}
\`\`\`

## Best Practices for Long-Lived Flags

### 1. Flag Lifecycle Management

\`\`\`typescript
interface FlagMetadata {
  key: string;
  owner: string; // Team or person responsible
  createdAt: string;
  expectedRemovalDate: string; // When flag should be cleaned up
  jiraTicket: string; // Link to cleanup task
  type: 'release' | 'experiment' | 'ops' | 'permission';
}

// Flag types:
// - release: Temporary, for deploying features (remove after rollout)
// - experiment: A/B tests (remove after analysis)
// - ops: Kill switches, permanent (different lifecycle)
// - permission: Entitlement flags (may be permanent)
\`\`\`

### 2. Automated Flag Cleanup Reminders

\`\`\`typescript
// CI check for stale flags
async function checkStaleFlags() {
  const flags = await fetchAllFlags();
  const staleFlags = flags.filter(flag => {
    const age = Date.now() - new Date(flag.createdAt).getTime();
    const maxAge = 90 * 24 * 60 * 60 * 1000; // 90 days
    
    return age > maxAge && flag.type === 'release';
  });
  
  if (staleFlags.length > 0) {
    // Post to Slack, create JIRA tickets, etc.
    await notifyOwners(staleFlags);
  }
}
\`\`\`

### 3. Code Organization

\`\`\`typescript
// âŒ Bad: Flag checks scattered everywhere
function ProductPage() {
  const flagA = useFeatureFlag('feature-a');
  const flagB = useFeatureFlag('feature-b');
  
  return (
    <div>
      {flagA && <ComponentA />}
      <ProductInfo />
      {flagB && <ComponentB />}
      {flagA && flagB && <ComponentC />}
    </div>
  );
}

// âœ… Good: Centralized flag-dependent logic
function ProductPage() {
  return <ProductPageContent />;
}

// Feature-specific component handles its own flag
function FeatureASection() {
  const isEnabled = useFeatureFlag('feature-a');
  if (!isEnabled) return null;
  return <ComponentA />;
}

// Or use composition
function ProductPageContent() {
  return (
    <div>
      <FeatureGated flag="feature-a">
        <ComponentA />
      </FeatureGated>
      <ProductInfo />
    </div>
  );
}
\`\`\`

### 4. Testing Both Paths

\`\`\`typescript
// Always test both flag states
describe('Checkout', () => {
  describe('with new-checkout enabled', () => {
    beforeEach(() => {
      mockFeatureFlag('new-checkout', true);
    });
    
    it('renders new checkout flow', () => {
      render(<CheckoutPage />);
      expect(screen.getByTestId('new-checkout')).toBeInTheDocument();
    });
  });
  
  describe('with new-checkout disabled', () => {
    beforeEach(() => {
      mockFeatureFlag('new-checkout', false);
    });
    
    it('renders legacy checkout flow', () => {
      render(<CheckoutPage />);
      expect(screen.getByTestId('legacy-checkout')).toBeInTheDocument();
    });
  });
});

// Test helper
function mockFeatureFlag(key: string, value: boolean) {
  jest.spyOn(featureFlagHooks, 'useFeatureFlag').mockImplementation(
    (flagKey) => flagKey === key ? value : false
  );
}
\`\`\`

### 5. Flag Removal Checklist

\`\`\`markdown
## Flag Removal Checklist: new-checkout

- [ ] Feature fully rolled out (100%)
- [ ] Monitoring shows no issues for 7+ days
- [ ] Remove all flag checks in code
- [ ] Remove fallback/legacy code
- [ ] Update/remove related tests
- [ ] Archive flag in flag service
- [ ] Update documentation
- [ ] Communicate to team
\`\`\`

## Managing Technical Debt

\`\`\`typescript
// Track flag debt in codebase
// eslint-plugin-custom-rules

// .eslintrc
{
  "rules": {
    "custom/no-nested-feature-flags": "error",
    "custom/feature-flag-comment-required": "warn"
  }
}

// Rule: Require comment explaining flag
// âŒ Error
if (useFeatureFlag('xyz')) { ... }

// âœ… OK
// FLAG: xyz - New checkout flow, remove by 2024-06-01
// JIRA: PROJ-1234
if (useFeatureFlag('xyz')) { ... }
\`\`\``,
    keyPoints: [
      'Understands trunk-based development benefits',
      'Knows flag lifecycle (release, experiment, ops)',
      'Implements automated cleanup reminders',
      'Tests both flag states',
      'Has flag removal checklist',
      'Manages technical debt from flags',
    ],
    followUpQuestions: [
      'How do you handle conflicts between flags?',
      'What metrics indicate a flag is safe to remove?',
      'How do you handle flags during incidents?',
      'What about feature flags in microservices?',
    ],
    relatedTopics: ['trunk-based-development', 'ci-cd', 'technical-debt'],
    source: 'seed',
    commonAt: ['Companies practicing CI/CD'],
  },
];

// ============================================================================
// CSS & LAYOUT
// ============================================================================

const cssLayoutQuestions: CreateQuestionInput[] = [
  {
    category: QUESTION_CATEGORIES.CSS_LAYOUT,
    difficulty: 'senior',
    question:
      'Explain the CSS stacking context. When is a new stacking context created, and how does it affect z-index behavior?',
    answer: `## What is a Stacking Context?

A stacking context is a three-dimensional conceptualization of HTML elements along the z-axis. Elements within a stacking context are painted in a specific order, and z-index only works within the same stacking context.

\`\`\`
Stacking Context Visualization:

Screen (viewer)
    â”‚
    â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Root Stacking Context              â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”‚
â”‚  â”‚  Child Stacking Context A   â”‚    â”‚
â”‚  â”‚  z-index: 1                 â”‚    â”‚
â”‚  â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”‚    â”‚
â”‚  â”‚  â”‚ Grandchild z:9999    â”‚   â”‚    â”‚  â† Cannot escape parent!
â”‚  â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚    â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”‚
â”‚  â”‚  Child Stacking Context B   â”‚    â”‚
â”‚  â”‚  z-index: 2                 â”‚    â”‚  â† Always above A, regardless
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â”‚    of grandchild's z-index
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
\`\`\`

## What Creates a Stacking Context?

\`\`\`css
/* 1. Root element (<html>) */
/* Always creates root stacking context */

/* 2. Positioned elements with z-index other than auto */
.creates-context {
  position: relative; /* or absolute, fixed, sticky */
  z-index: 1; /* any value except auto */
}

/* 3. Flexbox/Grid children with z-index */
.flex-container {
  display: flex;
}
.flex-child {
  z-index: 1; /* creates stacking context */
}

/* 4. Opacity less than 1 */
.creates-context {
  opacity: 0.99; /* yes, even 0.99! */
}

/* 5. Transform (any value except none) */
.creates-context {
  transform: translateX(0); /* even no-op transform */
}

/* 6. Filter */
.creates-context {
  filter: blur(0);
}

/* 7. Perspective */
.creates-context {
  perspective: 1000px;
}

/* 8. clip-path */
.creates-context {
  clip-path: circle(50%);
}

/* 9. mask / mask-image */
.creates-context {
  mask: url(#mask);
}

/* 10. isolation: isolate */
.creates-context {
  isolation: isolate; /* explicitly creates context */
}

/* 11. mix-blend-mode (not normal) */
.creates-context {
  mix-blend-mode: multiply;
}

/* 12. will-change with certain values */
.creates-context {
  will-change: transform;
}

/* 13. contain: layout or paint */
.creates-context {
  contain: layout;
}
\`\`\`

## Common z-index Issues

### Issue 1: z-index Not Working

\`\`\`css
/* âŒ z-index has no effect without positioning */
.broken {
  z-index: 9999;
}

/* âœ… Needs position */
.fixed {
  position: relative;
  z-index: 9999;
}

/* âœ… Or be a flex/grid child */
.flex-child {
  z-index: 9999; /* works if parent is flex/grid */
}
\`\`\`

### Issue 2: Modal Behind Content

\`\`\`html
<div class="header" style="position: fixed; z-index: 100;">
  Header
</div>
<main class="content" style="transform: translateY(0);">
  <!-- transform creates new stacking context! -->
  <div class="modal" style="position: fixed; z-index: 9999;">
    Modal appears BEHIND header!
  </div>
</main>
\`\`\`

\`\`\`css
/* Fix 1: Remove transform from content */
.content {
  /* remove transform */
}

/* Fix 2: Move modal outside */
/* Render modal as sibling to content, not child */

/* Fix 3: Use portal (React) */
\`\`\`

\`\`\`tsx
// React Portal solution
function Modal({ children }: { children: React.ReactNode }) {
  return createPortal(
    <div className="modal">{children}</div>,
    document.body // Renders outside of content's stacking context
  );
}
\`\`\`

### Issue 3: Tooltip Clipped by Overflow

\`\`\`css
.container {
  overflow: hidden; /* clips descendants */
}

.tooltip {
  position: absolute;
  z-index: 9999; /* still clipped! */
}

/* Fix: Use portal or overflow: visible on ancestor chain */
\`\`\`

## Stacking Order Within Context

\`\`\`
Bottom (painted first)
â”‚
â”œâ”€â”€ 1. Background/borders of stacking context element
â”œâ”€â”€ 2. Negative z-index children (in order)
â”œâ”€â”€ 3. Block-level descendants (in DOM order)
â”œâ”€â”€ 4. Floated descendants
â”œâ”€â”€ 5. Inline descendants
â”œâ”€â”€ 6. z-index: 0 or auto positioned descendants
â”œâ”€â”€ 7. Positive z-index children (in order)
â”‚
Top (painted last)
\`\`\`

## Debugging Stacking Contexts

\`\`\`typescript
// Find all stacking contexts
function findStackingContexts(element: Element = document.body, depth = 0): void {
  const style = getComputedStyle(element);
  
  const createsContext = 
    style.zIndex !== 'auto' && style.position !== 'static' ||
    parseFloat(style.opacity) < 1 ||
    style.transform !== 'none' ||
    style.filter !== 'none' ||
    style.perspective !== 'none' ||
    style.isolation === 'isolate' ||
    style.mixBlendMode !== 'normal' ||
    style.willChange.match(/transform|opacity|filter/);
  
  if (createsContext) {
    console.log('  '.repeat(depth), element.tagName, element.className, {
      zIndex: style.zIndex,
      position: style.position,
      opacity: style.opacity,
      transform: style.transform,
    });
  }
  
  for (const child of element.children) {
    findStackingContexts(child, createsContext ? depth + 1 : depth);
  }
}

findStackingContexts();
\`\`\`

## Best Practices

\`\`\`css
/* 1. Use isolation: isolate for intentional contexts */
.card {
  isolation: isolate; /* clear intent */
}

/* 2. Use CSS custom properties for z-index scale */
:root {
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-modal-backdrop: 300;
  --z-modal: 400;
  --z-tooltip: 500;
  --z-toast: 600;
}

.modal {
  z-index: var(--z-modal);
}

/* 3. Avoid inline z-index values */

/* 4. Document stacking context creation */
.header {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  /* NOTE: Creates stacking context */
}
\`\`\``,
    keyPoints: [
      'Knows what creates a stacking context',
      'Understands z-index scope limitations',
      'Can debug stacking issues',
      'Uses portals for escaping contexts',
      'Has organized z-index scale',
      'Uses isolation: isolate intentionally',
    ],
    followUpQuestions: [
      'How do you handle z-index in a component library?',
      'What about stacking contexts in iframes?',
      'How does paint order affect performance?',
      'What\'s the difference between z-index and layer promotion?',
    ],
    relatedTopics: ['css', 'layout', 'debugging', 'portals'],
    source: 'seed',
    commonAt: ['Companies with complex UIs'],
  },
  {
    category: QUESTION_CATEGORIES.CSS_LAYOUT,
    difficulty: 'mid',
    question:
      'When would you use CSS Grid vs Flexbox? Explain the key differences and provide examples of when each is more appropriate.',
    answer: `## Fundamental Difference

\`\`\`
Flexbox: ONE-dimensional layout (row OR column)
â”Œâ”€â”€â”€â”¬â”€â”€â”€â”¬â”€â”€â”€â”¬â”€â”€â”€â”
â”‚ 1 â”‚ 2 â”‚ 3 â”‚ 4 â”‚  â† Items flow in one direction
â””â”€â”€â”€â”´â”€â”€â”€â”´â”€â”€â”€â”´â”€â”€â”€â”˜

Grid: TWO-dimensional layout (rows AND columns)
â”Œâ”€â”€â”€â”¬â”€â”€â”€â”¬â”€â”€â”€â”
â”‚ 1 â”‚ 2 â”‚ 3 â”‚  â† Items placed in 2D grid
â”œâ”€â”€â”€â”¼â”€â”€â”€â”¼â”€â”€â”€â”¤
â”‚ 4 â”‚ 5 â”‚ 6 â”‚
â””â”€â”€â”€â”´â”€â”€â”€â”´â”€â”€â”€â”˜
\`\`\`

## When to Use Flexbox

### 1. Navigation / Toolbars

\`\`\`css
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-links {
  display: flex;
  gap: 1rem;
}
\`\`\`

### 2. Centering Content

\`\`\`css
.center-everything {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
\`\`\`

### 3. Card Content Alignment

\`\`\`css
/* Push footer to bottom of card */
.card {
  display: flex;
  flex-direction: column;
}

.card-content {
  flex: 1; /* Take remaining space */
}

.card-footer {
  margin-top: auto; /* Stick to bottom */
}
\`\`\`

### 4. Unknown Number of Items

\`\`\`css
/* Items wrap naturally */
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  /* Each tag sizes to content */
}
\`\`\`

## When to Use Grid

### 1. Page Layouts

\`\`\`css
.page-layout {
  display: grid;
  grid-template-columns: 250px 1fr 300px;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "header header header"
    "sidebar main aside"
    "footer footer footer";
  min-height: 100vh;
}

.header { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main { grid-area: main; }
.aside { grid-area: aside; }
.footer { grid-area: footer; }
\`\`\`

### 2. Card Grids

\`\`\`css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

/* Cards automatically fit and wrap */
\`\`\`

### 3. Complex Form Layouts

\`\`\`css
.form {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1rem;
  align-items: center;
}

.form-label {
  justify-self: end;
}

.form-input {
  /* Spans remainder */
}

.form-full-width {
  grid-column: 1 / -1;
}
\`\`\`

### 4. Precise Positioning

\`\`\`css
.dashboard {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(3, 200px);
  gap: 1rem;
}

.widget-large {
  grid-column: span 2;
  grid-row: span 2;
}

.widget-wide {
  grid-column: span 3;
}
\`\`\`

## Feature Comparison

| Feature | Flexbox | Grid |
|---------|---------|------|
| Direction | Single axis | Both axes |
| Item sizing | Content-based | Grid-based or content |
| Gap support | âœ… | âœ… |
| Alignment | âœ… | âœ… |
| Explicit placement | Limited | Full control |
| Dense packing | No | Yes (grid-auto-flow: dense) |
| Subgrid | No | Yes |
| Overlap | Manual (negative margins) | Native (same cell) |

## Combined Usage

Often the best approach uses both:

\`\`\`css
/* Grid for overall page structure */
.app {
  display: grid;
  grid-template-columns: 250px 1fr;
}

/* Flexbox for header content */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Grid for card layout */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

/* Flexbox for card internals */
.card {
  display: flex;
  flex-direction: column;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
}
\`\`\`

## Modern Grid Features

\`\`\`css
/* Subgrid - align nested items to parent grid */
.parent {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}

.child {
  display: grid;
  grid-template-columns: subgrid;
  grid-column: span 3;
}

/* Container Queries (with grid) */
.card-container {
  container-type: inline-size;
}

@container (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 150px 1fr;
  }
}
\`\`\`

## Decision Framework

\`\`\`
Is it a 2D layout with rows AND columns?
â”‚
â”œâ”€â”€ Yes â†’ Use Grid
â”‚   â””â”€â”€ Examples: Page layout, dashboard, image gallery
â”‚
â””â”€â”€ No â†’ Is content flowing in one direction?
    â”‚
    â”œâ”€â”€ Yes â†’ Use Flexbox
    â”‚   â””â”€â”€ Examples: Navbar, buttons, form row
    â”‚
    â””â”€â”€ Both work â†’ Consider:
        â€¢ Grid: When you need precise control
        â€¢ Flexbox: When content should dictate size
\`\`\``,
    keyPoints: [
      'Understands 1D vs 2D layout distinction',
      'Knows when flexbox excels (centering, single-axis)',
      'Knows when grid excels (complex layouts, grids)',
      'Can combine both effectively',
      'Familiar with modern features (subgrid)',
      'Has decision framework for choosing',
    ],
    followUpQuestions: [
      'How would you handle fallbacks for older browsers?',
      'What about performance differences?',
      'How does subgrid help with component alignment?',
      'When would you use CSS Columns instead?',
    ],
    relatedTopics: ['css', 'flexbox', 'grid', 'responsive-design'],
    source: 'seed',
    commonAt: ['General frontend knowledge'],
  },
  {
    category: QUESTION_CATEGORIES.CSS_LAYOUT,
    difficulty: 'mid',
    question:
      'What is the Block Formatting Context (BFC) in CSS? How do you create one, and why would you need to?',
    answer: `## What is a BFC?

A Block Formatting Context (BFC) is an independent layout environment where the internal layout doesn't affect the external layout and vice versa.

\`\`\`
Without BFC:
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Parent                          â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”‚
â”‚  â”‚ Float left              â”‚    â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â”‚
â”‚                                 â”‚ â† Parent collapses! Float escapes
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

With BFC:
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ Parent (BFC)                    â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”‚
â”‚  â”‚ Float left              â”‚    â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â”‚
â”‚                                 â”‚ â† Parent contains float
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
\`\`\`

## How to Create a BFC

\`\`\`css
/* 1. overflow (not visible) */
.bfc {
  overflow: hidden; /* or auto, scroll */
}

/* 2. display: flow-root (modern, best practice) */
.bfc {
  display: flow-root; /* explicitly creates BFC */
}

/* 3. Float */
.bfc {
  float: left; /* or right */
}

/* 4. Position absolute/fixed */
.bfc {
  position: absolute; /* or fixed */
}

/* 5. Display inline-block */
.bfc {
  display: inline-block;
}

/* 6. Flex/Grid items */
.flex-container > .bfc {
  /* flex items create BFC */
}

/* 7. Table cells */
.bfc {
  display: table-cell;
}

/* 8. contain: layout */
.bfc {
  contain: layout;
}
\`\`\`

## Common Use Cases

### 1. Containing Floats (Clearfix Replacement)

\`\`\`css
/* Old clearfix hack */
.clearfix::after {
  content: "";
  display: table;
  clear: both;
}

/* Modern BFC solution */
.container {
  display: flow-root;
}
\`\`\`

\`\`\`html
<div class="container">
  <div class="float-left">Floated</div>
  <div class="float-right">Floated</div>
  <!-- Container properly wraps floats -->
</div>
\`\`\`

### 2. Preventing Margin Collapse

\`\`\`css
/* Margins collapse without BFC */
.parent {
  background: lightblue;
}

.child {
  margin-top: 50px; /* Collapses through parent! */
}

/* BFC prevents collapse */
.parent {
  background: lightblue;
  display: flow-root; /* or overflow: hidden */
}

.child {
  margin-top: 50px; /* Stays inside parent */
}
\`\`\`

### 3. Multi-Column Layout with Float

\`\`\`css
/* Without BFC - text wraps under float */
.sidebar {
  float: left;
  width: 200px;
}

.main {
  /* Text wraps around sidebar */
}

/* With BFC - clean separation */
.sidebar {
  float: left;
  width: 200px;
}

.main {
  display: flow-root; /* or overflow: hidden */
  /* Content stays in its own lane */
}
\`\`\`

\`\`\`
Without BFC on main:
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚Sidebar â”‚ Main content wraps around   â”‚
â”‚        â”‚ the sidebar when there's    â”‚
â”‚        â”‚ enough text to fill...      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
         â”‚ ...the rest continues here  â”‚
         â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

With BFC on main:
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚Sidebar â”‚ Main content stays          â”‚
â”‚        â”‚ completely separate from    â”‚
â”‚        â”‚ the sidebar float           â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
\`\`\`

### 4. Preventing Layout Interference

\`\`\`css
/* Component isolation */
.widget {
  display: flow-root;
  /* Internal floats, margins won't affect siblings */
}
\`\`\`

## Why display: flow-root?

\`\`\`css
/* overflow: hidden has side effects */
.container {
  overflow: hidden;
  /* âŒ Clips overflowing content (tooltips, dropdowns) */
  /* âŒ Hides scrollbars */
}

/* display: flow-root is purpose-built */
.container {
  display: flow-root;
  /* âœ… Creates BFC without side effects */
  /* âœ… No clipping */
  /* âœ… Clear semantic intent */
}
\`\`\`

## BFC Rules

Elements in a BFC:
1. Contain all descendant floats
2. Exclude external floats
3. Suppress margin collapse with BFC boundary
4. Don't overlap with floats

\`\`\`css
/* BFC prevents overlap with sibling float */
.float {
  float: left;
  width: 100px;
  height: 100px;
}

.bfc-sibling {
  display: flow-root;
  /* This element starts after the float, not beside it */
  /* But won't wrap around the float */
}
\`\`\`

## Modern Alternatives

While BFC is still relevant, modern layout often uses:

\`\`\`css
/* Flexbox (creates BFC for children) */
.container {
  display: flex;
  flex-wrap: wrap;
}

/* Grid (creates BFC for children) */
.container {
  display: grid;
  grid-template-columns: 200px 1fr;
}

/* Both avoid float issues entirely */
\`\`\`

## Quick Reference

| Trigger | Side Effects | Use Case |
|---------|--------------|----------|
| display: flow-root | None | Best general purpose |
| overflow: hidden | Clips content | When clipping is acceptable |
| overflow: auto | Shows scrollbars | Scrollable containers |
| float | Removes from flow | Legacy layouts |
| position: absolute | Removes from flow | Absolutely positioned |
| display: inline-block | Inline behavior | Inline BFC |`,
    keyPoints: [
      'Understands BFC as isolated layout context',
      'Knows multiple ways to create BFC',
      'Can use BFC for containing floats',
      'Understands margin collapse prevention',
      'Prefers display: flow-root for clarity',
      'Knows when modern layout is better',
    ],
    followUpQuestions: [
      'How does BFC interact with stacking contexts?',
      'What about inline formatting context?',
      'How do CSS Containment and BFC relate?',
      'When would you still use floats today?',
    ],
    relatedTopics: ['css', 'layout', 'floats', 'margin-collapse'],
    source: 'seed',
    commonAt: ['Companies maintaining legacy CSS'],
  },
];

// ============================================================================
// JAVASCRIPT EVENT LOOP
// ============================================================================

const jsEventLoopQuestions: CreateQuestionInput[] = [
  {
    category: QUESTION_CATEGORIES.JS_EVENT_LOOP,
    difficulty: 'senior',
    question:
      'Explain the JavaScript event loop in detail. What is the difference between microtasks and macrotasks? Walk through the execution order of a complex example.',
    answer: `## Event Loop Architecture

\`\`\`
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                         Call Stack                              â”‚
â”‚                    (Currently executing)                        â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                              â”‚
                              â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                         Event Loop                              â”‚
â”‚                                                                 â”‚
â”‚   1. Execute all code in Call Stack                             â”‚
â”‚   2. Execute ALL microtasks (until queue empty)                 â”‚
â”‚   3. Render if needed (requestAnimationFrame)                   â”‚
â”‚   4. Execute ONE macrotask                                      â”‚
â”‚   5. Go to step 1                                               â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
         â”‚                                              â”‚
         â–¼                                              â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚   Microtask Queue    â”‚                    â”‚   Macrotask Queue    â”‚
â”‚   (Higher priority)  â”‚                    â”‚   (Lower priority)   â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤                    â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ â€¢ Promise.then/catch â”‚                    â”‚ â€¢ setTimeout         â”‚
â”‚ â€¢ queueMicrotask()   â”‚                    â”‚ â€¢ setInterval        â”‚
â”‚ â€¢ MutationObserver   â”‚                    â”‚ â€¢ setImmediate       â”‚
â”‚ â€¢ process.nextTick   â”‚                    â”‚ â€¢ I/O callbacks      â”‚
â”‚   (Node.js)          â”‚                    â”‚ â€¢ UI rendering       â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                    â”‚ â€¢ requestAnimationFrame â”‚
                                            â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
\`\`\`

## Microtasks vs Macrotasks

### Microtasks (Job Queue)
- Processed **immediately** after current script
- **All** microtasks run before any macrotask
- New microtasks added during processing are also processed

### Macrotasks (Task Queue)
- Processed **one at a time**
- After each macrotask, microtasks run
- Browser may render between macrotasks

## Detailed Example

\`\`\`typescript
console.log('1: Script start');

setTimeout(() => {
  console.log('2: setTimeout');
  Promise.resolve().then(() => console.log('3: Promise inside setTimeout'));
}, 0);

Promise.resolve()
  .then(() => {
    console.log('4: Promise 1');
    queueMicrotask(() => console.log('5: Microtask queued from Promise'));
  })
  .then(() => console.log('6: Promise 2'));

queueMicrotask(() => console.log('7: queueMicrotask'));

console.log('8: Script end');
\`\`\`

### Execution Walkthrough

\`\`\`
Step 1: Execute synchronous code
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Call Stack: [main]
Output: "1: Script start"

Step 2: setTimeout scheduled
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Macrotask Queue: [setTimeout callback]
(Timer starts, callback will be queued when timer fires)

Step 3: Promise.resolve().then() scheduled
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Microtask Queue: [Promise 1 callback]

Step 4: queueMicrotask scheduled
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Microtask Queue: [Promise 1 callback, queueMicrotask callback]

Step 5: Continue synchronous execution
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Output: "8: Script end"
Call Stack: [] (empty)

Step 6: Process ALL microtasks
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Execute "Promise 1 callback":
  Output: "4: Promise 1"
  Queues: new microtask (step 5), Promise 2 callback
  
Microtask Queue: [queueMicrotask, microtask from Promise, Promise 2]

Execute "queueMicrotask callback":
  Output: "7: queueMicrotask"

Execute "microtask from Promise":
  Output: "5: Microtask queued from Promise"

Execute "Promise 2 callback":
  Output: "6: Promise 2"

Microtask Queue: [] (empty)

Step 7: Process ONE macrotask
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Execute "setTimeout callback":
  Output: "2: setTimeout"
  Queues: new Promise microtask

Step 8: Process ALL microtasks again
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Execute "Promise inside setTimeout":
  Output: "3: Promise inside setTimeout"

FINAL ORDER:
1: Script start
8: Script end
4: Promise 1
7: queueMicrotask
5: Microtask queued from Promise
6: Promise 2
2: setTimeout
3: Promise inside setTimeout
\`\`\`

## requestAnimationFrame Position

\`\`\`typescript
console.log('1: Start');

requestAnimationFrame(() => console.log('2: rAF'));

setTimeout(() => console.log('3: setTimeout'), 0);

Promise.resolve().then(() => console.log('4: Promise'));

console.log('5: End');

// Output:
// 1: Start
// 5: End
// 4: Promise (microtask)
// 2: rAF (before paint, after microtasks)
// 3: setTimeout (macrotask, may be before or after rAF depending on timing)
\`\`\`

\`\`\`
Event Loop with rAF:

1. Execute script
2. Execute ALL microtasks
3. If it's time to render:
   a. Execute requestAnimationFrame callbacks
   b. Render
4. Execute ONE macrotask
5. Repeat
\`\`\`

## Common Pitfalls

### Infinite Microtask Loop

\`\`\`typescript
// âŒ This blocks everything!
function infiniteMicrotasks() {
  Promise.resolve().then(infiniteMicrotasks);
}
infiniteMicrotasks();

// UI freezes, setTimeout never runs
// Because microtasks keep getting added
\`\`\`

### async/await Behavior

\`\`\`typescript
async function asyncExample() {
  console.log('1: async start');
  
  await Promise.resolve();
  // Everything after await is a microtask!
  
  console.log('2: after await');
}

console.log('3: script start');
asyncExample();
console.log('4: script end');

// Output:
// 3: script start
// 1: async start
// 4: script end
// 2: after await (microtask)
\`\`\`

### Multiple Event Loop Iterations

\`\`\`typescript
// Force multiple event loop iterations
function nextTick(callback: () => void) {
  setTimeout(callback, 0);
}

// Microtask - runs before next render
Promise.resolve().then(() => {
  document.body.style.background = 'red';
});
// User won't see intermediate state

// Macrotask - allows render between
setTimeout(() => {
  document.body.style.background = 'blue';
}, 0);
// User might see previous state briefly
\`\`\`

## Practical Applications

\`\`\`typescript
// 1. Defer heavy work to avoid blocking
function processLargeArray(items: Item[]) {
  let index = 0;
  
  function processChunk() {
    const chunkSize = 100;
    const end = Math.min(index + chunkSize, items.length);
    
    while (index < end) {
      processItem(items[index]);
      index++;
    }
    
    if (index < items.length) {
      // Schedule next chunk as macrotask
      // Allows rendering between chunks
      setTimeout(processChunk, 0);
    }
  }
  
  processChunk();
}

// 2. Batch DOM updates with microtask
let pending = false;
const updates: (() => void)[] = [];

function scheduleUpdate(fn: () => void) {
  updates.push(fn);
  
  if (!pending) {
    pending = true;
    queueMicrotask(() => {
      pending = false;
      const batch = updates.splice(0);
      batch.forEach(fn => fn());
    });
  }
}
\`\`\``,
    keyPoints: [
      'Understands event loop phases',
      'Knows microtask vs macrotask timing',
      'Can trace complex execution order',
      'Understands async/await as microtasks',
      'Knows rAF timing in the loop',
      'Can apply knowledge practically',
    ],
    followUpQuestions: [
      'How does the event loop differ in Node.js?',
      'How would you debug event loop issues?',
      'What causes "long tasks" in performance traces?',
      'How do Web Workers relate to the event loop?',
    ],
    relatedTopics: ['async', 'promises', 'performance', 'javascript-runtime'],
    source: 'seed',
    commonAt: ['Any JS-heavy company'],
  },
  {
    category: QUESTION_CATEGORIES.JS_EVENT_LOOP,
    difficulty: 'mid',
    question:
      'How do async/await work under the hood? What happens when you await a promise, and how does it relate to the event loop?',
    answer: `## async/await as Syntax Sugar

async/await is syntactic sugar over Promises and generators. Understanding this helps predict execution order.

\`\`\`typescript
// async/await version
async function fetchUser() {
  console.log('1');
  const response = await fetch('/api/user');
  console.log('2');
  const data = await response.json();
  console.log('3');
  return data;
}

// Roughly equivalent to:
function fetchUser() {
  console.log('1');
  return fetch('/api/user')
    .then(response => {
      console.log('2');
      return response.json();
    })
    .then(data => {
      console.log('3');
      return data;
    });
}
\`\`\`

## What Happens at Each await

\`\`\`typescript
async function example() {
  console.log('A'); // Synchronous
  
  await Promise.resolve(); // â† Suspension point
  
  console.log('B'); // Runs as microtask
}

console.log('1');
example();
console.log('2');

// Output:
// 1
// A
// 2
// B
\`\`\`

### Detailed Breakdown

\`\`\`
1. console.log('1') executes â†’ Output: "1"
2. example() called
3. console.log('A') executes â†’ Output: "A"  
4. await Promise.resolve() encountered:
   - Promise is already resolved
   - BUT code after await is still scheduled as microtask
   - Function suspends, returns implicit Promise
5. console.log('2') executes â†’ Output: "2"
6. Call stack empty, microtasks run
7. console.log('B') executes â†’ Output: "B"
\`\`\`

## await with Different Values

\`\`\`typescript
// await wraps non-promises in Promise.resolve()
async function test() {
  const a = await 42;           // Same as await Promise.resolve(42)
  const b = await 'string';     // Same as await Promise.resolve('string')
  const c = await fetchData();  // Actual promise
}
\`\`\`

## Execution Flow Visualization

\`\`\`typescript
async function outer() {
  console.log('outer-1');
  await inner();
  console.log('outer-2');
}

async function inner() {
  console.log('inner-1');
  await Promise.resolve();
  console.log('inner-2');
}

console.log('start');
outer();
console.log('end');
\`\`\`

\`\`\`
Execution Trace:

â”‚ Call Stack          â”‚ Microtask Queue        â”‚ Output
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€
â”‚ [main]              â”‚ []                     â”‚ "start"
â”‚ [main, outer]       â”‚ []                     â”‚ "outer-1"
â”‚ [main, outer, inner]â”‚ []                     â”‚ "inner-1"
â”‚ [main, outer, inner]â”‚ [inner continuation]   â”‚ (await, suspend inner)
â”‚ [main, outer]       â”‚ [inner continuation,   â”‚ (await, suspend outer)
â”‚                     â”‚  outer continuation]   â”‚
â”‚ [main]              â”‚ [inner cont, outer cont]â”‚ "end"
â”‚ []                  â”‚ [inner cont, outer cont]â”‚ 
â”‚ [inner continuation]â”‚ [outer continuation]   â”‚ "inner-2"
â”‚ []                  â”‚ [outer continuation]   â”‚
â”‚ [outer continuation]â”‚ []                     â”‚ "outer-2"

Final Output: start, outer-1, inner-1, end, inner-2, outer-2
\`\`\`

## Error Handling

\`\`\`typescript
async function withError() {
  try {
    await Promise.reject(new Error('Failed'));
  } catch (error) {
    console.log('Caught:', error.message);
  }
}

// Equivalent to:
function withError() {
  return Promise.reject(new Error('Failed'))
    .catch(error => {
      console.log('Caught:', error.message);
    });
}
\`\`\`

### Unhandled Rejections

\`\`\`typescript
// âŒ Unhandled rejection - no try/catch, no .catch()
async function risky() {
  await Promise.reject(new Error('Oops'));
}
risky(); // UnhandledPromiseRejectionWarning

// âœ… Handled
async function safe() {
  try {
    await Promise.reject(new Error('Oops'));
  } catch (e) {
    console.error(e);
  }
}

// âœ… Or handle when calling
risky().catch(console.error);
\`\`\`

## Parallel vs Sequential

\`\`\`typescript
// Sequential - one at a time
async function sequential() {
  const user = await fetchUser();     // Wait...
  const posts = await fetchPosts();   // Then wait...
  const comments = await fetchComments(); // Then wait...
  // Total time: sum of all requests
}

// Parallel - all at once
async function parallel() {
  const [user, posts, comments] = await Promise.all([
    fetchUser(),
    fetchPosts(),
    fetchComments(),
  ]);
  // Total time: max of all requests
}

// Be careful with loops!
// âŒ Sequential (slow)
async function processItems(items: Item[]) {
  for (const item of items) {
    await processItem(item);
  }
}

// âœ… Parallel
async function processItems(items: Item[]) {
  await Promise.all(items.map(item => processItem(item)));
}
\`\`\`

## Top-Level Await

\`\`\`typescript
// ES2022+ in modules
// module.ts
const config = await loadConfig();
export { config };

// Importing module waits for await to complete
import { config } from './module.ts';
// config is guaranteed to be loaded
\`\`\`

## Common Patterns

\`\`\`typescript
// 1. Timeout wrapper
function timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), ms)
    ),
  ]);
}

const data = await timeout(fetchData(), 5000);

// 2. Retry with backoff
async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delay = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      await new Promise(r => setTimeout(r, delay * attempt));
    }
  }
  throw new Error('Unreachable');
}

// 3. Async IIFE (for non-module contexts)
(async () => {
  const data = await fetchData();
  console.log(data);
})();
\`\`\``,
    keyPoints: [
      'Knows async/await is Promise syntax sugar',
      'Understands suspension points at await',
      'Can trace execution order correctly',
      'Knows parallel vs sequential patterns',
      'Handles errors properly',
      'Understands top-level await',
    ],
    followUpQuestions: [
      'How would you handle cleanup in async functions?',
      'What about async generators?',
      'How do async stack traces work?',
      'When would you prefer raw Promises over async/await?',
    ],
    relatedTopics: ['promises', 'event-loop', 'error-handling'],
    source: 'seed',
    commonAt: ['General JavaScript knowledge'],
  },
];

// ============================================================================
// ACCESSIBILITY
// ============================================================================

const accessibilityQuestions: CreateQuestionInput[] = [
  {
    category: QUESTION_CATEGORIES.ACCESSIBILITY,
    difficulty: 'senior',
    question:
      'How would you implement accessible keyboard navigation for a complex component like a dropdown menu or modal? Cover focus management, keyboard traps, and ARIA attributes.',
    answer: `## Modal Accessibility Implementation

### 1. Focus Management

\`\`\`typescript
function Modal({ 
  isOpen, 
  onClose, 
  children 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  children: React.ReactNode;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  
  useEffect(() => {
    if (isOpen) {
      // Save current focus
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Focus first focusable element in modal
      const focusableElements = getFocusableElements(modalRef.current);
      focusableElements[0]?.focus();
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      // Restore focus when closing
      previousFocusRef.current?.focus();
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return createPortal(
    <div 
      className="modal-backdrop"
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
        onClick={e => e.stopPropagation()}
        onKeyDown={e => handleKeyDown(e, modalRef.current, onClose)}
      >
        <h2 id="modal-title">Modal Title</h2>
        <p id="modal-description">Modal description for screen readers</p>
        {children}
        <button onClick={onClose}>Close</button>
      </div>
    </div>,
    document.body
  );
}
\`\`\`

### 2. Focus Trap

\`\`\`typescript
function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  
  const selector = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');
  
  return Array.from(container.querySelectorAll<HTMLElement>(selector));
}

function handleKeyDown(
  event: React.KeyboardEvent,
  container: HTMLElement | null,
  onClose: () => void
) {
  if (!container) return;
  
  switch (event.key) {
    case 'Escape':
      event.preventDefault();
      onClose();
      break;
      
    case 'Tab':
      const focusableElements = getFocusableElements(container);
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      if (event.shiftKey) {
        // Shift+Tab: going backwards
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab: going forward
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
      break;
  }
}
\`\`\`

### 3. Reusable Focus Trap Hook

\`\`\`typescript
function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  
  useEffect(() => {
    if (!isActive) return;
    
    previousFocusRef.current = document.activeElement as HTMLElement;
    
    const container = containerRef.current;
    if (!container) return;
    
    // Focus first element
    const focusable = getFocusableElements(container);
    focusable[0]?.focus();
    
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      
      const focusable = getFocusableElements(container);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [isActive]);
  
  return containerRef;
}
\`\`\`

## Dropdown Menu Implementation

\`\`\`typescript
function DropdownMenu({ 
  trigger, 
  items 
}: { 
  trigger: React.ReactNode;
  items: { label: string; onClick: () => void; disabled?: boolean }[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  
  // Generate unique IDs
  const menuId = useId();
  
  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setActiveIndex(0);
        } else {
          setActiveIndex(prev => 
            prev < items.length - 1 ? prev + 1 : 0
          );
        }
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        if (isOpen) {
          setActiveIndex(prev => 
            prev > 0 ? prev - 1 : items.length - 1
          );
        }
        break;
        
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (isOpen && activeIndex >= 0) {
          items[activeIndex].onClick();
          setIsOpen(false);
          triggerRef.current?.focus();
        } else {
          setIsOpen(true);
          setActiveIndex(0);
        }
        break;
        
      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
        
      case 'Tab':
        setIsOpen(false);
        break;
        
      case 'Home':
        event.preventDefault();
        setActiveIndex(0);
        break;
        
      case 'End':
        event.preventDefault();
        setActiveIndex(items.length - 1);
        break;
    }
  };
  
  // Focus active item
  useEffect(() => {
    if (isOpen && activeIndex >= 0) {
      itemRefs.current[activeIndex]?.focus();
    }
  }, [isOpen, activeIndex]);
  
  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    
    function handleClick(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node) &&
          !triggerRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [isOpen]);
  
  return (
    <div className="dropdown" onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen(!isOpen)}
      >
        {trigger}
      </button>
      
      {isOpen && (
        <ul
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-labelledby="dropdown-trigger"
        >
          {items.map((item, index) => (
            <li
              key={index}
              ref={el => itemRefs.current[index] = el}
              role="menuitem"
              tabIndex={activeIndex === index ? 0 : -1}
              aria-disabled={item.disabled}
              onClick={() => {
                if (!item.disabled) {
                  item.onClick();
                  setIsOpen(false);
                  triggerRef.current?.focus();
                }
              }}
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
\`\`\`

## ARIA Attributes Reference

\`\`\`html
<!-- Modal -->
<div role="dialog" aria-modal="true" aria-labelledby="title" aria-describedby="desc">
  <h2 id="title">Title</h2>
  <p id="desc">Description</p>
</div>

<!-- Dropdown -->
<button aria-haspopup="menu" aria-expanded="false" aria-controls="menu-id">
  Menu
</button>
<ul id="menu-id" role="menu">
  <li role="menuitem" tabindex="-1">Item 1</li>
  <li role="menuitem" tabindex="-1" aria-disabled="true">Item 2</li>
</ul>

<!-- Tabs -->
<div role="tablist" aria-label="Settings">
  <button role="tab" aria-selected="true" aria-controls="panel-1">Tab 1</button>
  <button role="tab" aria-selected="false" aria-controls="panel-2">Tab 2</button>
</div>
<div role="tabpanel" id="panel-1" aria-labelledby="tab-1">Content 1</div>
<div role="tabpanel" id="panel-2" aria-labelledby="tab-2" hidden>Content 2</div>
\`\`\`

## Common Patterns

| Component | Key Behaviors |
|-----------|--------------|
| Modal | Focus trap, Escape closes, aria-modal |
| Dropdown | Arrow keys, Enter/Space select, Escape closes |
| Tabs | Arrow keys navigate, Home/End, no trap |
| Combobox | Arrow keys, filtering, aria-activedescendant |
| Tree | Arrow keys (horizontal for expand), Home/End |`,
    keyPoints: [
      'Implements proper focus management',
      'Creates focus traps correctly',
      'Handles all keyboard interactions',
      'Uses correct ARIA attributes',
      'Restores focus on close',
      'Manages roving tabindex for menus',
    ],
    followUpQuestions: [
      'How would you test these accessibility features?',
      'What about touch device accessibility?',
      'How do you handle dynamic content announcements?',
      'What\'s the difference between aria-label and aria-labelledby?',
    ],
    relatedTopics: ['a11y', 'keyboard-navigation', 'aria', 'focus-management'],
    source: 'seed',
    commonAt: ['Any company caring about accessibility'],
  },
  {
    category: QUESTION_CATEGORIES.ACCESSIBILITY,
    difficulty: 'mid',
    question:
      'What are the most common accessibility issues you\'ve encountered in React applications, and how do you fix them?',
    answer: `## Top Accessibility Issues & Fixes

### 1. Missing or Poor Alt Text

\`\`\`tsx
// âŒ Bad
<img src="chart.png" />
<img src="profile.jpg" alt="image" />
<img src="icon.svg" alt="icon" />

// âœ… Good - Descriptive alt for meaningful images
<img src="chart.png" alt="Q3 revenue increased 25% compared to Q2" />
<img src="profile.jpg" alt="Jane Smith, CEO" />

// âœ… Good - Empty alt for decorative images
<img src="decorative-border.png" alt="" role="presentation" />

// âœ… Good - Icon buttons need accessible name
<button aria-label="Close dialog">
  <img src="close-icon.svg" alt="" />
</button>
\`\`\`

### 2. Missing Form Labels

\`\`\`tsx
// âŒ Bad - No label
<input type="email" placeholder="Enter email" />

// âŒ Bad - Placeholder is not a label
<input type="email" placeholder="Email" />

// âœ… Good - Explicit label
<label htmlFor="email">Email</label>
<input type="email" id="email" />

// âœ… Good - Implicit label (wrapping)
<label>
  Email
  <input type="email" />
</label>

// âœ… Good - Visually hidden but accessible
<label htmlFor="search" className="sr-only">Search products</label>
<input type="search" id="search" placeholder="Search..." />

// CSS for sr-only
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
\`\`\`

### 3. Poor Color Contrast

\`\`\`css
/* âŒ Bad - Low contrast */
.text {
  color: #999999; /* on white background - 2.8:1 ratio */
}

/* âœ… Good - Meets WCAG AA (4.5:1 for normal text) */
.text {
  color: #595959; /* on white background - 7:1 ratio */
}

/* âœ… Good - Large text can have lower contrast (3:1) */
.heading {
  font-size: 24px;
  font-weight: bold;
  color: #767676; /* 4.5:1 is fine for large text */
}
\`\`\`

### 4. Non-Semantic HTML

\`\`\`tsx
// âŒ Bad - Div soup
<div className="header">
  <div className="nav">
    <div onClick={goHome}>Home</div>
    <div onClick={goAbout}>About</div>
  </div>
</div>

// âœ… Good - Semantic HTML
<header>
  <nav aria-label="Main navigation">
    <a href="/">Home</a>
    <a href="/about">About</a>
  </nav>
</header>

// Semantic elements to use:
<main>        // Main content
<article>     // Self-contained content
<section>     // Thematic grouping
<aside>       // Tangentially related content
<header>      // Introductory content
<footer>      // Footer content
<nav>         // Navigation
<figure>      // Illustrations, diagrams
<figcaption>  // Caption for figure
\`\`\`

### 5. Click Handlers on Non-Interactive Elements

\`\`\`tsx
// âŒ Bad - Not keyboard accessible
<div onClick={handleClick}>Click me</div>
<span onClick={handleClick}>Action</span>

// âœ… Good - Use button
<button onClick={handleClick}>Click me</button>

// âœ… Good - If must use div, add all necessary attributes
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
>
  Click me
</div>

// âœ… Better - Use a link for navigation
<a href="/products">View Products</a>
\`\`\`

### 6. Missing Skip Links

\`\`\`tsx
// âœ… Add skip link as first focusable element
function App() {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Header />
      <main id="main-content" tabIndex={-1}>
        {/* Content */}
      </main>
    </>
  );
}

// CSS
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  padding: 8px;
  background: #000;
  color: #fff;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
\`\`\`

### 7. Auto-Playing Media

\`\`\`tsx
// âŒ Bad - Auto-plays without user control
<video autoPlay src="intro.mp4" />

// âœ… Good - Muted autoplay is acceptable, with controls
<video autoPlay muted controls src="intro.mp4">
  <track kind="captions" src="captions.vtt" label="English" />
</video>

// âœ… Good - No autoplay, user initiates
<video controls>
  <source src="intro.mp4" type="video/mp4" />
  <track kind="captions" src="captions.vtt" label="English" />
</video>
\`\`\`

### 8. Missing Heading Hierarchy

\`\`\`tsx
// âŒ Bad - Skipping levels, using for styling
<h1>Page Title</h1>
<h4>Section</h4>  {/* Skipped h2, h3 */}
<h2>Another Section</h2>

// âœ… Good - Proper hierarchy
<h1>Page Title</h1>
<h2>Section</h2>
<h3>Subsection</h3>
<h2>Another Section</h2>

// Use CSS for styling, not heading levels
<h2 className="text-sm font-normal">Correctly sized h2</h2>
\`\`\`

### 9. Missing Error Announcements

\`\`\`tsx
// âŒ Bad - Errors only visible, not announced
{error && <span className="error">{error}</span>}

// âœ… Good - Use aria-live for dynamic announcements
<div aria-live="polite" aria-atomic="true">
  {error && <span role="alert">{error}</span>}
</div>

// âœ… Good - Associate error with input
<input
  id="email"
  aria-invalid={!!error}
  aria-describedby={error ? 'email-error' : undefined}
/>
{error && <span id="email-error" role="alert">{error}</span>}
\`\`\`

### 10. Motion Without Respecting Preferences

\`\`\`css
/* âœ… Good - Respect user preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
\`\`\`

\`\`\`typescript
// React hook for motion preferences
function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  
  return prefersReducedMotion;
}
\`\`\`

## Quick Audit Checklist

\`\`\`markdown
- [ ] All images have appropriate alt text
- [ ] All form inputs have labels
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Page is navigable by keyboard only
- [ ] Focus indicators are visible
- [ ] Heading hierarchy is logical
- [ ] Interactive elements are properly announced
- [ ] Error messages are accessible
- [ ] Skip link is present
- [ ] No keyboard traps (except modals)
\`\`\``,
    keyPoints: [
      'Knows common accessibility issues',
      'Can fix alt text properly',
      'Understands form labeling requirements',
      'Uses semantic HTML correctly',
      'Makes custom components keyboard accessible',
      'Implements skip links and error announcements',
    ],
    followUpQuestions: [
      'How do you test for accessibility issues?',
      'What tools do you use for accessibility auditing?',
      'How do you prioritize accessibility fixes?',
      'What about accessibility in SPAs vs traditional sites?',
    ],
    relatedTopics: ['a11y', 'semantic-html', 'wcag', 'screen-readers'],
    source: 'seed',
    commonAt: ['Any company with accessibility requirements'],
  },
];

export { 
  featureFlagsQuestionsContinued, 
  cssLayoutQuestions, 
  jsEventLoopQuestions, 
  accessibilityQuestions 
};
