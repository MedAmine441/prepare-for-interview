// data/seed-data-part3.ts

import type { CreateQuestionInput } from '@/types';
import { QUESTION_CATEGORIES } from '@/types';

// ============================================================================
// REACT INTERNALS
// ============================================================================

const reactInternalsQuestions: CreateQuestionInput[] = [
  {
    category: QUESTION_CATEGORIES.REACT_INTERNALS,
    difficulty: 'senior',
    question:
      'Explain React\'s Fiber architecture. What problem does it solve, and how does it enable concurrent features like Suspense and transitions?',
    answer: `## Why Fiber Was Created

Before Fiber (React 15 and earlier), React's reconciliation was **synchronous and recursive**. Once started, it couldn't be interrupted.

\`\`\`
Old Stack Reconciler:
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Component Tree Reconciliation                          â”‚
â”‚  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•       â”‚
â”‚  A â†’ B â†’ C â†’ D â†’ E â†’ F â†’ G â†’ ... (no interruption)     â”‚
â”‚  â”‚                                    â”‚                 â”‚
â”‚  Start                               End                â”‚
â”‚                                                         â”‚
â”‚  Problem: 100ms+ of work = 100ms of blocked main threadâ”‚
â”‚           = janky UI, dropped frames                    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜

Fiber Architecture:
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Work Units (Fibers)                                    â”‚
â”‚  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•       â”‚
â”‚  A â†’ B â†’ C â†’ [PAUSE] â†’ D â†’ E â†’ [PAUSE] â†’ F â†’ G         â”‚
â”‚              â†“                 â†“                        â”‚
â”‚         Handle event      Handle animation              â”‚
â”‚                                                         â”‚
â”‚  Solution: Split work into units, yield to browser      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
\`\`\`

## What is a Fiber?

A Fiber is a **JavaScript object** that represents a unit of work. Each React element has a corresponding Fiber.

\`\`\`typescript
// Simplified Fiber structure
interface Fiber {
  // Instance
  tag: WorkTag;           // FunctionComponent, ClassComponent, HostComponent, etc.
  type: any;              // Component function/class or DOM tag name
  stateNode: any;         // DOM node or class instance
  
  // Fiber Tree Structure
  return: Fiber | null;   // Parent fiber
  child: Fiber | null;    // First child fiber
  sibling: Fiber | null;  // Next sibling fiber
  
  // Props and State
  pendingProps: any;      // New props
  memoizedProps: any;     // Props used in last render
  memoizedState: any;     // State used in last render
  
  // Effects
  flags: Flags;           // Side effects to perform (Placement, Update, Deletion)
  subtreeFlags: Flags;    // Effects in subtree
  
  // Lanes (Priority)
  lanes: Lanes;           // Work priority
  childLanes: Lanes;      // Priority of work in children
  
  // Alternate
  alternate: Fiber | null; // Work-in-progress or current fiber
}
\`\`\`

## Double Buffering: Current vs Work-in-Progress

\`\`\`
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”         â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚   Current Tree      â”‚         â”‚   Work-in-Progress  â”‚
â”‚   (on screen)       â”‚â—„â”€â”€â”€â”€â”€â”€â”€â–ºâ”‚   Tree (building)   â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤         â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚   Fiber A           â”‚         â”‚   Fiber A'          â”‚
â”‚     â”œâ”€â”€ Fiber B     â”‚         â”‚     â”œâ”€â”€ Fiber B'    â”‚
â”‚     â””â”€â”€ Fiber C     â”‚         â”‚     â””â”€â”€ Fiber C'    â”‚
â”‚          â””â”€â”€ Fiber Dâ”‚         â”‚          â””â”€â”€ Fiber D'â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜         â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
         â”‚                               â”‚
         â”‚    After commit, trees swap   â”‚
         â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
\`\`\`

- **Current**: What's currently rendered on screen
- **Work-in-Progress (WIP)**: Being built during reconciliation
- After commit, WIP becomes current (pointer swap)

## Two Phases: Render and Commit

\`\`\`
RENDER PHASE (Interruptible)
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
â€¢ Build work-in-progress tree
â€¢ Determine what changed
â€¢ Calculate side effects
â€¢ Can be paused, aborted, restarted

                         â†“

COMMIT PHASE (Synchronous, Uninterruptible)
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
â€¢ Apply DOM changes
â€¢ Run useLayoutEffect
â€¢ Run useEffect (scheduled)
â€¢ Must complete - can't pause
\`\`\`

## How Fiber Enables Concurrency

### Time Slicing

\`\`\`typescript
// Simplified scheduler loop
function workLoop(deadline: IdleDeadline) {
  while (workInProgress !== null && deadline.timeRemaining() > 0) {
    // Process one fiber unit
    workInProgress = performUnitOfWork(workInProgress);
  }
  
  if (workInProgress !== null) {
    // More work to do, schedule continuation
    requestIdleCallback(workLoop);
  }
}

function performUnitOfWork(fiber: Fiber): Fiber | null {
  // 1. Begin work on this fiber (call component, diff)
  const next = beginWork(fiber);
  
  if (next) {
    // Has child - process child next
    return next;
  }
  
  // 2. Complete work (finalize effects)
  return completeUnitOfWork(fiber);
}
\`\`\`

### Priority Lanes

\`\`\`typescript
// Different priorities for different updates
const SyncLane = 0b0000000000000000000000000000001;        // Highest (user input)
const InputContinuousLane = 0b0000000000000000000000000100; // Drag, scroll
const DefaultLane = 0b0000000000000000000000000010000;      // Normal updates
const TransitionLane = 0b0000000000000000000001000000;      // startTransition
const IdleLane = 0b0100000000000000000000000000000;         // Lowest (offscreen)

// Higher priority work can interrupt lower priority
function ensureRootIsScheduled(root: FiberRoot) {
  const nextLanes = getNextLanes(root);
  
  if (nextLanes === NoLanes) {
    return; // No work to do
  }
  
  const existingCallbackPriority = root.callbackPriority;
  const newCallbackPriority = getHighestPriorityLane(nextLanes);
  
  if (newCallbackPriority > existingCallbackPriority) {
    // Cancel lower priority work, start higher priority
    cancelCallback(root.callbackNode);
  }
  
  // Schedule work at appropriate priority
  root.callbackNode = scheduleCallback(
    lanesToSchedulerPriority(newCallbackPriority),
    performConcurrentWorkOnRoot.bind(null, root)
  );
}
\`\`\`

## Suspense and Fiber

\`\`\`typescript
// When a component suspends:
function ComponentThatSuspends() {
  const data = use(fetchData()); // Throws a Promise
  return <div>{data}</div>;
}

// Fiber catches the promise:
function renderWithHooks(fiber: Fiber) {
  try {
    const children = Component(props);
    return children;
  } catch (thrownValue) {
    if (typeof thrownValue.then === 'function') {
      // It's a promise - this is Suspense!
      
      // 1. Mark this fiber as suspended
      fiber.flags |= DidCapture;
      
      // 2. Find nearest Suspense boundary
      const suspenseBoundary = findSuspenseBoundary(fiber);
      
      // 3. Render fallback instead
      suspenseBoundary.memoizedState = {
        dehydrated: null,
        retryLane: DefaultLane,
      };
      
      // 4. When promise resolves, retry
      thrownValue.then(
        () => scheduleRetry(suspenseBoundary),
        () => scheduleRetry(suspenseBoundary)
      );
    } else {
      throw thrownValue; // Regular error
    }
  }
}
\`\`\`

## useTransition Implementation

\`\`\`typescript
function useTransition(): [boolean, (callback: () => void) => void] {
  const [isPending, setIsPending] = useState(false);
  
  const startTransition = useCallback((callback: () => void) => {
    setIsPending(true);
    
    // Schedule the transition update at TransitionLane priority
    const prevTransition = ReactCurrentBatchConfig.transition;
    ReactCurrentBatchConfig.transition = {};
    
    try {
      // Updates inside callback get TransitionLane priority
      callback();
    } finally {
      ReactCurrentBatchConfig.transition = prevTransition;
    }
    
    // isPending stays true until transition completes
  }, []);
  
  return [isPending, startTransition];
}

// Usage
const [isPending, startTransition] = useTransition();

function handleSearch(query: string) {
  // High priority - update input immediately
  setQuery(query);
  
  // Low priority - can be interrupted
  startTransition(() => {
    setSearchResults(search(query));
  });
}
\`\`\`

## Key Fiber Benefits

| Feature | How Fiber Enables It |
|---------|---------------------|
| Concurrent Rendering | Work can be paused/resumed |
| Suspense | Can suspend and show fallback |
| Transitions | Different priority lanes |
| Time Slicing | Yield to browser between units |
| Error Boundaries | Catch errors in render phase |
| Streaming SSR | Incremental hydration |`,
    keyPoints: [
      'Understands why Fiber was created (blocking reconciliation)',
      'Knows Fiber node structure',
      'Can explain double buffering (current vs WIP)',
      'Understands render vs commit phases',
      'Knows how priority lanes work',
      'Can explain how Suspense leverages Fiber',
    ],
    followUpQuestions: [
      'How does error boundary work with Fiber?',
      'What triggers a re-render in Fiber?',
      'How does React know when to yield to the browser?',
      'What\'s the difference between concurrent and synchronous mode?',
    ],
    relatedTopics: ['reconciliation', 'virtual-dom', 'concurrent-react', 'suspense'],
    source: 'seed',
    commonAt: ['Meta', 'Companies using React heavily'],
  },
  {
    category: QUESTION_CATEGORIES.REACT_INTERNALS,
    difficulty: 'senior',
    question:
      'How does React\'s reconciliation algorithm work? Explain the diffing heuristics and how the key prop optimizes list updates.',
    answer: `## Reconciliation Overview

Reconciliation is the process of comparing the new element tree with the previous one to determine what DOM changes are needed.

\`\`\`
New JSX Tree          Previous Fiber Tree          DOM Updates
    â”‚                        â”‚                         â”‚
    â””â”€â”€â”€â”€â”€â”€â–º Reconciler â—„â”€â”€â”€â”€â”˜                         â”‚
                 â”‚                                     â”‚
                 â””â”€â–º Determines minimum changes â”€â”€â”€â”€â”€â”€â”€â”˜
\`\`\`

## Two Key Heuristics

React's diffing algorithm is O(n) instead of O(nÂ³) due to two heuristics:

### 1. Different Types Produce Different Trees

\`\`\`tsx
// When root element type changes, entire tree is replaced

// Before
<div>
  <Counter />
</div>

// After
<span>
  <Counter />
</span>

// Result: Old <div> destroyed, new <span> created
// Counter state is LOST - it's a new instance
\`\`\`

### 2. Keys Identify Elements Across Renders

\`\`\`tsx
// Without keys, React uses index-based matching
// Before: [A, B, C]
// After:  [X, A, B, C]

// React sees:
// index 0: A â†’ X (update A to X)
// index 1: B â†’ A (update B to A)
// index 2: C â†’ B (update C to B)
// index 3: null â†’ C (create C)
// Result: Updates everything! Inefficient.

// With keys:
// Before: [A:1, B:2, C:3]
// After:  [X:0, A:1, B:2, C:3]

// React sees:
// key 1: A â†’ A (no change)
// key 2: B â†’ B (no change)
// key 3: C â†’ C (no change)
// key 0: null â†’ X (create X, insert at start)
// Result: Only creates X! Efficient.
\`\`\`

## Reconciliation Process

\`\`\`typescript
function reconcileChildren(
  returnFiber: Fiber,
  currentChild: Fiber | null,
  newChild: any
) {
  // Single element
  if (typeof newChild === 'object' && newChild !== null) {
    return reconcileSingleElement(returnFiber, currentChild, newChild);
  }
  
  // Array of elements
  if (Array.isArray(newChild)) {
    return reconcileChildrenArray(returnFiber, currentChild, newChild);
  }
  
  // Text content
  if (typeof newChild === 'string' || typeof newChild === 'number') {
    return reconcileSingleTextNode(returnFiber, currentChild, '' + newChild);
  }
  
  // Delete remaining children
  return deleteRemainingChildren(returnFiber, currentChild);
}
\`\`\`

### Single Element Reconciliation

\`\`\`typescript
function reconcileSingleElement(
  returnFiber: Fiber,
  currentChild: Fiber | null,
  element: ReactElement
) {
  const key = element.key;
  let child = currentChild;
  
  while (child !== null) {
    if (child.key === key) {
      // Key matches
      if (child.type === element.type) {
        // Same type - REUSE this fiber
        deleteRemainingChildren(returnFiber, child.sibling);
        const existing = useFiber(child, element.props);
        existing.return = returnFiber;
        return existing;
      } else {
        // Different type - delete all
        deleteRemainingChildren(returnFiber, child);
        break;
      }
    } else {
      // Key doesn't match - delete this child
      deleteChild(returnFiber, child);
    }
    child = child.sibling;
  }
  
  // No reusable fiber found - create new
  const created = createFiberFromElement(element);
  created.return = returnFiber;
  return created;
}
\`\`\`

### Array Reconciliation (List Diffing)

\`\`\`typescript
function reconcileChildrenArray(
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  newChildren: Array<any>
) {
  let resultingFirstChild: Fiber | null = null;
  let previousNewFiber: Fiber | null = null;
  let oldFiber = currentFirstChild;
  let newIdx = 0;
  
  // PHASE 1: Walk both lists, looking for matches by key
  for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
    const newChild = newChildren[newIdx];
    
    if (oldFiber.key !== getKey(newChild)) {
      // Keys don't match - break and use map-based lookup
      break;
    }
    
    // Keys match - update or reuse fiber
    const newFiber = updateSlot(returnFiber, oldFiber, newChild);
    // ... link fiber into result list
    
    oldFiber = oldFiber.sibling;
  }
  
  // PHASE 2: If new children exhausted, delete remaining old
  if (newIdx === newChildren.length) {
    deleteRemainingChildren(returnFiber, oldFiber);
    return resultingFirstChild;
  }
  
  // PHASE 3: If old children exhausted, create remaining new
  if (oldFiber === null) {
    for (; newIdx < newChildren.length; newIdx++) {
      const newFiber = createChild(returnFiber, newChildren[newIdx]);
      // ... link fiber into result list
    }
    return resultingFirstChild;
  }
  
  // PHASE 4: Both have remaining - use Map for O(1) lookup
  const existingChildren = mapRemainingChildren(oldFiber);
  
  for (; newIdx < newChildren.length; newIdx++) {
    const newChild = newChildren[newIdx];
    const key = getKey(newChild);
    const matchedFiber = existingChildren.get(key);
    
    if (matchedFiber) {
      // Found match - reuse fiber
      const newFiber = updateFromMap(returnFiber, matchedFiber, newChild);
      existingChildren.delete(key);
      // ... link fiber
    } else {
      // No match - create new fiber
      const newFiber = createChild(returnFiber, newChild);
      // ... link fiber
    }
  }
  
  // Delete any remaining unmatched old children
  existingChildren.forEach(child => deleteChild(returnFiber, child));
  
  return resultingFirstChild;
}
\`\`\`

## Key Prop Deep Dive

### Why Index Keys Are Bad

\`\`\`tsx
// âŒ Using index as key
{items.map((item, index) => (
  <ListItem key={index} item={item} />
))}

// Scenario: Delete first item from [A, B, C]
// Before: key=0:A, key=1:B, key=2:C
// After:  key=0:B, key=1:C

// React sees:
// - key=0: A â†’ B (update item A to B) ðŸ˜± WRONG!
// - key=1: B â†’ C (update item B to C) ðŸ˜± WRONG!
// - key=2: deleted

// Problems:
// 1. Unnecessary re-renders (all items update)
// 2. State gets mixed up (form inputs, animations)
// 3. Effects fire incorrectly
\`\`\`

### Correct Key Usage

\`\`\`tsx
// âœ… Using stable unique ID
{items.map(item => (
  <ListItem key={item.id} item={item} />
))}

// Same scenario: Delete first item from [A, B, C]
// Before: key=a:A, key=b:B, key=c:C
// After:  key=b:B, key=c:C

// React sees:
// - key=a: deleted âœ“
// - key=b: B â†’ B (no change) âœ“
// - key=c: C â†’ C (no change) âœ“

// Only the deleted item is removed!
\`\`\`

### Key Rules

\`\`\`tsx
// 1. Keys must be STABLE (same across renders)
// âŒ Bad
<Item key={Math.random()} /> // New key every render!

// 2. Keys must be UNIQUE among siblings
// âŒ Bad
{items.map(item => <Item key="same" item={item} />)}

// 3. Keys don't need to be globally unique
// âœ… OK - different lists can have same keys
<ul>{listA.map(i => <li key={i.id}>{i.name}</li>)}</ul>
<ul>{listB.map(i => <li key={i.id}>{i.name}</li>)}</ul>

// 4. Index is OK when:
// - List is static (never reorders)
// - Items have no state/uncontrolled inputs
// - Items are never reordered, inserted, or deleted
{staticList.map((item, i) => <StatelessItem key={i} text={item} />)}
\`\`\`

## Component Identity and State

\`\`\`tsx
// Key determines component identity
function Parent({ showA }) {
  return showA 
    ? <Child key="a" />  // Instance A
    : <Child key="b" />; // Instance B (different key = different instance)
}

// Without key, same position = same instance
function Parent({ showA }) {
  return showA 
    ? <Child />  // Position 0
    : <Child />; // Position 0 - SAME instance, state preserved!
}

// Force reset with key
function Editor({ documentId }) {
  // When documentId changes, key changes, Editor resets
  return <DocumentEditor key={documentId} />;
}
\`\`\``,
    keyPoints: [
      'Understands O(n) heuristics',
      'Knows type comparison rules',
      'Can explain array reconciliation phases',
      'Understands why index keys are problematic',
      'Knows key affects component identity',
      'Can use key to reset component state',
    ],
    followUpQuestions: [
      'How does React handle adding/removing items in the middle of a list?',
      'What about reconciliation with fragments?',
      'How does Suspense affect reconciliation?',
      'Can you force a component to remount without changing key?',
    ],
    relatedTopics: ['fiber', 'virtual-dom', 'performance', 'keys'],
    source: 'seed',
    commonAt: ['Meta', 'Any React-heavy company'],
  },
  {
    category: QUESTION_CATEGORIES.REACT_INTERNALS,
    difficulty: 'mid',
    question:
      'How do React hooks work internally? Why can\'t hooks be called conditionally, and how does React track hook state between renders?',
    answer: `## Hook Storage: The Fiber\'s Hook List

Each fiber has a linked list of hooks. React uses the **call order** to match hooks between renders.

\`\`\`typescript
// Fiber's memoizedState points to first hook
interface Fiber {
  memoizedState: Hook | null; // First hook in the list
  // ...
}

interface Hook {
  memoizedState: any;        // Hook's state (useState value, useRef.current, etc.)
  baseState: any;            // For reducers
  baseQueue: Update | null;  // Pending updates
  queue: UpdateQueue | null; // Update queue
  next: Hook | null;         // Next hook in list
}
\`\`\`

\`\`\`
Component renders:
useState(0)     â†’ Hook 1 { memoizedState: 0, next: â†’ }
useEffect(...)  â†’ Hook 2 { memoizedState: effect, next: â†’ }
useMemo(...)    â†’ Hook 3 { memoizedState: [value, deps], next: â†’ }
useState('')    â†’ Hook 4 { memoizedState: '', next: null }

Fiber.memoizedState â†’ [Hook 1] â†’ [Hook 2] â†’ [Hook 3] â†’ [Hook 4]
\`\`\`

## Why Call Order Matters

\`\`\`typescript
// React tracks hooks by INDEX (position), not by name

// First render:
function Component() {
  const [a, setA] = useState(1);  // Hook 0: { memoizedState: 1 }
  const [b, setB] = useState(2);  // Hook 1: { memoizedState: 2 }
  return <div>{a} {b}</div>;
}

// Second render (after setA(10)):
function Component() {
  const [a, setA] = useState(1);  // Reads Hook 0 â†’ gets 10 âœ“
  const [b, setB] = useState(2);  // Reads Hook 1 â†’ gets 2 âœ“
  return <div>{a} {b}</div>;
}
\`\`\`

### What Happens With Conditional Hooks

\`\`\`typescript
// âŒ Broken: Conditional hook
function Component({ showExtra }) {
  const [a, setA] = useState(1);   // Hook 0
  
  if (showExtra) {
    const [extra, setExtra] = useState('x'); // Hook 1 (sometimes)
  }
  
  const [b, setB] = useState(2);   // Hook 1 or 2?
}

// First render (showExtra = true):
// Hook 0: a = 1
// Hook 1: extra = 'x'
// Hook 2: b = 2

// Second render (showExtra = false):
// Hook 0: a = 1       âœ“
// Hook 1: b reads from 'extra' position â†’ b = 'x' ðŸ’¥ WRONG!
// Hook 2: ??? â†’ Error: more hooks than expected
\`\`\`

## Internal Implementation

\`\`\`typescript
// Simplified hook dispatcher
let currentlyRenderingFiber: Fiber | null = null;
let workInProgressHook: Hook | null = null;

function renderWithHooks(fiber: Fiber, Component: Function, props: any) {
  currentlyRenderingFiber = fiber;
  
  // Reset hook pointer
  workInProgressHook = fiber.memoizedState; // Start of hook list
  
  // Call component - this calls hooks
  const children = Component(props);
  
  currentlyRenderingFiber = null;
  return children;
}

// useState implementation
function useState<T>(initialState: T): [T, Dispatch<T>] {
  return useReducer(
    (state: T, action: T | ((prev: T) => T)) => 
      typeof action === 'function' ? (action as Function)(state) : action,
    initialState
  );
}

function useReducer<S, A>(reducer: Reducer<S, A>, initialState: S): [S, Dispatch<A>] {
  const hook = updateWorkInProgressHook();
  
  if (isMount) {
    // First render - initialize
    hook.memoizedState = initialState;
    hook.queue = createUpdateQueue();
  } else {
    // Update - process queued updates
    const queue = hook.queue;
    let newState = hook.memoizedState;
    
    const pending = queue.pending;
    if (pending !== null) {
      let update = pending.next;
      do {
        newState = reducer(newState, update.action);
        update = update.next;
      } while (update !== pending.next);
      
      queue.pending = null;
    }
    
    hook.memoizedState = newState;
  }
  
  const dispatch = (action: A) => {
    const update = { action, next: null };
    enqueueUpdate(hook.queue, update);
    scheduleUpdateOnFiber(currentlyRenderingFiber);
  };
  
  return [hook.memoizedState, dispatch];
}

function updateWorkInProgressHook(): Hook {
  let hook: Hook;
  
  if (workInProgressHook === null) {
    // First hook in this render
    const current = currentlyRenderingFiber.alternate;
    if (current !== null) {
      // Update: clone from current
      hook = cloneHook(current.memoizedState);
    } else {
      // Mount: create new
      hook = createHook();
    }
    currentlyRenderingFiber.memoizedState = hook;
  } else {
    // Subsequent hook
    const current = currentlyRenderingFiber.alternate;
    if (current !== null) {
      hook = cloneHook(workInProgressHook.next);
    } else {
      hook = createHook();
    }
    workInProgressHook.next = hook;
  }
  
  workInProgressHook = hook;
  return hook;
}
\`\`\`

## useEffect Implementation

\`\`\`typescript
function useEffect(create: () => (() => void) | void, deps?: DependencyList) {
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  
  if (currentlyRenderingFiber.alternate !== null) {
    const prevEffect = hook.memoizedState;
    const prevDeps = prevEffect.deps;
    
    if (areHookInputsEqual(nextDeps, prevDeps)) {
      // Dependencies unchanged - push passive effect without HasEffect flag
      hook.memoizedState = pushEffect(PassiveStatic, create, destroy, nextDeps);
      return;
    }
  }
  
  // Dependencies changed or first mount
  currentlyRenderingFiber.flags |= PassiveEffect;
  hook.memoizedState = pushEffect(
    HookHasEffect | PassiveStatic,
    create,
    undefined,
    nextDeps
  );
}

function areHookInputsEqual(
  nextDeps: DependencyList | null,
  prevDeps: DependencyList | null
): boolean {
  if (prevDeps === null) return false;
  
  for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
    if (Object.is(nextDeps[i], prevDeps[i])) {
      continue;
    }
    return false;
  }
  return true;
}
\`\`\`

## Rules of Hooks Explained

\`\`\`typescript
// Rule 1: Only call at top level
// WHY: Preserves call order for hook matching

// âŒ Inside condition
if (condition) {
  useState(); // Order changes between renders
}

// âŒ Inside loop
for (let i = 0; i < count; i++) {
  useState(); // Number of hooks changes
}

// âŒ Inside nested function
const handler = () => {
  useState(); // Called after render, no fiber context
};

// Rule 2: Only call from React functions
// WHY: Hooks need fiber context (currentlyRenderingFiber)

// âŒ Regular function
function helper() {
  const [state] = useState(); // No fiber!
}

// âœ… React component
function Component() {
  const [state] = useState(); // Fiber exists
}

// âœ… Custom hook (will be called from component)
function useCustom() {
  const [state] = useState(); // Fiber exists via call stack
}
\`\`\`

## Hook Types Reference

| Hook | memoizedState stores |
|------|---------------------|
| useState | Current state value |
| useReducer | Current state value |
| useRef | { current: value } object |
| useMemo | [cachedValue, deps] |
| useCallback | [cachedFn, deps] |
| useEffect | Effect object with create/destroy |
| useContext | (reads from context, no memoizedState) |`,
    keyPoints: [
      'Knows hooks are stored as linked list',
      'Understands call order matching',
      'Can explain why conditional hooks break',
      'Knows useState is implemented with useReducer',
      'Understands dependency comparison',
      'Knows what each hook stores in memoizedState',
    ],
    followUpQuestions: [
      'How does useContext differ from other hooks?',
      'Why does useState use Object.is for comparison?',
      'How do custom hooks share state?',
      'What about hooks in concurrent mode?',
    ],
    relatedTopics: ['hooks', 'fiber', 'state-management', 'closures'],
    source: 'seed',
    commonAt: ['Meta', 'Any React company'],
  },
  {
    category: QUESTION_CATEGORIES.REACT_INTERNALS,
    difficulty: 'mid',
    question:
      'Explain React Server Components (RSC). What problems do they solve, and how do they differ from traditional SSR?',
    answer: `## Traditional SSR vs RSC

### Traditional SSR

\`\`\`
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Server                                                         â”‚
â”‚  â•â•â•â•â•â•â•                                                        â”‚
â”‚  1. Render to HTML string                                       â”‚
â”‚  2. Send HTML + ALL JS bundles                                  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                              â”‚
                              â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Client                                                         â”‚
â”‚  â•â•â•â•â•â•â•                                                        â”‚
â”‚  1. Display HTML (fast FCP)                                     â”‚
â”‚  2. Download JS bundle (includes ALL components)                â”‚
â”‚  3. Hydrate: Re-run ALL components, attach event listeners      â”‚
â”‚                                                                 â”‚
â”‚  Problem: Must re-execute everything client-side                â”‚
â”‚           Large bundle includes server-only code                â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
\`\`\`

### React Server Components

\`\`\`
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Server                                                         â”‚
â”‚  â•â•â•â•â•â•â•                                                        â”‚
â”‚  1. Render Server Components â†’ RSC Payload (serialized tree)    â”‚
â”‚  2. Send RSC Payload + ONLY Client Component JS                 â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                              â”‚
                              â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Client                                                         â”‚
â”‚  â•â•â•â•â•â•â•                                                        â”‚
â”‚  1. Display rendered content                                    â”‚
â”‚  2. Download ONLY client component JS                           â”‚
â”‚  3. Hydrate ONLY client components                              â”‚
â”‚                                                                 â”‚
â”‚  Benefit: Server-only code stays on server                      â”‚
â”‚           Smaller bundles, less hydration work                  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
\`\`\`

## RSC vs SSR Key Differences

| Aspect | Traditional SSR | React Server Components |
|--------|-----------------|------------------------|
| Rendering | Server renders HTML | Server renders RSC payload |
| Bundle | All components sent | Only client components |
| Hydration | Re-execute all | Only client components |
| Server code | Bundled & sent | Stays on server |
| Data fetching | useEffect or getServerSideProps | Direct in component |
| Updates | Full page or SPA navigation | Stream new RSC payload |

## Server Component Capabilities

\`\`\`tsx
// Server Component - runs ONLY on server
// File: app/products/page.tsx (no 'use client')

import { db } from '@/lib/database';     // Direct DB access!
import { parseMarkdown } from 'marked';  // Heavy library - not in bundle

async function ProductPage({ params }: { params: { id: string } }) {
  // Direct database query - no API needed
  const product = await db.products.findUnique({
    where: { id: params.id },
    include: { reviews: true },
  });
  
  // Use heavy libraries without bundle cost
  const description = parseMarkdown(product.description);
  
  // Access server-only secrets
  const apiKey = process.env.SECRET_API_KEY;
  const analytics = await fetch(\`https://api.com?key=\${apiKey}\`);
  
  return (
    <div>
      <h1>{product.name}</h1>
      <div dangerouslySetInnerHTML={{ __html: description }} />
      
      {/* Client component for interactivity */}
      <AddToCartButton productId={product.id} />
      
      {/* Server component for reviews */}
      <ReviewList reviews={product.reviews} />
    </div>
  );
}
\`\`\`

## Client Components

\`\`\`tsx
// Client Component - runs on client (and server for SSR)
// File: components/AddToCartButton.tsx
'use client';  // â† Required directive

import { useState } from 'react';
import { useCart } from '@/hooks/useCart';

export function AddToCartButton({ productId }: { productId: string }) {
  const [isAdding, setIsAdding] = useState(false);
  const { addItem } = useCart();
  
  async function handleClick() {
    setIsAdding(true);
    await addItem(productId);
    setIsAdding(false);
  }
  
  return (
    <button onClick={handleClick} disabled={isAdding}>
      {isAdding ? 'Adding...' : 'Add to Cart'}
    </button>
  );
}
\`\`\`

## Component Tree and Boundaries

\`\`\`
Server Component (Root)
â”‚
â”œâ”€â”€ Server Component (can do async, db, secrets)
â”‚   â”‚
â”‚   â”œâ”€â”€ Client Component ('use client')
â”‚   â”‚   â”‚
â”‚   â”‚   â””â”€â”€ Any Component (becomes client)
â”‚   â”‚       â”‚
â”‚   â”‚       â””â”€â”€ All descendants are client
â”‚   â”‚
â”‚   â””â”€â”€ Server Component (still server!)
â”‚
â””â”€â”€ Client Component
    â”‚
    â””â”€â”€ Can render Server Components as children
        (passed as props, not imported)
\`\`\`

\`\`\`tsx
// âœ… Correct: Server component as children
// Server
function ServerParent() {
  return (
    <ClientWrapper>
      <ServerChild /> {/* Works! Passed as children prop */}
    </ClientWrapper>
  );
}

// Client
'use client';
function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>{count}</button>
      {children}
    </div>
  );
}

// âŒ Wrong: Importing server component in client
'use client';
import { ServerComponent } from './ServerComponent'; // Error or becomes client!
\`\`\`

## RSC Payload

\`\`\`javascript
// What the server sends (simplified)
// Not HTML - it's a serialized React tree

0: ["$", "div", null, {
  "children": [
    ["$", "h1", null, { "children": "Product Name" }],
    ["$", "$Lc", "1", { "productId": "123" }],  // Client component reference
    ["$", "div", null, { "children": "Description..." }]
  ]
}]

// $Lc = Client component
// "1" = Chunk/module reference
// The actual component code is in a separate JS file

// Client components are "holes" in the server tree
// Browser fills them in with actual interactive components
\`\`\`

## When to Use Each

\`\`\`tsx
// SERVER COMPONENTS for:
// âœ“ Data fetching
// âœ“ Accessing backend resources
// âœ“ Keeping sensitive info on server
// âœ“ Large dependencies (syntax highlighters, markdown)
// âœ“ Static content

// CLIENT COMPONENTS for:
// âœ“ Interactivity (onClick, onChange)
// âœ“ State (useState, useReducer)
// âœ“ Effects (useEffect)
// âœ“ Browser APIs (localStorage, geolocation)
// âœ“ Custom hooks with state/effects
// âœ“ Class components

// PATTERN: Push client boundaries down
// âŒ Making entire page client
'use client';
export default function Page() { ... }

// âœ… Only interactive parts are client
export default function Page() {
  const data = await fetchData();
  return (
    <div>
      <StaticHeader />
      <InteractiveChart data={data} /> {/* 'use client' */}
      <StaticFooter />
    </div>
  );
}
\`\`\``,
    keyPoints: [
      'Understands RSC vs traditional SSR difference',
      'Knows server components stay on server',
      'Can identify what needs \'use client\'',
      'Understands the component tree boundaries',
      'Knows RSC payload format conceptually',
      'Can optimize by pushing client boundaries down',
    ],
    followUpQuestions: [
      'How does streaming work with RSC?',
      'What about caching RSC payloads?',
      'How do RSC handle forms and mutations?',
      'What\'s the relationship between RSC and Suspense?',
    ],
    relatedTopics: ['nextjs', 'ssr', 'streaming', 'hydration'],
    source: 'seed',
    commonAt: ['Vercel', 'Companies using Next.js 13+'],
  },
];

export { reactInternalsQuestions };
