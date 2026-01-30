// ============================================================================
// CACHING & MEMOIZATION (SENIOR ARCHITECT EDITION)
// ============================================================================

import { CreateQuestionInput, QUESTION_CATEGORIES } from "@/types";

export const cachingMemoizationQuestions: CreateQuestionInput[] = [
  {
    category: QUESTION_CATEGORIES.CACHING_MEMOIZATION,
    difficulty: "senior",
    question:
      "Design a multi-tier caching strategy for a high-traffic global application. How do you mitigate 'Cache Deception' attacks, and what are the architectural trade-offs of 'stale-while-revalidate' at the Edge vs. the Browser?",
    answer: `## 1. Multi-Tier Architecture

A robust caching strategy treats the network as a distributed state machine.

\`\`\`mermaid
Request Flow:
Client 
  │ (1. Browser Cache: Memory/Disk)
  ▼
Service Worker (2. Programmatic Cache)
  │
  ▼
Edge Node (3. CDN Cache + Edge Workers)
  │ 
  ▼
Origin Shield (4. Shared Regional Cache)
  │
  ▼
Origin Server (5. Application Memory/Redis)
\`\`\`

### Architectural Distinctions

| Layer | Responsibility | Invalidation Strategy | Risk |
|-------|----------------|-----------------------|------|
| **Browser** | Instant navigation, offline support | Versioned filenames, \`Clear-Site-Data\` | Stale code causing runtime errors |
| **CDN/Edge** | Static assets, computed HTML regions | Surrogate keys, Purge API | Serving private data to wrong user |
| **Origin** | Database query result caching | TTL, Write-through | Memory leaks, cache stampedes |

### 2. The 'stale-while-revalidate' (SWR) Dichotomy

**A. At the Browser (RFC 5861)**
- **Mechanism:** Browser serves stale content from disk immediately, then initiates a background network fetch.
- **Use Case:** Non-critical UI (avatars, dashboards).
- **Trade-off:** UI consistency. Users may see "ghost" data before it snaps to reality.

**B. At the Edge (CDN)**
- **Mechanism:** Edge serves stale content to the *client*, then asynchronously fetches from Origin.
- **Use Case:** High-throughput APIs, protecting Origin from spikes.
- **Trade-off:** Origin load predictability. If 1M users hit a stale edge node, they all get the stale version, but the Origin only sees 1 revalidation request (Request Collapsing).

\`\`\`http
# Hybrid Strategy Header
Cache-Control: public, max-age=60, stale-while-revalidate=3600, stale-if-error=86400
\`\`\`
*Explanation:* Fresh for 60s. Between 60s-1h, serve stale but update background. If Origin is down, serve stale for 24h.

### 3. Mitigating Cache Deception Attacks

**The Vulnerability:** An attacker tricks a logged-in user into visiting \`https://api.app.com/private-data/user.css\`. The server ignores the extension and returns JSON. The CDN sees \`.css\`, assumes it's static, and caches the private JSON for *everyone*.

**Defense Strategy:**

1.  **Vary Header Enforcement:**
    \`\`\`http
    Vary: Cookie, Authorization
    \`\`\`
    *Forces CDN to partition cache based on auth tokens (effectively disabling shared caching for auth'd routes).*

2.  **Explicit No-Cache on Dynamic Routes:**
    Never rely on default CDN behavior.
    \`\`\`http
    Cache-Control: private, no-store
    \`\`\`

3.  **Extension Whitelisting:**
    Configure CDN/WAF to only cache known extensions (.js, .css, .png) if the \`Content-Type\` matches strict MIME types.

### 4. Advanced: The 'Vary' Trap
Using \`Vary: User-Agent\` is an architectural anti-pattern. It fragments the cache into thousands of buckets (one per browser version), reducing Cache Hit Ratio to near zero. Use \`Vary\` sparingly or normalize headers at the Edge (e.g., normalize \`User-Agent\` to just \`Mobile\` or \`Desktop\`).`,
    keyPoints: [
      "Distinguishes between Browser SWR (latency) and Edge SWR (origin protection)",
      "Identifies Cache Deception mechanics (URL path vs Content-Type mismatch)",
      "Understands Cache Stampede protection via Request Collapsing",
      "Explain the danger of high-cardinality Vary headers",
    ],
    followUpQuestions: [
      "How does 'private' directive interact with shared proxies?",
      "Explain the impact of ETags on server CPU vs. bandwidth.",
      "How would you implement 'Soft Purge' vs 'Hard Purge'?",
    ],
    relatedTopics: ["cdn", "security", "http-spec", "distributed-systems"],
    source: "seed",
    commonAt: ["Cloudflare", "Netflix", "Akamai"],
  },
  {
    category: QUESTION_CATEGORIES.CACHING_MEMOIZATION,
    difficulty: "senior",
    question:
      "Beyond basic syntax, analyze the 'Referential Stability Chain' in React. How does a single unstable reference at the root destroy performance in a large subtree, and how does the React Compiler (React Forget) change this mental model?",
    answer: `## 1. The Referential Stability Chain

In React, manual optimization (\`memo\`, \`useMemo\`) relies on an unbroken chain of stable references.

**The Cascading Failure:**
If a Context Provider value is created without memoization, *every* consumer of that context re-renders. If those consumers pass derived values to children, the invalidation cascades down, bypassing \`React.memo\` boundaries because the props have technically changed.

\`\`\`typescript
// ❌ The Root Cause (Unstable Context)
const App = () => {
  // New object reference created on EVERY render
  const config = { theme: 'dark', flags: { enableNewUI: true } }; 
  
  return (
    <ConfigContext.Provider value={config}>
      <HugeComponentTree />
    </ConfigContext.Provider>
  );
};

// ❌ The Victim (Even if memoized)
const DeepChild = React.memo(({ data }) => {
  // This re-renders because 'config' in the parent caused 
  // intermediate computations to produce new references.
  return <div>...</div>;
});
\`\`\`

### 2. The Cost of Memoization

UseMemo is not free. It incurs:
1.  **Memory Overhead:** Retaining the previous result and dependencies.
2.  **CPU Overhead:** Comparison logic runs on every render.

**The Senior Heuristic:**
Do NOT memoize primitive calculations (\`a + b\`). The overhead of \`useMemo\` (object allocation, array creation for deps, comparison) is often higher than the operation itself.
*Only memoize when:*
* The computation is O(n) where n > 1000.
* **The reference is a dependency** for a \`useEffect\` or a \`React.memo\` component component.

### 3. Architectural Pattern: Context Splitting

To preserve stability, split context by frequency of change.

\`\`\`typescript
// ✅ Split frequent updates from static config
const App = () => {
  const [user, setUser] = useState(null); // Frequent
  const config = useMemo(() => ({ apiEndpoint: '...' }), []); // Static

  return (
    <ConfigContext.Provider value={config}>
      <UserContext.Provider value={user}>
        <Layout />
      </UserContext.Provider>
    </ConfigContext.Provider>
  );
};
\`\`\`

### 4. The Future: React Compiler (React Forget)

React 19+ introduces an auto-memoizing compiler.

* **Paradigm Shift:** We move from "manual dependency tracking" to "fine-grained reactivity".
* **How it works:** The compiler analyzes data flow at build time and memoizes *everything* (components, hooks, values) automatically.
* **Impact:** \`useMemo\` and \`useCallback\` become mostly obsolete for performance tuning, remaining useful only for semantic guarantees (e.g., ensuring a \`useEffect\` doesn't fire too often).

**Mental Model Shift:**
* *Before:* "Is this expensive? Memoize it."
* *After:* "Is this a semantic requirement for an effect? Memoize it. Otherwise, trust the compiler."`,
    keyPoints: [
      "Concept of 'Referential Cascade' breaking React.memo",
      "Context Splitting as a solution for high-frequency updates",
      "Memory/CPU cost of memoization vs. raw recalculation",
      "React Compiler shifting focus from performance to semantics",
    ],
    followUpQuestions: [
      "How do you debug 'Render Thrashing' using the React Profiler?",
      "Why does passing a new function to a custom hook break its internal memoization?",
      "What is the 'component composition' pattern as an alternative to memoization?",
    ],
    relatedTopics: [
      "react-internals",
      "performance-profiling",
      "compiler-theory",
    ],
    source: "seed",
    commonAt: ["Meta", "Uber", "Airbnb"],
  },
  {
    category: QUESTION_CATEGORIES.CACHING_MEMOIZATION,
    difficulty: "senior",
    question:
      "Implement a memory-safe LRU cache for a long-running SPA. How do you prevent memory leaks when caching DOM nodes or large closures, and how does `WeakRef` play a role?",
    answer: `## 1. Memory Leaks in SPA Caching

Standard \`Map\` or object-based caches hold **Strong References**. If you cache a large object (or worse, a detached DOM node), the Garbage Collector (GC) cannot free it even if the application no longer needs it. In a long-running dashboard, this leads to OOM (Out of Memory) crashes.

### 2. The Solution: WeakRef & FinalizationRegistry

We need a cache that holds items *weakly*—allowing the GC to reap them if memory is tight or they are unused elsewhere—while still enforcing an LRU policy for "strong" usage.

\`\`\`typescript
/**
 * Senior Pattern: LRU with Weak References
 * * Strategy: 
 * 1. 'Hot' items are held strongly (Map).
 * 2. 'Cold' items are held weakly (WeakRef).
 * 3. If a Cold item is accessed, it becomes Hot.
 * 4. If memory pressure is high, GC reaps Cold items automatically.
 */

class HybridWeakLRUCache<K extends object, V extends object> {
  private strongCache = new Map<K, V>();
  private weakCache = new WeakMap<K, WeakRef<V>>();
  private accessOrder: K[] = []; // Tracking for LRU
  
  constructor(private readonly maxStrongSize: number) {}

  set(key: K, value: V) {
    // 1. Add to strong cache (It's hot)
    this.strongCache.set(key, value);
    this.addToAccessOrder(key);
    
    // 2. Also register weak reference for fallback
    this.weakCache.set(key, new WeakRef(value));

    // 3. Evict if needed
    if (this.strongCache.size > this.maxStrongSize) {
      this.evictLeastRecent();
    }
  }

  get(key: K): V | undefined {
    // Case A: It's in strong cache (Hot)
    if (this.strongCache.has(key)) {
      this.refreshAccess(key);
      return this.strongCache.get(key);
    }

    // Case B: It dropped to weak cache (Cold but not GC'd)
    const weakRef = this.weakCache.get(key);
    const value = weakRef?.deref();
    
    if (value) {
      // Resurrect: Move back to strong cache
      this.strongCache.set(key, value);
      this.addToAccessOrder(key);
      
      // Check overflow again
      if (this.strongCache.size > this.maxStrongSize) {
        this.evictLeastRecent();
      }
      return value;
    }

    // Case C: GC'd or never existed
    return undefined;
  }

  private evictLeastRecent() {
    const oldestKey = this.accessOrder.shift();
    if (oldestKey) {
      // Remove from strong cache ONLY. 
      // It remains in weakCache until GC decides to kill it.
      this.strongCache.delete(oldestKey);
    }
  }
  
  // ... helper methods for accessOrder array management ...
}
\`\`\`

### 3. Architectural Nuance: Cache Size vs. Heap Size

A \`maxSize=1000\` doesn't mean safety. 1000 integers is tiny; 1000 4MB JSON blobs is 4GB.

**Senior Implementation Detail:**
Use \`window.performance.memory\` (Chrome only) or a byte-size estimation function to govern eviction based on **Heap Impact**, not just item count.

\`\`\`typescript
function sizeOf(obj: any): number {
  // Rough approximation for eviction policy
  return JSON.stringify(obj).length * 2; 
}
\`\`\`
`,
    keyPoints: [
      "Difference between Strong and Weak references in JS",
      "Hybrid cache strategy (Strong Hot / Weak Cold)",
      "Role of Garbage Collector in cache eviction",
      "Byte-size estimation vs. count-based eviction",
    ],
    followUpQuestions: [
      "How does FinalizationRegistry help in cleaning up side effects of cached items?",
      "Why are detached DOM nodes particularly dangerous in caches?",
      "How would you synchronize this cache across multiple web workers?",
    ],
    relatedTopics: [
      "memory-management",
      "garbage-collection",
      "data-structures",
    ],
    source: "seed",
    commonAt: ["Google (Chrome Team)", "Figma", "VsCode"],
  },
  {
    category: QUESTION_CATEGORIES.CACHING_MEMOIZATION,
    difficulty: "senior",
    question:
      "Architecturally, how does React Query (TanStack Query) differ from global state managers (Redux/Zustand)? Explain the 'Server State' vs 'Client State' synchronization problem and how to handle 'Optimistic UI' rollbacks safely.",
    answer: `## 1. Server State vs. Client State

**The Fundamental Split:**
* **Client State (Redux/Zustand):** Synchronous, owned by the browser (UI isOpen, form inputs, theme).
* **Server State (React Query):** Asynchronous, owned by a remote server, potentially outdated, shared by multiple users.

Using Redux for Server State leads to "Boilerplate Bloat" (thunks, loading flags, error strings) and "Truth Discrepancies" (Redux store says User is X, DB says User is Y). React Query treats the cache as a *reflection* of the server, not the source of truth.

## 2. Optimistic UI: The Architectural Hazard

Optimistic updates (updating UI before server confirms) introduce race conditions.

**Scenario:**
1. User clicks "Like" (Optimistic update: +1).
2. Request A (Like) is sent.
3. User clicks "Unlike" immediately.
4. Request B (Unlike) is sent.
5. Request B fails. Request A succeeds.

**The Solution: Snapshot & Rollback Context**

\`\`\`typescript
const useLikeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateLikeOnServer,
    
    // 1. Prepare (Run before mutation)
    onMutate: async (newLikeStatus) => {
      // STOP outgoing refetches (prevent overwriting our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['likes'] });

      // SNAPSHOT previous value
      const previousLikes = queryClient.getQueryData(['likes']);

      // UPDATE cache optimistically
      queryClient.setQueryData(['likes'], (old) => ({
        ...old,
        liked: newLikeStatus
      }));

      // RETURN context for rollback
      return { previousLikes };
    },

    // 2. Handle Failure
    onError: (err, newTodo, context) => {
      // ROLLBACK using the snapshot
      if (context?.previousLikes) {
        queryClient.setQueryData(['likes'], context.previousLikes);
      }
    },

    // 3. Settle (Success or Fail)
    onSettled: () => {
      // REVALIDATE to ensure true consistency with server
      queryClient.invalidateQueries({ queryKey: ['likes'] });
    },
  });
};
\`\`\`

### 3. Cache Persistence & Hydration

For "Offline-First" apps, memory cache isn't enough.
We use \`persistQueryClient\` to serialize the cache to localStorage/IndexedDB.

**The "Hash Mismatch" Danger:**
If you deploy a new app version that changes the data structure, deserializing old cache breaks the app.
*Fix:* Use \`buster\` strings in your persister configuration to force cache invalidation on version upgrades.

\`\`\`typescript
const persister = createSyncStoragePersister({
  storage: window.localStorage,
});
// If 'v2' != stored version, wipe cache
persistQueryClient({ queryClient, persister, buster: 'v2' });
\`\`\`
`,
    keyPoints: [
      "Strict separation of Client vs Server state ownership",
      "Race condition handling in Optimistic UI via 'cancelQueries'",
      "The 'Context' pattern for rollback data",
      "Versioning strategies for persistent cache (busters)",
    ],
    followUpQuestions: [
      "How do you handle 'Dependent Queries' where Request B needs Request A's ID?",
      "Explain 'Structural Sharing' in React Query and how it preserves referential identity.",
      "What is the 'Waterfalls' problem in data fetching and how does `useQueries` or prefetching solve it?",
    ],
    relatedTopics: ["distributed-systems", "offline-first", "state-machines"],
    source: "seed",
    commonAt: ["Linear", "Atlassian", "Shopify"],
  },
  {
    category: QUESTION_CATEGORIES.CACHING_MEMOIZATION,
    difficulty: "senior",
    question:
      "In a high-performance Redux environment (e.g., data visualization), how do you balance Selector Computational Cost vs. Memory Overhead? Discuss 'Selector Thrashing' and the trade-offs of `weakMapMemoize` vs. `lruMemoize`.",
    answer: `## 1. The Cost of Derivation

Memoization is a trade-off: **RAM for CPU**.
In data-intensive apps (e.g., 50k rows in a grid), blindly memoizing everything causes GC thrashing.

### 2. Selector Thrashing

**The Problem:**
Standard Reselect (\`lruMemoize\` with size 1) only remembers the *last* arguments.
If you use the same selector in multiple components with different props, they overwrite each other's cache entry on every render.

\`\`\`typescript
// Shared selector
const selectItem = createSelector(
  [state => state.items, (_, id) => id],
  (items, id) => items[id]
);

// Component A requests ID=1 -> Cache(1)
// Component B requests ID=2 -> Cache(2) (Overwrites 1)
// Component A re-renders -> Recalculates 1 (Thrashing)
\`\`\`

**The Solution: Selector Factories (Instance Memoization)**
Create a unique selector instance *per component instance*.

\`\`\`typescript
const makeSelectItem = () => createSelector(
  [state => state.items, (_, id) => id],
  (items, id) => items[id]
);

function ListItem({ id }) {
  // UseMemo ensures this selector instance lives as long as the component
  const selectItemInstance = useMemo(makeSelectItem, []);
  const item = useSelector(state => selectItemInstance(state, id));
}
\`\`\`

### 3. weakMapMemoize vs. lruMemoize (RTK 2.0+)

**lruMemoize (The Classic):**
- **Logic:** "Keep the last N results."
- **Pros:** Predictable size. Good for simple derived data.
- **Cons:** Primitive argument limitations. Can leak if maxSize is too high.

**weakMapMemoize (The Modern Standard):**
- **Logic:** "Keep results as long as the *Input Object* exists in memory."
- **Pros:** Infinite cache size without memory leaks (GC handles it). extremely fast lookup.
- **Cons:** Only works if arguments are Objects (references). Primitives cause fallback behavior.

**Architectural Decision:**
* Use \`weakMapMemoize\` for selectors deriving from the **Root State** (stable object reference).
* Use \`lruMemoize\` for selectors taking **Filters/IDs** (primitives) as arguments.

### 4. Input Stability Optimization

A selector is only as good as its inputs. If an input selector returns a new reference (array.map), the memoization is useless.

\`\`\`typescript
// ❌ Bad: 'slicing' creates a new array reference every time
const selectTop5 = createSelector(
  [state => state.items.slice(0, 5)], 
  (items) => expensiveTransform(items)
);

// ✅ Good: Move the instability INSIDE the memoizer
const selectTop5 = createSelector(
  [state => state.items], 
  (items) => {
    // This function only runs if 'items' (the big array) changes
    return expensiveTransform(items.slice(0, 5));
  }
);
\`\`\`
`,
    keyPoints: [
      "Diagnosing Selector Thrashing in list virtualization",
      "Factory Pattern for component-scoped memoization",
      "Memory implications of WeakMap vs LRU strategies",
      "Input Stability is more important than output caching",
    ],
    followUpQuestions: [
      "How does 'Proxy-based' memoization (like in Valatio/Zustand) differ from Selector caching?",
      "Why is 'Reselect' considered a Push-Pull hybrid system?",
      "How do you profile selector re-computations in Redux DevTools?",
    ],
    relatedTopics: [
      "redux-toolkit",
      "memory-profiling",
      "functional-programming",
    ],
    source: "seed",
    commonAt: ["Bloomberg", "Goldman Sachs", "DataDog"],
  },
];
