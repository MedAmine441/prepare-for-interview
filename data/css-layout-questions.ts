// ============================================================================
// CSS & LAYOUT - SENIOR CONSOLIDATED
// ============================================================================

import { CreateQuestionInput, QUESTION_CATEGORIES } from "@/types";

export const cssLayoutQuestions: CreateQuestionInput[] = [
  {
    category: QUESTION_CATEGORIES.CSS_LAYOUT,
    difficulty: "senior",
    question:
      "Deep dive into the CSS Stacking Context: What triggers it, how does the browser determine paint order, and how do you architect z-index at scale?",
    answer: `## Stacking Context & The Z-Axis

A stacking context is a three-dimensional conceptualization of HTML elements. Elements within a context are painted as a single atomic unit. A child element with \`z-index: 9999\` cannot break out of a parent stacking context that is ranked lower than a sibling.

### 1. Creation Triggers (Common & Obscure)


Beyond the root \`<html>\`, a new context is created by:
* **Positioning**: \`relative\`, \`absolute\`, \`fixed\`, or \`sticky\` WITH a \`z-index\` other than \`auto\`.
* **Visual Effects**: \`opacity\` < 1, \`filter\`, \`mask\`, \`clip-path\`, or \`mix-blend-mode\` (other than \`normal\`).
* **Geometry**: \`transform\` (even \`translateZ(0)\`), \`perspective\`, or \`container-type\`.
* **Explicit Intent**: \`isolation: isolate\` (the cleanest way to create a context without side effects).
* **Performance Optimization**: \`will-change\` specifying any property that would create a context.

### 2. The Global Stacking Order (Bottom to Top)
1. **Background & Borders**: Of the element forming the context.
2. **Negative Z-Index**: Descendants within the context.
3. **Non-Positioned Blocks**: In DOM order.
4. **Floats**: Non-positioned floating elements.
5. **Inline Descendants**: Text and inline-level boxes.
6. **Z-Index 0 / Auto**: Positioned descendants.
7. **Positive Z-Index**: Ranked by value, then DOM order.

### 3. Senior Debugging & Architecture
To prevent "z-index wars," implement a tokenized scale:

\`\`\`css
:root {
  /* Increments of 10 or 100 to allow "emergency" overrides */
  --z-base: 0;
  --z-dropdown: 1000;
  --z-sticky: 2000;
  --z-modal-backdrop: 3000;
  --z-modal-content: 3010;
  --z-toast: 4000;
}
\`\`\`

**The "Isolation" Pattern:**
Use \`isolation: isolate\` on components like Cards or Modals to ensure their internal \`z-index\` logic never leaks or interacts with the rest of the app.

\`\`\`typescript
// Utility to find the nearest Stacking Context ancestor
const getStackingContext = (el: HTMLElement): HTMLElement | null => {
  let node: HTMLElement | null = el;
  while (node) {
    const style = getComputedStyle(node);
    if (
      style.zIndex !== 'auto' || 
      style.opacity !== '1' || 
      style.transform !== 'none' ||
      style.isolation === 'isolate'
    ) return node;
    node = node.parentElement;
  }
  return null;
};
\`\`\``,
    keyPoints: [
      "Explains the atomic nature of nested stacking contexts",
      "Identifies non-obvious triggers like 'filter' and 'perspective'",
      "Articulates the internal paint order (7-layer rule)",
      "Proposes an architectural solution (Z-index tokens + isolation: isolate)",
    ],
    followUpQuestions: [
      "How do Portals in React help solve stacking context limitations?",
      "Does a 'fixed' position element always create a stacking context in all browsers?",
    ],
    relatedTopics: ["Rendering Pipeline", "Z-index Architecture", "Portals"],
    source: "seed",
    commonAt: ["Big Tech", "Enterprise SaaS"],
  },
  {
    category: QUESTION_CATEGORIES.CSS_LAYOUT,
    difficulty: "senior",
    question:
      "Compare Flexbox vs. Grid for complex application layouts. When does Grid's 2D approach become a performance or maintainability necessity?",
    answer: `## Architectural Comparison



### 1. Dimensionality & Control
* **Flexbox (Content-Out)**: One-dimensional. Best for components where the size of the content should dictate the layout (e.g., a dynamic navigation bar or a row of tags).
* **Grid (Layout-In)**: Two-dimensional. Best for rigid structures where the container should dictate the placement of items (e.g., dashboard layouts, complex forms).

### 2. Senior Use Cases for CSS Grid
* **Subgrid**: Essential for aligning nested component parts (like card headers/footers) across multiple grid items.
* **Overlapping**: Unlike Flexbox (which requires negative margins or absolute positioning), Grid allows multiple items to occupy the same cell/area naturally via \`grid-area\`.
* **Named Areas**: Drastically improves maintainability for responsive design:
  \`\`\`css
  .dashboard {
    display: grid;
    grid-template-areas: 
      "head head"
      "side main";
  }
  @media (max-width: 600px) {
    .dashboard {
      grid-template-areas: 
        "head"
        "main"
        "side";
    }
  }
  \`\`\`

### 3. Performance Considerations
While Flexbox is generally "cheaper" to calculate for small components, complex 2D layouts using nested Flexboxes can lead to "Layout Thrashing" because the browser has to calculate the height of the row to determine the width of the items, then re-calculate. Grid handles these two axes simultaneously, often resulting in more predictable rendering in complex UIs.`,
    keyPoints: [
      "Distinguishes between 'Content-Out' (Flex) and 'Layout-In' (Grid) philosophies",
      "Advocates for 'subgrid' to solve cross-component alignment",
      "Explains 'grid-template-areas' as a maintainability win",
      "Mentions performance implications of nested layout engines",
    ],
    followUpQuestions: [
      "How do Container Queries change the way we use Grid?",
      "When is 'display: contents' useful in a Grid/Flex environment?",
    ],
    relatedTopics: ["Responsive Architecture", "Subgrid", "Layout Performance"],
    source: "seed",
    commonAt: ["Fintech Dashboards", "Design Systems Teams"],
  },
  {
    category: QUESTION_CATEGORIES.CSS_LAYOUT,
    difficulty: "senior",
    question:
      "What is a Block Formatting Context (BFC), and why is 'display: flow-root' the modern standard for component isolation?",
    answer: `## The Block Formatting Context (BFC)

A BFC is an independent layout mini-universe. Things happening inside a BFC (like floats or margins) stay inside that BFC.

### 1. Key Responsibilities of a BFC
* **Containment of Floats**: A BFC container will grow to encompass its floated children (eliminating the need for old Clearfix hacks).
* **Margin Collapse Prevention**: Vertical margins of elements inside a BFC will not collapse with the margins of the BFC container itself.
* **Float Interference**: Elements forming a BFC will not overlap with external floats; instead, they will sit alongside them (useful for sidebars).

### 2. The Evolution of BFC Creation


| Method | Side Effects | Modern Status |
| :--- | :--- | :--- |
| \`overflow: hidden\` | Clips tooltips/shadows; hides scrollbars | Legacy / Risky |
| \`float: left/right\` | Changes element flow; width becomes shrink-wrap | Specialized only |
| \`display: inline-block\`| Adds whitespace issues; breaks block flow | Specific UI needs |
| **\`display: flow-root\`** | **None.** Creates a BFC with zero side effects. | **Modern Standard** |

### 3. The "Why" for Senior Developers
In modern component-based architecture (React/Vue/Web Components), using \`display: flow-root\` on your wrapper ensures that your component is **layout-pure**. It won't accidentally collapse its margins into the parent page, and it won't break if a consumer of your component uses floats nearby.

\`\`\`css
/* The 'Layout-Safe' Component Wrapper */
.component-root {
  display: flow-root;
  contain: layout; /* Further optimization for rendering performance */
}
\`\`\``,
    keyPoints: [
      "Defines BFC as a layout sandbox",
      "Explains the mechanics of margin collapse and float containment",
      "Champions 'display: flow-root' as the side-effect-free successor to 'overflow: hidden'",
      "Links BFC to component-based isolation principles",
    ],
    followUpQuestions: [
      "How does 'contain: layout' differ from a BFC?",
      "Does Flexbox create a BFC for its children?",
    ],
    relatedTopics: [
      "Margin Collapse",
      "Layout Engines",
      "Component Encapsulation",
    ],
    source: "seed",
    commonAt: ["Senior Frontend Roles"],
  },
  {
    category: QUESTION_CATEGORIES.CSS_LAYOUT,
    difficulty: "junior",
    question:
      "How does CSS specificity work? Explain the cascade order and where @layer fits in.",
    answer: `## The cascade decides every property

When multiple rules target an element, the winner is chosen by, in order: **origin & importance** (user-agent < user < author; \`!important\` reverses origin order) → **cascade layers** → **specificity** → **source order** (last wins).

## Specificity as (A, B, C)

Count per selector: **A** = id selectors, **B** = classes/attributes/pseudo-classes, **C** = element types/pseudo-elements. Compare left to right — \`(1,0,0)\` beats \`(0,10,0)\`.

\`\`\`css
#nav .item a      /* (1,1,1) */
.nav .item a:hover /* (0,3,1) — loses to the id rule */
\`\`\`

Details worth knowing: inline \`style=""\` outranks all selectors; the universal selector adds nothing; \`:where(...)\` contributes **zero** specificity (great for resets), while \`:is(...)\`/\`:not(...)\` take the specificity of their most specific argument.

## @layer

Cascade layers let you order whole groups of rules **above specificity**:

\`\`\`css
@layer reset, components, utilities;
@layer components { .btn { color: blue; } }
@layer utilities  { .text-red { color: red; } } /* wins over ANY components rule */
\`\`\`

A later layer beats an earlier one regardless of selector strength — ending specificity wars structurally (unlayered styles beat all layers, so adopt it consistently). Tailwind v4 and modern design systems are built on this.

## Hygiene

Keep selectors flat (single class), avoid ids and \`!important\` in components, use \`:where()\` in shared resets so app code can always override.`,
    keyPoints: [
      "Cascade order: origin/importance → layers → specificity → source order",
      "Specificity = (ids, classes/attrs/pseudo-classes, elements), compared left-first",
      ":where() adds zero specificity; inline styles outrank selectors",
      "@layer orders rule groups above specificity — ends specificity wars",
    ],
    followUpQuestions: [
      "Why do utility classes and BEM both keep specificity flat?",
      "How does !important interact with layers?",
    ],
    relatedTopics: ["cascade", "css-architecture", "design-systems"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.CSS_LAYOUT,
    difficulty: "mid",
    question:
      "Container queries vs media queries: what problem do container queries solve, and how do you use them?",
    answer: `## The problem with media queries

Media queries respond to the **viewport**. But a reusable card renders in a wide main column on one page and a narrow sidebar on another — same viewport, completely different available space. Component libraries ended up with page-level overrides everywhere, breaking encapsulation.

## Container queries: respond to the parent

\`\`\`css
.card-container {
  container-type: inline-size;   /* establishes a query container */
  container-name: card;           /* optional, for targeting */
}

.card { display: flex; flex-direction: column; }

@container card (min-width: 400px) {
  .card { flex-direction: row; }  /* horizontal when ITS OWN slot is wide */
}
\`\`\`

The component now adapts to wherever it's placed — truly self-contained responsive design. \`container-type: inline-size\` is the practical value (width-only); it applies containment, so the element can't size itself from its contents' width.

Also in the toolbox: **container query units** — \`cqw\`/\`cqi\` (1% of container width/inline-size) for fluid typography scoped to the container rather than the viewport.

## How they divide the work now

- **Media queries**: page-level layout (columns, nav collapse), user preferences (\`prefers-color-scheme\`, \`prefers-reduced-motion\`), input capabilities.
- **Container queries**: every reusable component's internal layout.

Baseline support since 2023 — safe to use, with mobile-first defaults as the natural fallback for old browsers.`,
    keyPoints: [
      "Media queries see the viewport; components care about their slot",
      "container-type: inline-size + @container makes components self-adaptive",
      "cqw/cqi units enable container-relative fluid sizing",
      "Split: media for page layout & preferences, container for components",
    ],
    followUpQuestions: [
      "Why does a query container need containment to avoid circularity?",
      "What are style queries (@container style(...))?",
    ],
    relatedTopics: ["responsive-design", "css-containment", "design-systems"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.CSS_LAYOUT,
    difficulty: "junior",
    question:
      "What are the modern ways to center an element in CSS? Compare the approaches and their use cases.",
    answer: `## The two modern defaults

\`\`\`css
/* Flexbox — centering content in a flow */
.parent { display: flex; justify-content: center; align-items: center; }

/* Grid — the shortest incantation */
.parent { display: grid; place-content: center; }
\`\`\`

Either handles the historical nightmare (vertical centering of unknown-height content) in one rule. Use flex when the parent is already a flex row/column; \`place-content\` when the wrapper exists purely to center.

## Centering yourself (no parent cooperation)

\`\`\`css
/* block axis: margin auto now works vertically in flex/grid parents */
.child { margin: auto; }

/* overlay/modal — out of flow */
.modal {
  position: fixed;
  inset: 0;
  margin: auto;            /* with a fixed size */
  /* or the classic: top: 50%; left: 50%; translate: -50% -50%; */
  width: fit-content; height: fit-content;
}
\`\`\`

The translate trick still matters when the element must stay positioned (tooltips, popovers) — though \`anchor positioning\` is arriving for exactly that.

## Text and inline content

- Horizontal: \`text-align: center\`.
- Single-line vertical: line-height matching height (old school) — prefer flex on the container now.

## What to say in an interview

Name flex/grid first, then show you know **why** the old hacks existed (no block-axis centering primitive before flex), and match the tool to context: content in a container → flex/grid; overlays → fixed + inset + margin auto; never absolute-position for normal document flow.`,
    keyPoints: [
      "flex justify/align-items or grid place-content are the defaults",
      "inset: 0 + margin: auto centers fixed/absolute overlays",
      "translate(-50%,-50%) remains for positioned tooltips/popovers",
      "Match technique to context — don't absolutely position normal flow",
    ],
    followUpQuestions: [
      "How does margin: auto behave differently in flex vs block layout?",
      "How would you center a tooltip relative to its trigger?",
    ],
    relatedTopics: ["flexbox", "grid", "positioning"],
    source: "seed",
  },
];
