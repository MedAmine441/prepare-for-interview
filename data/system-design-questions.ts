// data/seed-data.ts

import type { CreateQuestionInput } from "@/types";
import { QUESTION_CATEGORIES } from "@/types";

// ============================================================================
// SYSTEM DESIGN & ARCHITECTURE (SENIOR/STAFF LEVEL)
// ============================================================================

export const systemDesignQuestions: CreateQuestionInput[] = [
  {
    category: QUESTION_CATEGORIES.SYSTEM_DESIGN,
    difficulty: "senior",
    question:
      "Architect a Local-First Collaborative Editor (e.g., Notion/Google Docs). Focus on data consistency (CRDTs), offline persistence, and performance for large documents.",
    answer: `## Architectural Strategy: The "Hybrid Consistency" Model

A senior implementation moves beyond basic WebSocket connections to a **Local-First** architecture. We treat the browser's IndexedDB as the source of truth, syncing to the server in the background.

### 1. Data Structure & Consistency
**Decision:** Use CRDTs (Yjs/Automerge) for text, but Atomic Locking for structural blocks.
* **Text (CRDT):** Commutative operations allow lock-free concurrent editing.
* **Block Structure (Last-Write-Wins):** Moving a paragraph is a structural change. Using CRDTs here can result in "ghost" paragraphs. A "Block Locking" or LWW approach is often more predictable for layout.

### 2. The "Sync Engine" Layer
Decouple networking from the view. The UI subscribes to a local store, not the socket.

\`\`\`typescript
// Architecture Concept: The Sync Worker
// Moving sync logic to a SharedWorker prevents tab-freezing during large merges.

class DocumentSyncWorker {
  private db: IndexedDB;
  private ws: WebSocket;
  private doc: Y.Doc;

  constructor() {
    this.setupPersistence(); // Load from IDB first (Instant load)
    this.setupNetwork();     // Connect to signaling server
  }

  // Delta updates only to save bandwidth
  sync(update: Uint8Array) {
    this.ws.send(update);
    this.db.store(update); 
  }
}
\`\`\`

### 3. Performance & Virtualization
**Problem:** Rendering 500 pages of DOM nodes kills performance.
**Solution:**
* **Windowing:** Only render the viewport + buffer.
* **Layered Rendering:** * *Layer 1 (Canvas):* Minimap/Scrollbar highlights (high frequency).
    * *Layer 2 (DOM):* Editable text nodes.
* **Heuristic:** If a user types fast, pause "heavy" reconciliations (e.g., table of contents updates) until the user goes idle (debounce).

### 4. Trade-offs
* **Memory:** CRDTs grow indefinitely (tombstones). **Mitigation:** Implement "Squashing" protocols on the server to prune history periodically.
* **Initial Load:** Large docs take time to parse. **Mitigation:** Server-side rendering (SSR) of the initial static HTML snapshot while the CRDT hydrates in the background.`,
    keyPoints: [
      "Local-First Architecture (Offline reliability)",
      "CRDTs (Yjs) vs. Operational Transformation (OT)",
      "SharedWorker for off-main-thread processing",
      "Virtualization strategies for DOM limits",
      "History pruning (Garbage collection for CRDTs)",
    ],
    followUpQuestions: [
      "How do you handle 'cursor' broadcasting without polluting the document history?",
      "Design the backend storage for a CRDT-based system (Database vs. Blob storage).",
      "How would you implement 'Undo/Redo' ensuring it only affects the local user's actions?",
    ],
    relatedTopics: ["crdt", "web-workers", "performance", "indexeddb"],
    source: "seed",
    commonAt: ["Notion", "Figma", "Atlassian"],
  },
  {
    category: QUESTION_CATEGORIES.SYSTEM_DESIGN,
    difficulty: "senior",
    question:
      "Design a scalable Component Library (Design System) for a multi-team organization. Address 'Headless' architecture, Design Tokens, and preventing bundle bloat.",
    answer: `## Architectural Strategy: The "Headless + Skin" Pattern

The goal is to separate **Behavior** (Accessibility/Logic) from **Appearance** (Styling). This prevents "Prop Drilling Hell" and ensures accessibility consistency.

### 1. The Headless Foundation
Don't write your own Combobox logic. Wrap "Headless" primitives (e.g., Radix UI, React Aria).
* **Why:** They handle the complex WAI-ARIA specs, keyboard navigation, and focus management.
* **Our Layer:** We apply the *Corporate Brand* on top.

### 2. API Design: Composition over Configuration
Avoid the "God Component" (e.g., \`<Button variant="primary" size="lg" iconLeft="..." />\`).
Use the **Compound Component** pattern to allow flexibility without API bloat.

\`\`\`tsx
// ❌ Anti-Pattern: One component, 50 props
<Modal title="Hi" onClose={...} footerButtons={[...]} />

// ✅ Senior Pattern: Composition
<Modal.Root open={isOpen}>
  <Modal.Overlay />
  <Modal.Content>
    <Modal.Title>Hi</Modal.Title>
    <Modal.Description>...</Modal.Description>
    <Modal.Footer>
       {/* Consumer controls the layout completely */}
       <Button>Save</Button> 
    </Modal.Footer>
  </Modal.Content>
</Modal.Root>
\`\`\`

### 3. Design Tokens (The Contract)
Do not use raw hex codes or pixels in components. Use semantic tokens.
* **Primitive:** \`blue-500: #3b82f6\`
* **Semantic:** \`btn-primary-bg: var(--blue-500)\`
* **Architecture:** Export tokens as JSON. Use a build script (Style Dictionary) to generate CSS variables for Web, XML for Android, and Swift classes for iOS.

### 4. Delivery & Tree Shaking
* **Barrel Files:** Dangerous. If \`import { Button } from '@ui/kit'\` imports the DatePicker, you failed.
* **Solution:** ensure \`package.json\` has \`"sideEffects": false\`.
* **CSS Extraction:** Decide between Runtime (Emotion/Styled-components) vs. Zero-Runtime (Vanilla Extract/Tailwind). **Recommendation:** Zero-runtime for better performance and smaller bundles.`,
    keyPoints: [
      "Headless UI (Radix/React Aria) integration",
      "Compound Component Pattern vs. Monolithic Props",
      "Semantic Design Tokens vs. Hardcoded values",
      "Tree-shaking and 'sideEffects' configuration",
      "Polymorphism (asChild / 'as' prop) handling",
    ],
    followUpQuestions: [
      "How do you handle versioning? (Monorepo vs. Versioned Packages)",
      "Explain how you would implement a 'Theming Engine' that supports multiple brands.",
      "How do you enforce accessibility (a11y) in the CI/CD pipeline?",
    ],
    relatedTopics: ["design-systems", "a11y", "monorepo", "css-architecture"],
    source: "seed",
    commonAt: ["Airbnb", "Shopify", "Vercel"],
  },
  {
    category: QUESTION_CATEGORIES.SYSTEM_DESIGN,
    difficulty: "senior",
    question:
      "Architect a High-Frequency Trading Dashboard. It must handle 100+ updates/sec across 50 widgets without freezing the main thread.",
    answer: `## Architectural Strategy: The "Off-Main-Thread" Pipeline

React is fast, but it cannot handle 100+ state updates per second without blocking user interaction. The strategy relies on **Bypassing the Reconciliation Loop**.

### 1. The Data Ingestion Layer (SharedWorker)
Use a \`SharedWorker\` to ingest WebSocket data.
* **Why?** It survives page reloads and can share data between multiple tabs (preventing multiple socket connections per user).
* **Throttling:** The worker buffers updates and emits a "batch" every 50ms (20fps) or 16ms (60fps), decoupling network speed from render speed.

### 2. State Management: Mutable Refs vs. Immutable State
For high-frequency data, standard \`useState\` causes too many re-renders.
* **Technique:** Store live data in \`useRef\` or a mutable store (like Zustand/MobX).
* **Transient Updates:** Components subscribe only to *their* specific slice of data.

### 3. Rendering Strategy: Canvas vs. DOM
* **Data Grids:** Use DOM with strict virtualization (TanStack Virtual). CSS \`contain: strict\` to isolate layout recalculations.
* **Charts:** DOM SVG is too heavy for real-time. Use **Canvas (WebGL)**.
    * *Why:* You modify pixels, not the DOM tree. Zero layout thrashing.

\`\`\`typescript
// Concept: Transient Update Hook (Bypassing React Render Cycle)
const useLivePrice = (symbol: string, ref: RefObject<HTMLDivElement>) => {
  useEffect(() => {
    const unsub = socket.subscribe(symbol, (price) => {
      // ⚡️ DIRECT DOM MANIPULATION
      // We skip React's diffing algorithm entirely for this hot path
      if (ref.current) {
        ref.current.textContent = formatCurrency(price);
        ref.current.style.color = price > prev ? 'green' : 'red';
      }
    });
    return unsub;
  }, [symbol]);
};
\`\`\`

### 4. Isolation (Micro-Frontends / Widgets)
Wrap widgets in **Error Boundaries**. If the "Crypto Ticker" crashes due to a bad data packet, it shouldn't crash the "User Portfolio" or the Navigation bar.`,
    keyPoints: [
      "SharedWorkers for connection pooling",
      "Transient Updates (Direct DOM/Canvas manipulation)",
      "Throttling vs. Debouncing network traffic",
      "CSS Containment & Layout Thrashing",
      "BFF (Backend for Frontend) aggregation",
    ],
    followUpQuestions: [
      "How do you handle memory leaks in a Single Page App running for 8+ hours?",
      "Design a priority queue for the updates (e.g., User Portfolio > Market News).",
      "How would you debug a 'jank' issue where the browser drops frames every 3 seconds?",
    ],
    relatedTopics: ["performance", "websockets", "canvas", "react-internals"],
    source: "seed",
    commonAt: ["Coinbase", "Bloomberg", "Robinhood"],
  },
  {
    category: QUESTION_CATEGORIES.SYSTEM_DESIGN,
    difficulty: "senior",
    question:
      "Design a Server-Driven Form Builder with complex inter-field dependencies (e.g., Field B shows if Field A > 10).",
    answer: `## Architectural Strategy: The "Dependency Graph" Engine

A simple list of fields fails when logic becomes complex ("Show X if Y is true"). We must treat the form as a **Directed Acyclic Graph (DAG)**.

### 1. The Schema (Protocol)
The server sends a schema that defines *data* and *logic*, not just UI.

\`\`\`json
{
  "fields": [
    { "id": "age", "type": "number" },
    { "id": "parent_signature", "type": "signature", "hidden": true }
  ],
  "rules": [
    // The "Edge" in our graph
    { "target": "parent_signature", "effect": "show", "condition": { "field": "age", "op": "lt", "value": 18 } }
  ]
}
\`\`\`

### 2. The Evaluation Engine (Topological Sort)
We cannot just render fields linearly. We need a reactive engine.
* **Push Model:** When "Age" changes, look up its *dependents* in the graph and re-evaluate them.
* **Pull Model:** A field computes its own state by subscribing to its *dependencies*.
* **Senior Choice:** Use a reactive library (Hookstate / Signals) or a state machine (XState) to manage this graph efficiently. Rerendering the whole form on every keystroke is unacceptable (O(n)).

### 3. Component Registry
Map the schema \`type\` string to a React component.
* **Lazy Loading:** Use \`React.lazy\` for heavy fields (e.g., Rich Text Editor, Map Picker). Don't load the code unless the logic graph says the field is visible.

### 4. Performance: Subscription Architecture
Instead of one giant \`<FormContext>\` that renders everything:
\`\`\`tsx
// Each field subscribes ONLY to the data it needs
const Field = ({ id }) => {
  // Only re-renders if logic dictates visibility change
  const isVisible = useStore(state => state.visibility[id]); 
  if (!isVisible) return null;
  return <Input id={id} />;
}
\`\`\`
`,
    keyPoints: [
      "Server-Driven UI (SDUI) protocols",
      "DAG (Directed Acyclic Graph) for dependency resolution",
      "Topological Sorting",
      "Subscription-based performance (Signals/Fine-grained)",
      "Lazy loading heavy form controls",
    ],
    followUpQuestions: [
      "How do you handle circular dependencies (Field A depends on B, B depends on A)?",
      "How do you validate this form on the backend to ensure the frontend didn't bypass rules?",
      "Design a versioning system for the form schema so users on old cached JS don't break.",
    ],
    relatedTopics: [
      "state-machines",
      "graph-theory",
      "server-driven-ui",
      "optimization",
    ],
    source: "seed",
    commonAt: ["Typeform", "Shopify", "Enterprise ERPs"],
  },
];
