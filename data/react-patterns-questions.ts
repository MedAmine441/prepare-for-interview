// ============================================================================
// REACT PATTERNS & HOOKS
// ============================================================================

import { CreateQuestionInput, QUESTION_CATEGORIES } from "@/types";

export const reactPatternsQuestions: CreateQuestionInput[] = [
  {
    category: QUESTION_CATEGORIES.REACT_PATTERNS,
    difficulty: "junior",
    question:
      "What's the difference between controlled and uncontrolled components? When would you pick each?",
    answer: `## Controlled

React state is the **single source of truth**; the input reflects state and every keystroke goes through React:

\`\`\`jsx
const [email, setEmail] = useState("");
<input value={email} onChange={(e) => setEmail(e.target.value)} />
\`\`\`

You get instant validation, conditional disabling, formatting-as-you-type, and the value is always available for rendering elsewhere.

## Uncontrolled

The **DOM owns the value**; React reads it when needed via a ref (or FormData on submit):

\`\`\`jsx
const ref = useRef(null);
<input defaultValue="hi" ref={ref} />
// on submit: ref.current.value
\`\`\`

Less code, no re-render per keystroke — but no live reaction to input.

## Choosing

- Controlled: live validation/feedback, dependent fields, character counters, instant search.
- Uncontrolled: simple submit-only forms, file inputs (\`<input type="file">\` is always uncontrolled), integrating non-React libraries.
- Form libraries split here too: Formik is controlled-style; React Hook Form is uncontrolled with refs for performance.

## Classic bug

Switching between controlled and uncontrolled (value going \`undefined\` → string) triggers the React warning; initialize state to \`""\`, never \`undefined\`.`,
    keyPoints: [
      "Controlled: React state drives the input via value + onChange",
      "Uncontrolled: DOM holds the value; read it via ref or FormData",
      "Controlled enables live validation; uncontrolled avoids per-keystroke renders",
      "Never let value flip between undefined and a string",
    ],
    followUpQuestions: [
      "Why is React Hook Form faster than Formik on large forms?",
      "How do you handle a file input in React?",
    ],
    relatedTopics: ["forms", "refs", "state-management"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.REACT_PATTERNS,
    difficulty: "mid",
    question:
      "useEffect: explain the dependency array, cleanup functions, and the most common mistakes you see with effects.",
    answer: `## Mental model

An effect **synchronizes the component with an external system** (subscription, timer, DOM API, network). It runs after render; the dependency array declares which values it reads, so React knows when to re-synchronize.

- \`[]\` — after mount only (and cleanup at unmount).
- \`[a, b]\` — after any render where \`a\` or \`b\` changed (Object.is comparison).
- omitted — after **every** render (almost always a bug).

## Cleanup

Return a function; React runs it **before the next effect run** and at unmount:

\`\`\`jsx
useEffect(() => {
  const ctrl = new AbortController();
  fetch(url, { signal: ctrl.signal }).then(...);
  return () => ctrl.abort(); // prevents state updates from stale requests
}, [url]);
\`\`\`

## Common mistakes

1. **Lying about dependencies** to "run once" — causes stale closures; fix the design instead (useRef for mutable values, functional setState, move logic out).
2. **Deriving state in an effect** — \`useEffect(() => setFullName(first + last))\` causes double renders; compute during render instead.
3. **Effects for user events** — a submit handler belongs in \`onSubmit\`, not an effect watching a flag.
4. **Object/array/function deps recreated each render** — effect fires every time; memoize them or move them inside the effect.
5. Missing cleanup → race conditions and leaked subscriptions. StrictMode double-invokes effects in dev precisely to expose this.`,
    keyPoints: [
      "Effects synchronize with external systems; deps declare what they read",
      "Cleanup runs before each re-run and at unmount",
      "Don't lie about deps — fix stale closures by design, not omission",
      "Derived state and event logic don't belong in effects",
      "StrictMode double-invocation exposes missing cleanup",
    ],
    followUpQuestions: [
      "When would you use useLayoutEffect instead?",
      "How does the upcoming useEffectEvent help with the deps problem?",
    ],
    relatedTopics: ["closures", "data-fetching", "race-conditions"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.REACT_PATTERNS,
    difficulty: "mid",
    question:
      "When do useMemo and useCallback actually help? When are they premature optimization?",
    answer: `## What they do

- \`useMemo(fn, deps)\` caches the **return value** of \`fn\` across renders until deps change.
- \`useCallback(fn, deps)\` caches the **function identity** itself (≡ \`useMemo(() => fn, deps)\`).

They exist because every render recreates objects and functions, and React compares by **reference**.

## When they genuinely help

1. **Preserving referential stability for memoized children** — \`<Child onSave={handleSave}/>\` where Child is wrapped in \`React.memo\`: without useCallback the new function identity defeats the memo every render.
2. **Stabilizing effect/hook dependencies** — an object in a dep array retriggers effects each render unless memoized.
3. **Genuinely expensive computation** — filtering/sorting thousands of rows, building charts.

## When they're noise

- Cheap computations — the memo bookkeeping costs more than recomputing \`firstName + lastName\`.
- Props to non-memoized children — child re-renders anyway; stable identity buys nothing.
- Dependencies that change every render — the cache never hits.

## Better questions first

Before sprinkling memoization: can you **move state down** (isolate the re-rendering subtree) or **lift content up** as \`children\` (children prop stays referentially stable)? Composition often removes the need. Also worth mentioning: the React Compiler is intended to automate this memoization eventually.`,
    keyPoints: [
      "They cache value/identity because React compares by reference",
      "Useful with React.memo children, effect deps, and expensive computations",
      "Useless on cheap values or when deps change every render",
      "Restructuring (state down, children up) often beats memoization",
    ],
    followUpQuestions: [
      "Why does passing children through props avoid re-renders?",
      "What does React.memo's custom comparator risk?",
    ],
    relatedTopics: ["referential-stability", "react-memo", "rendering"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.REACT_PATTERNS,
    difficulty: "mid",
    question:
      "How do you decide where state should live? Explain state colocation, lifting state up, and the derived-state anti-pattern.",
    answer: `## The principle

Keep state **as close as possible to where it's used** (colocation), and lift it **only as high as necessary** — to the nearest common ancestor of everyone who needs it.

- State too high → wide re-renders, tangled props, components that can't be reused.
- State too low → siblings can't share it; you end up duplicating.

## Lifting state up

Two siblings need the same data? Move it to the parent and pass value + updater down. When lifting starts creating prop-drilling chains, that's the signal for context (low-frequency data like theme/user) or a store (frequent, shared app state).

## Derived state anti-pattern

Don't store what you can compute:

\`\`\`jsx
// ❌ duplicated source of truth — can desync, needs an effect to sync
const [items, setItems] = useState([]);
const [selectedCount, setSelectedCount] = useState(0);

// ✅ derive during render
const selectedCount = items.filter(i => i.selected).length;
// expensive? wrap in useMemo — still derived, just cached
\`\`\`

Symptoms of the anti-pattern: \`useEffect\` whose only job is \`setB(f(a))\`, state that must be updated in multiple places together, "sync bugs".

Also name the related smell: **mirroring props into state** (\`useState(props.value)\`) — it snapshots the prop and stops updating; if intentional (initial value), name it \`defaultValue\` and key the component to reset.`,
    keyPoints: [
      "Colocate state; lift only to the nearest common ancestor that needs it",
      "Prop-drilling pain signals context or a store, not more lifting",
      "Never store derivable data — compute in render, useMemo if expensive",
      "Effect-that-syncs-state and prop-mirroring are the classic smells",
    ],
    followUpQuestions: [
      "When is duplicating state into a component actually correct?",
      "How does the key prop help reset component state?",
    ],
    relatedTopics: ["state-management", "context", "component-design"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.REACT_PATTERNS,
    difficulty: "mid",
    question:
      "Why do array-index keys cause bugs in React lists? What does the key prop actually do?",
    answer: `## What keys are for

During reconciliation React matches children of a list **by key** to decide: same key = same component instance (update it, keep its state); new key = mount; missing key = unmount. Keys are identity, not ordering hints.

## Why index keys break

With \`key={index}\`, identity follows **position**, not data. Delete the first item and every remaining item shifts into the previous item's identity:

- **State bleeds**: an uncontrolled input's text, a checkbox, an expanded row — stays at position 0 while the data that "owns" it moved.
- **Animations/focus** attach to the wrong rows.
- Effects re-run oddly because components update in place rather than unmount.

Index keys are only safe when the list is **append-only, never reordered/filtered, and items are stateless**.

## Good keys

Stable, unique, tied to the data: a database id, a slug. Generate ids at **data creation time** (\`crypto.randomUUID()\` when adding an item) — never \`key={Math.random()}\` in render, which forces a full remount every render (state wiped, DOM rebuilt).

## Bonus: key as a reset lever

Changing a key deliberately remounts a subtree — the idiomatic way to reset a form when switching entities:

\`\`\`jsx
<ProfileForm key={userId} userId={userId} />
\`\`\``,
    keyPoints: [
      "Keys give list children identity across renders for reconciliation",
      "Index keys tie identity to position — state bleeds when items shift",
      "Keys must be stable and unique; random keys force remounts every render",
      "Changing a key intentionally is the idiom for resetting component state",
    ],
    followUpQuestions: [
      "What exactly happens to a component instance when its key changes?",
      "Why does React warn about missing keys but render anyway?",
    ],
    relatedTopics: ["reconciliation", "component-state", "lists"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.REACT_PATTERNS,
    difficulty: "senior",
    question:
      "React Context and performance: when does context cause re-render problems, and what are your options to fix them?",
    answer: `## The behavior

When a provider's \`value\` changes (by \`Object.is\`), **every consumer** of that context re-renders — regardless of which part of the value it reads, and \`React.memo\` on intermediate components does not block it (consumers subscribe directly).

Two classic self-inflicted wounds:

\`\`\`jsx
// ❌ fresh object every render — all consumers re-render every time
<AppContext.Provider value={{ user, setUser, theme }}>
\`\`\`

## Fixes, in order of preference

1. **Memoize the value**: \`useMemo(() => ({ user, setUser }), [user])\`.
2. **Split contexts by change frequency** — \`ThemeContext\` (rarely changes) separate from \`CartContext\` (changes often); state and dispatch in separate contexts so action-only components don't re-render on state changes.
3. **Push context lower** — provide it around the subtree that needs it, not the whole app.
4. **Wrap consumers' children**: a consumer component renders \`children\` it received as a prop — those stay referentially stable and skip re-rendering.
5. **Move high-frequency state to a store** — Zustand/Redux/Jotai consumers subscribe with **selectors** and re-render only when their slice changes; \`useSyncExternalStore\` is the primitive underneath.

## Rule of thumb

Context is dependency injection for **low-frequency data** (theme, auth, locale, services). It is not a state manager for rapidly changing values — that's what selector-based stores are for.`,
    keyPoints: [
      "Every consumer re-renders when the provider value reference changes",
      "Inline object values are the classic mistake — memoize them",
      "Split contexts by change frequency; separate state from dispatch",
      "Selector-based stores (Zustand/Redux) fix high-frequency shared state",
    ],
    followUpQuestions: [
      "How does useSyncExternalStore enable selector subscriptions?",
      "Why doesn't React.memo block context-driven re-renders?",
    ],
    relatedTopics: ["state-management", "referential-stability", "zustand"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.REACT_PATTERNS,
    difficulty: "senior",
    question:
      "Data fetching in React: what goes wrong with fetch-in-useEffect, and what problems do libraries like React Query solve?",
    answer: `## The naive version and its failure modes

\`\`\`jsx
useEffect(() => {
  fetch(\`/api/user/\${id}\`).then(r => r.json()).then(setUser);
}, [id]);
\`\`\`

1. **Race condition**: \`id\` changes 1→2; response 1 arrives *after* response 2 → stale data wins. Fix with a cancelled flag or \`AbortController\` in cleanup.
2. **Setting state after unmount** (aborted navigation) — leaked work and dev warnings.
3. No loading/error state unless you hand-roll three useStates per request.
4. **No caching** — every mount refetches; navigating back shows spinners for data you just had.
5. **Request waterfalls** — child components each fetching in their own effects serialize network trips.
6. StrictMode double-fires it in dev, exposing all of the above.

## What React Query / SWR actually provide

They treat server data as a **cache keyed by query key**, not as component state:

- Deduplication (many components, one request), background **stale-while-revalidate** refetching, refetch on focus/reconnect.
- Declarative \`isLoading / error / data\` states; retries with backoff.
- Mutations with cache invalidation and optimistic updates + rollback.
- Pagination/infinite queries; garbage collection of unused cache entries.

## The bigger point

Distinguish **server state** (owned by the backend, cacheable, shared, can go stale) from **client state** (UI state you own). Libraries like React Query manage the former; useState/Zustand manage the latter. Frameworks push further: server components / loaders fetch before render, eliminating the client waterfall entirely.`,
    keyPoints: [
      "fetch-in-effect suffers races, no cache, waterfalls, and boilerplate",
      "AbortController in cleanup is the manual fix for stale responses",
      "Query libraries: keyed cache, dedupe, SWR revalidation, retries, optimistic updates",
      "Separate server state (cacheable) from client state (owned by UI)",
    ],
    followUpQuestions: [
      "How would you implement optimistic updates with rollback?",
      "How do server components change the data-fetching story?",
    ],
    relatedTopics: ["react-query", "caching", "race-conditions", "suspense"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.REACT_PATTERNS,
    difficulty: "mid",
    question:
      "What makes a good custom hook? Design one (e.g., useLocalStorage or useDebounce) and explain the rules it must follow.",
    answer: `## What a custom hook is

A function whose name starts with \`use\` that calls other hooks — extracting **stateful logic** (not UI) for reuse. Each call gets its **own isolated state**; hooks share logic, never state.

## The rules

- Call hooks unconditionally, at the top level (the linter enforces call-order stability).
- Return a minimal, stable API — values plus memoized callbacks; tuple for useState-likes (\`[value, setValue]\`), object for richer APIs.
- Handle cleanup internally so consumers can't forget it.

## Example: useDebouncedValue

\`\`\`tsx
function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t); // cancel on change/unmount
  }, [value, delay]);
  return debounced;
}

// consumer
const results = useSearch(useDebouncedValue(query));
\`\`\`

The timer management, cleanup, and re-arming logic are invisible to the consumer — that encapsulation is the whole point.

## Design smells

- A hook that returns JSX (that's a component), or takes 8 config options (split it).
- Hiding a data dependency: prefer explicit inputs → outputs so behavior is predictable.
- Reimplementing library territory (data fetching) instead of composing existing hooks.

Testing: render the hook inside a test component or use \`renderHook\` from Testing Library.`,
    keyPoints: [
      "Custom hooks extract stateful logic; every call has isolated state",
      "Must follow rules of hooks — top-level, unconditional calls",
      "Encapsulate cleanup so consumers can't forget it",
      "Return minimal stable APIs; memoize returned callbacks",
    ],
    followUpQuestions: [
      "Why must hook call order be stable across renders?",
      "How would you test a custom hook in isolation?",
    ],
    relatedTopics: ["hooks-rules", "closures", "testing"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.REACT_PATTERNS,
    difficulty: "mid",
    question:
      "Error boundaries: what do they catch, what do they NOT catch, and how do you use them well?",
    answer: `## What they are

Class components implementing \`getDerivedStateFromError\` (render a fallback) and/or \`componentDidCatch\` (log). They catch errors thrown **during rendering, in lifecycle methods, and in constructors of the tree below them** — preventing one broken widget from unmounting the whole app (React unmounts everything if an error reaches the root unhandled).

There's still no hook equivalent — everyone uses the tiny \`react-error-boundary\` package or writes one class.

## What they do NOT catch

- **Event handlers** — use try/catch there.
- **Async code** — setTimeout callbacks, promise rejections (fetch errors!).
- Server-side rendering errors.
- Errors thrown in the boundary component itself.

The async gap matters: a failed fetch never hits a boundary unless you *rethrow during render* — which is exactly what React Query's \`throwOnError\` and Suspense-based data fetching do, funneling async errors into boundaries.

## Using them well

\`\`\`jsx
<ErrorBoundary fallbackRender={({ error, resetErrorBoundary }) => (
  <RetryCard onRetry={resetErrorBoundary} />
)}>
  <Widget />
</ErrorBoundary>
\`\`\`

- Place **granularly**: around routes and around independent widgets — sibling widgets survive one crashing.
- Provide **recovery**: a reset that re-mounts (often paired with resetting the query cache), not just an apology.
- Report to monitoring (Sentry) in \`componentDidCatch\`.`,
    keyPoints: [
      "Catch render/lifecycle errors below them; show a fallback instead of unmounting the app",
      "Do NOT catch event handlers or async errors — try/catch and rethrow-in-render bridge that",
      "Place per-route and per-widget, not one global boundary",
      "Pair fallbacks with reset/retry and error reporting",
    ],
    followUpQuestions: [
      "How does React Query integrate fetch errors with error boundaries?",
      "Why is there no useErrorBoundary hook in core React?",
    ],
    relatedTopics: ["suspense", "error-handling", "resilience"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.REACT_PATTERNS,
    difficulty: "senior",
    question:
      "Explain useTransition and useDeferredValue. What problem do React 18's concurrent features solve in real UIs?",
    answer: `## The problem

All state updates used to be equally urgent. Typing in a filter box that re-renders a 5,000-row list means each keystroke waits for the full list render — the input feels janky. The insight: **the keystroke is urgent, the list is not.**

## useTransition

Mark updates as non-urgent; React keeps showing the old UI while preparing the new one **in the background, interruptibly**:

\`\`\`jsx
const [isPending, startTransition] = useTransition();

setQuery(input);                    // urgent — input updates instantly
startTransition(() => {
  setFilter(input);                 // deferred — list renders when there's time
});
\`\`\`

If another keystroke arrives mid-render, React **abandons** the stale render and starts over — that interruptibility is the "concurrent" part. \`isPending\` drives a subtle spinner/dimming.

## useDeferredValue

Same idea when you don't own the state update — you receive a value and want a lagging copy:

\`\`\`jsx
const deferredQuery = useDeferredValue(query);
const results = useMemo(() => search(deferredQuery), [deferredQuery]);
\`\`\`

The memo matters — the deferred render only pays off if the expensive subtree skips re-rendering until \`deferredQuery\` changes.

## Notes

- This is CPU scheduling, not network magic — though transitions also integrate with Suspense (navigation keeps old content instead of flashing fallbacks).
- Don't wrap urgent updates (the input itself) or use it to "fix" cheap renders; it adds latency to the deferred update by design.`,
    keyPoints: [
      "Separates urgent updates (typing) from deferrable ones (big list renders)",
      "Transitions render in background and are abandoned if new input arrives",
      "useDeferredValue = lagging copy of a value you don't control the update for",
      "Pair with useMemo so the expensive subtree actually skips renders",
      "Also keeps old UI visible instead of Suspense fallbacks during navigation",
    ],
    followUpQuestions: [
      "How is this different from debouncing the input?",
      "What does time slicing mean at the Fiber level?",
    ],
    relatedTopics: ["react-fiber", "suspense", "scheduling", "performance"],
    source: "seed",
  },
];
