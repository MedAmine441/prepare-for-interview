// data/seed-data-part3.ts

import type { CreateQuestionInput } from "@/types";
import { QUESTION_CATEGORIES } from "@/types";

// ============================================================================
// REACT INTERNALS (Refactored: Senior Architectural Level)
// ============================================================================

export const reactInternalsQuestions: CreateQuestionInput[] = [
  {
    category: QUESTION_CATEGORIES.REACT_INTERNALS,
    difficulty: "senior",
    question:
      "Deep dive into the React Reconciliation Engine (Fiber). How do the Data Structure, Scheduler, and Diffing Heuristics work together to enable Concurrent React?",
    answer: `## The Architecture: Fiber & Double Buffering
React's core is a mutable data structure called the **Fiber Node**. Unlike the immutable VDOM elements, Fiber nodes hold state, side-effects, and pointers to the DOM.

**1. The Data Structure (Singly Linked List)**
React enables "pausing" work by abandoning the recursive call stack in favor of a heap-based traversal. Each Fiber node points to:
- \`child\`: The first direct descendant.
- \`sibling\`: The next node at the same level.
- \`return\`: The parent node.
This allows the work loop to traverse deep, pause, and resume by holding a reference to the current Fiber node.

**2. Double Buffering (Current vs. WorkInProgress)**
React maintains two trees:
- **Current Tree**: Represents what is currently on screen.
- **WorkInProgress (WIP) Tree**: The tree currently being built in memory.
*Mechanism:* During a render, React clones the \`current\` node to \`WIP\`. Reconciliation happens on \`WIP\`. On commit, the pointers swap. This prevents the user from seeing partial UI updates (tearing).

## The Scheduler: Lanes & Time Slicing
React 18+ replaced \`expirationTime\` with **Lanes** (a 31-bit bitmask).
- **Prioritization:** Updates are assigned bits (e.g., \`SyncLane\`, \`InputContinuousLane\`, \`DefaultLane\`).
- **Yielding:** The work loop checks the frame budget (typically 5ms via \`MessageChannel\` implementation, not \`requestIdleCallback\`). If the budget is exceeded, it yields control to the browser's main thread, allowing painting or input handling.
- **Interruption:** A higher priority event (click) can interrupt a lower priority render (data fetch). The low priority \`WIP\` tree is discarded, and work restarts for the high priority update.

## The Diffing Heuristics (O(n) Complexity)
To avoid the O(n³) cost of standard tree comparison, React relies on strict assumptions:
1.  **Type Check:** Different element types (e.g., \`<div>\` vs \`<span>\`) tear down the entire subtree and rebuild (state is lost).
2.  **Key Check:** Keys allow React to match \`current\` and \`WIP\` nodes across different positions in a list. Without keys, React defaults to mutating children index-by-index, which devastates performance and input state.

## Senior Pattern: Optimization
- **Bailout:** If \`oldProps === newProps\` (and context/state haven't changed), React skips the entire subtree (reference equality check).
- **Effect List:** Instead of traversing the whole tree during Commit, React builds a linear linked list of only the nodes with "flags" (Update, Placement, Deletion), making the Commit phase extremely fast.`,
    keyPoints: [
      "Fiber is a heap-based linked list allowing interruptible traversal.",
      "Double buffering uses 'current' and 'WIP' trees to ensure atomic commits.",
      "Lanes (bitmasks) determine priority; high priority interrupts low priority.",
      "Diffing heuristic: Type change = teardown; Key = stability across moves.",
      "Commit phase only processes the 'Effect List', not the full tree.",
    ],
    followUpQuestions: [
      "How does 'useTransition' interact with the Lanes model?",
      "Why is index as a key strictly an anti-pattern for dynamic lists?",
      "Explain the 'Tearing' problem in UI and how SyncExternalStore solves it.",
    ],
    relatedTopics: ["performance", "event-loop", "memory-management"],
    source: "seed",
    commonAt: ["Meta", "Uber", "Airbnb"],
  },
  {
    category: QUESTION_CATEGORIES.REACT_INTERNALS,
    difficulty: "senior",
    question:
      "Explain the internal implementation of React Hooks. How are they stored, and why do they rely on call order? Address the 'Stale Closure' problem architecturally.",
    answer: `## Internal Storage: The Linked List
Hooks are not magic; they are nodes in a linked list attached to the Fiber.
\`\`\`typescript
type Hook = {
  memoizedState: any; // The state value or effect deps
  queue: UpdateQueue; // Pending updates
  next: Hook | null;  // Pointer to the next hook
};
\`\`\`
When a component renders, the Fiber's \`memoizedState\` points to the first Hook. Calling \`useState\` moves the pointer to \`hook.next\`. This is why conditional hooks break React: if the call order changes, the \`next\` pointer retrieves state from the wrong hook.

## The Dispatcher Swap
React swaps the dispatcher implementation depending on the lifecycle:
- **Mount:** Uses \`HooksDispatcherOnMount\`. Initializes the linked list and sets initial state.
- **Update:** Uses \`HooksDispatcherOnUpdate\`. Traverses the existing linked list, cloning hooks to the WIP fiber and processing the update queue.

## Architectural Bottleneck: Stale Closures
Hooks rely heavily on JavaScript closures.
* **The Problem:** A \`useEffect\` or callback creates a closure over the scope of *that specific render*. If dependencies are omitted from the dependency array, the closure captures variables from an old render frame.
* **The Consequence:** The function executes with outdated data, even if the component has re-rendered.
* **Solution:** \`useRef\` can "punch through" closures because it provides a stable mutable object reference, unlike primitive values which are captured by value.

## Batching Mechanics (React 18)
- **Automatic Batching:** React wraps event handlers and promises in a context. Updates queued within the same "tick" (microtask) do not trigger re-renders. They are flushed in a single pass at the end of the event loop tick.
- **Opt-out:** \`flushSync\` forces an immediate synchronous flush of the queue, breaking batching (rarely needed).`,
    keyPoints: [
      "Hooks are a linked list stored on the Fiber node.",
      "Call order is strict because it serves as the index for the linked list traversal.",
      "React swaps dispatchers (Mount vs Update) at runtime.",
      "Stale closures occur when a function captures the scope of a dead render frame.",
      "Automatic batching groups updates in the same microtask to minimize renders.",
    ],
    followUpQuestions: [
      "How does 'useLayoutEffect' differ from 'useEffect' regarding the paint cycle?",
      "Why must refs be used for mutable variables that don't trigger re-renders?",
      "How would you debug a 'Render loop' caused by unstable dependency arrays?",
    ],
    relatedTopics: ["javascript-closures", "memory-leaks", "react-hooks"],
    source: "seed",
    commonAt: ["Netflix", "Vercel", "Atlassian"],
  },
  {
    category: QUESTION_CATEGORIES.REACT_INTERNALS,
    difficulty: "senior",
    question:
      "Analyze the React Server Components (RSC) architecture. Explain the 'Flight' serialization protocol, the 'Client Boundary', and the trade-offs regarding the Waterfall problem.",
    answer: `## The Architecture: Server-First Execution
RSC decouples the **rendering environment** from the **interaction environment**.
1.  **Server Phase:** React renders the component tree on the server.
2.  **Serialization:** The result is streamed to the client, not as HTML, but as a specialized row-based JSON format (Flight Protocol).
3.  **Client Phase:** The browser reconciles this serialized tree into the existing DOM without destroying client state (unlike a full HTML refresh).

## The Flight Protocol & Serialization
The protocol handles data that JSON cannot:
- **Server Components:** Serialized as "holes" or references.
- **Client Components:** Serialized as "module references" (bundler ID + filename).
- **Suspense:** Serialized as lazy placeholders, allowing the stream to reorder chunks as data resolves.
*Constraint:* Props passed from Server to Client must be serializable. You cannot pass Functions or Classes across the boundary because execution scopes cannot be serialized.

## Architectural Trade-offs

### 1. The Waterfall Problem (Latency)
Since Server Components render sequentially, a parent awaiting data blocks the child from rendering.
- *Risk:* \`await db.user()\` -> \`await db.posts()\` creates a sequential waterfall on the server.
- *Mitigation:* Pattern shift to "Preload" pattern or \`Promise.all\`, or pushing data fetching down to parallel leaf nodes.

### 2. Bundle Size vs. CPU
- **Pro:** Large libraries (date formatters, markdown parsers) remain on the server (0kb bundle cost).
- **Con:** Client components (interactive parts) are strictly separated. Moving state *up* often forces the conversion of server components to client components, negating the benefits (the "Client Component Creep").

### 3. Hydration Mismatch
RSC payloads and SSR HTML are distinct. SSR provides the "First Contentful Paint" (HTML). RSC provides the "Interactive Tree" (Data). If the server renders a Date based on server time, and the client hydrates with browser time, hydration errors occur because the initial HTML doesn't match the hydrated VDOM.`,
    keyPoints: [
      "RSC uses the 'Flight' protocol to stream a serialized component tree.",
      "Client Components act as boundaries; props crossing them must be serializable.",
      "RSC eliminates bundle size for server-only dependencies.",
      "Server-side Waterfalls are a major architectural risk in RSC.",
      "RSC is orthogonal to SSR; SSR is for initial HTML, RSC is for tree transport.",
    ],
    followUpQuestions: [
      "How does RSC integration differ from standard API calls (REST/GraphQL)?",
      "Explain how 'use client' acts as a bundler instruction, not just a React hook.",
      "How does Streaming SSR work in conjunction with RSC?",
    ],
    relatedTopics: ["nextjs", "distributed-systems", "serialization"],
    source: "seed",
    commonAt: ["Vercel", "Shopify", "New York Times"],
  },
];
