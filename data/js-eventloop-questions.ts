// ============================================================================
// JAVASCRIPT EVENT LOOP (CONSOLIDATED)
// ============================================================================

import { CreateQuestionInput, QUESTION_CATEGORIES } from "@/types";

export const jsEventLoopQuestions: CreateQuestionInput[] = [
  {
    category: QUESTION_CATEGORIES.JS_EVENT_LOOP,
    difficulty: "senior",
    question:
      "Explain the JavaScript Event Loop architecture in depth. Differentiate between the Macrotask and Microtask queues, explain the specific timing of the Rendering phase, and walk through a complex execution example.",
    answer: `## Event Loop Architecture

The JavaScript runtime is single-threaded, relying on the Event Loop to handle asynchronous concurrency.

### Visual Model
\`\`\`
┌─────────────────────────────────────────────────────────┐
│                       Call Stack                         │
│             (Executes synchronous Frames)               │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                      Event Loop                          │
│  1. Execute Stack (until empty)                         │
│  2. Drain Microtasks (Run ALL until queue is empty)     │
│  3. Render Phase (if needed: Style -> Layout -> Paint)  │
│  4. Execute ONE Macrotask                               │
│  5. Repeat                                              │
└─────────────────────────────────────────────────────────┘
\`\`\`

### The Critical Distinction
1.  **Microtasks (High Priority)**
    * *Sources*: \`Promise.then\`, \`queueMicrotask\`, \`MutationObserver\`, \`process.nextTick\` (Node).
    * *Behavior*: The engine processes microtasks **immediately** after the call stack empties and *before* yielding control to the browser for rendering.
    * *Risk*: If microtasks recursively queue more microtasks, the Event Loop will never reach the Render phase, causing the page to freeze (Infinite Loop).

2.  **Macrotasks (Task Queue)**
    * *Sources*: \`setTimeout\`, \`setInterval\`, \`setImmediate\`, I/O, UI Events.
    * *Behavior*: The engine processes **exactly one** macrotask per loop tick. After that one task, it checks the Microtask queue again.

### Execution Walkthrough

\`\`\`typescript
console.log('1: Sync');

// Macrotask
setTimeout(() => {
  console.log('2: Timeout');
  Promise.resolve().then(() => console.log('3: Microtask in Timeout'));
}, 0);

// Microtask
Promise.resolve()
  .then(() => {
    console.log('4: Promise 1');
    queueMicrotask(() => console.log('5: Nested Microtask'));
  })
  .then(() => console.log('6: Promise Chain'));

// Render Phase (approximate)
requestAnimationFrame(() => console.log('7: rAF'));

console.log('8: Sync End');
\`\`\`

**Output Order:**
1.  \`1: Sync\`
2.  \`8: Sync End\` (Stack clears)
3.  \`4: Promise 1\` (Microtask queue starts draining)
4.  \`5: Nested Microtask\` (Added to front of queue relative to macrotasks)
5.  \`6: Promise Chain\`
6.  \`7: rAF\` (Microtasks empty → Render Phase)
7.  \`2: Timeout\` (Next Loop Tick: Run ONE Macrotask)
8.  \`3: Microtask in Timeout\` (Checks microtasks immediately after macrotask)

### Practical Implications
* **Batching**: React (and other libraries) use microtasks to batch state updates. Multiple state changes sync, then the component re-renders once when the microtask queue empties.
* **Heavy Processing**: Do not split heavy work using \`Promise.resolve()\`. It will still block rendering. Split heavy work using \`setTimeout\` (Macrotasks) to yield control to the UI between chunks.`,
    keyPoints: [
      "Microtasks drain completely before Rendering or next Macrotask",
      "Rendering happens between Microtasks and Macrotasks",
      "Recursive microtasks block the UI; Macrotasks do not",
      "rAF runs before the Paint step of the Render phase",
    ],
    followUpQuestions: [
      "How does 'process.nextTick' in Node.js differ from 'queueMicrotask'?",
      "Why is 'requestAnimationFrame' preferred over 'setTimeout' for animations?",
      "How does the Event Loop handle Web Workers?",
    ],
    relatedTopics: ["performance", "async-programming", "browser-internals"],
    source: "seed",
    commonAt: ["Senior Frontend Roles", "Platform Engineering"],
  },
  {
    category: QUESTION_CATEGORIES.JS_EVENT_LOOP,
    difficulty: "senior",
    question:
      "Deep dive into 'async/await'. How is it executed under the hood, and precisely where do 'await' expressions pause execution in relation to the Microtask Queue?",
    answer: `## async/await Under the Hood

\`async/await\` is syntactic sugar over **Generators** yielded into **Promises**.

### The Mechanism
When the engine encounters an \`await\` keyword, it suspends the execution of the \`async\` function and effectively returns a pending Promise to the caller. The resumption of the function is scheduled as a **microtask** once the awaited value resolves.

### Transpilation Mental Model

Code written as:
\`\`\`typescript
async function fetchUser() {
  console.log('A');
  await fetch('/api');
  console.log('B');
}
\`\`\`

Is executed roughly as:
\`\`\`typescript
function fetchUser() {
  console.log('A'); // Synchronous
  
  // Await wraps value in Promise.resolve()
  return Promise.resolve(fetch('/api')).then(() => {
    // The rest of the function is the .then() callback (Microtask)
    console.log('B'); 
  });
}
\`\`\`

### Critical Nuances for Seniors

1.  **Await Costs a Tick**:
    Even if you \`await\` a non-promise value (e.g., \`await 42\`), the engine wraps it in \`Promise.resolve(42)\`. The function execution *always* suspends and resumes in a future microtask tick.

2.  **Parallelism vs. Sequential**:
    A common senior-level mistake is awaiting inside loops sequentially.
    * *Sequential (Slow)*: \`for (const id of ids) await fetch(id)\`
    * *Parallel (Fast)*: \`await Promise.all(ids.map(fetch))\`

3.  **Error Handling**:
    Because \`await\` resumes execution *within* the function scope, standard \`try/catch\` blocks work for asynchronous errors, unlike raw Promises where you need \`.catch()\`.

4.  **Top-Level Await**:
    In ES Modules, top-level await blocks the *module graph*. If Module A imports Module B, and Module B uses top-level await, Module A will not execute until Module B resolves.`,
    keyPoints: [
      "Await suspends execution and returns a pending Promise",
      "Resumption happens via the Microtask Queue",
      "Await always costs one microtask tick, even for primitives",
      "Top-level await blocks module graph execution",
    ],
    followUpQuestions: [
      "How does 'Promise.all' fail fast versus 'Promise.allSettled'?",
      "Construct a 'promisify' utility function from scratch.",
      "Explain the difference between parallel and concurrent execution.",
    ],
    relatedTopics: ["generators", "promises", "transpilation"],
    source: "seed",
    commonAt: ["Full Stack Roles", "Library Maintainers"],
  },
  {
    category: QUESTION_CATEGORIES.JS_EVENT_LOOP,
    difficulty: "mid",
    question:
      "Identify common patterns that lead to memory leaks in JavaScript SPA (Single Page Applications) and describe modern tooling strategies to detect them.",
    answer: `## Memory Leak Patterns

In garbage-collected languages, a leak occurs when objects are no longer needed but remain referenced by a "Root" (e.g., \`window\`, \`document\`, or a closure).

### 1. The 'Forgotten' References
* **Event Listeners**: Adding \`window.addEventListener\` in a component mount without removing it on unmount. The listener callback holds a reference to the component scope, preventing GC.
* **Timers**: An active \`setInterval\` keeps its callback and closure scope alive indefinitely.
* **Closures**: A variable caught in a closure scope that is referenced by a long-lived object (like a global cache) will never be collected.

### 2. Detached DOM Nodes
A subtle leak where a JS variable holds a reference to a DOM node that has been removed from the document.
\`\`\`typescript
let detachedNodes: HTMLElement[] = [];
function remove() {
  const btn = document.getElementById('btn');
  document.body.removeChild(btn!); 
  // LEAK: 'btn' is gone from screen, but referenced in 'detachedNodes'
  // The entire DOM tree starting at 'btn' is retained in memory.
  detachedNodes.push(btn!); 
}
\`\`\`

### 3. Weak References
Using standard \`Map\` or \`Set\` to associate data with DOM elements creates strong references.
* **Fix**: Use \`WeakMap\` or \`WeakSet\`. These hold "weak" references, allowing the GC to collect the entry if the object is not referenced elsewhere.

## Detection Strategies

### Chrome DevTools
1.  **Heap Snapshots (Comparison Method)**:
    * Take Snapshot 1 (Base).
    * Perform action (e.g., Open/Close Modal).
    * Take Snapshot 2 (Target).
    * *Filter*: "Objects allocated between Snapshot 1 and 2". Look for component instances that should have been destroyed.
2.  **Allocation Timeline**:
    * Visualizes memory spikes (blue bars). If the blue bars don't turn grey (GC) after the action ends, memory is being retained.
3.  **Performance Monitor**:
    * Watch **DOM Nodes** count. If it monotonically increases as you navigate the app, you have a Detached DOM leak.`,
    keyPoints: [
      "Understand Mark-and-Sweep reachability",
      "Identify Detached DOM node leaks",
      "Know when to use WeakMap/WeakRef",
      "Proficiency with Chrome Heap Snapshots",
    ],
    followUpQuestions: [
      "How does the Mark-and-Sweep algorithm determine reachability?",
      "What is the specific use case for 'FinalizationRegistry'?",
    ],
    relatedTopics: ["garbage-collection", "profiling", "web-performance"],
    source: "seed",
    commonAt: ["Performance Optimization Roles", "Large Scale SPAs"],
  },
];
