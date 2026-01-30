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
];
