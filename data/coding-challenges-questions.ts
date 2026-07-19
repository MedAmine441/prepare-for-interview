// ============================================================================
// CODING CHALLENGES — implement-from-scratch, reviewed like a live round
// ============================================================================

import { CreateQuestionInput, QUESTION_CATEGORIES } from "@/types";

export const codingChallengesQuestions: CreateQuestionInput[] = [
  {
    category: QUESTION_CATEGORIES.CODING_CHALLENGES,
    difficulty: "mid",
    question:
      "Implement debounce(fn, wait): returns a debounced function that delays calling fn until wait ms have passed since the last call. Preserve `this` and arguments, and add a .cancel() method.",
    answer: `## Reference Implementation

\`\`\`js
function debounce(fn, wait) {
  let timerId = null;

  function debounced(...args) {
    clearTimeout(timerId);
    timerId = setTimeout(() => {
      timerId = null;
      fn.apply(this, args);
    }, wait);
  }

  debounced.cancel = () => {
    clearTimeout(timerId);
    timerId = null;
  };

  return debounced;
}
\`\`\`

## What Interviewers Check

- **Timer reset**: every call clears the previous timeout — that's the whole point; forgetting \`clearTimeout\` means fn fires once per call, just delayed.
- **\`this\` + args**: use a regular function (not an arrow) for \`debounced\` and \`fn.apply(this, args)\` — arrow functions would capture the wrong \`this\` for method usage like \`input.oninput = debounce(handler, 300)\`.
- **Arrow inside the timeout** so \`this\` from the outer call is preserved when it fires.
- **cancel()** clears pending work — needed for unmount cleanup in React.

## Common Follow-Up

Leading-edge option: fire immediately if no timer is pending, then suppress until quiet — a few extra lines gated by \`options.leading\`.`,
    keyPoints: [
      "Every call clears the previous timer before setting a new one",
      "fn.apply(this, args) — this and arguments preserved (no arrow for the wrapper)",
      "Timer callback is an arrow so the captured this survives until firing",
      "cancel() clears the pending timeout (React unmount cleanup)",
      "Can explain the leading-edge variant when asked",
    ],
    followUpQuestions: [
      "Add a leading option that fires on the first call of a burst.",
      "How is throttle different, and when would you pick each?",
      "How would you type this in TypeScript?",
    ],
    relatedTopics: ["closures", "timers", "higher-order-functions"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.CODING_CHALLENGES,
    difficulty: "mid",
    question:
      "Implement throttle(fn, wait): the returned function invokes fn at most once every wait ms. The first call fires immediately; calls during the cooldown are dropped except the last, which fires when the cooldown ends (trailing call).",
    answer: `## Reference Implementation

\`\`\`js
function throttle(fn, wait) {
  let lastTime = 0;
  let trailingId = null;
  let lastArgs = null;

  return function throttled(...args) {
    const now = Date.now();
    const remaining = wait - (now - lastTime);
    lastArgs = args;

    if (remaining <= 0) {
      lastTime = now;
      fn.apply(this, args);
    } else if (!trailingId) {
      trailingId = setTimeout(() => {
        trailingId = null;
        lastTime = Date.now();
        fn.apply(this, lastArgs);
      }, remaining);
    }
  };
}
\`\`\`

## What Interviewers Check

- **Leading call fires immediately** (\`remaining <= 0\` on first invocation since \`lastTime = 0\`).
- **Trailing call**: the last burst call isn't silently dropped — it's queued for when the window ends, with the **latest** args (\`lastArgs\`), not the args from when the timer was set.
- Only **one** trailing timer at a time (\`!trailingId\` guard).
- \`lastTime\` updates on both paths, or the trailing call would immediately allow another leading call.

## The Classic Distinction

Debounce = "wait for quiet" (search input). Throttle = "steady rate" (scroll/resize handlers).`,
    keyPoints: [
      "Leading call fires immediately; window computed from Date.now() - lastTime",
      "Trailing call fires with the LATEST args, not the ones from timer-set time",
      "Single trailing timer guard — no timer stacking during the cooldown",
      "lastTime updated on both leading and trailing fires",
      "Can articulate debounce (wait for quiet) vs throttle (steady rate)",
    ],
    followUpQuestions: [
      "Make leading/trailing configurable like lodash.",
      "Why is requestAnimationFrame often better for scroll handlers?",
    ],
    relatedTopics: ["timers", "closures", "scroll-performance"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.CODING_CHALLENGES,
    difficulty: "mid",
    question:
      "Implement promiseAll(promises): a from-scratch Promise.all. It takes an array (which may contain non-promise values), resolves with results in input order, and rejects on the first rejection.",
    answer: `## Reference Implementation

\`\`\`js
function promiseAll(items) {
  return new Promise((resolve, reject) => {
    const results = new Array(items.length);
    let remaining = items.length;

    if (remaining === 0) {
      resolve(results);
      return;
    }

    items.forEach((item, i) => {
      // Promise.resolve normalizes plain values and thenables
      Promise.resolve(item).then((value) => {
        results[i] = value;
        remaining -= 1;
        if (remaining === 0) resolve(results);
      }, reject);
    });
  });
}
\`\`\`

## What Interviewers Check

- **Order preserved by index** (\`results[i] = value\`), not by completion order — the #1 mistake is \`results.push(value)\`.
- **Counter, not \`results.length\`**: a sparse array's length lies; count completions explicitly.
- **\`Promise.resolve(item)\`** so plain values and foreign thenables work.
- **Empty array resolves immediately** — a classic missed edge case.
- **First rejection wins**: passing \`reject\` as the second handler is enough; later results are ignored, which is exactly Promise.all's semantics.

## Follow-Up Territory

\`allSettled\` is the same skeleton with a per-item catch mapping to \`{status, value/reason}\` and no early reject.`,
    keyPoints: [
      "Results stored by index — completion order must not affect output order",
      "Explicit remaining counter (sparse array length is unreliable)",
      "Promise.resolve() normalizes plain values and thenables",
      "Empty input resolves immediately with []",
      "First rejection rejects the whole thing; can sketch allSettled variant",
    ],
    followUpQuestions: [
      "Implement Promise.allSettled with the same skeleton.",
      "Implement Promise.race — what changes?",
      "How would you add a concurrency limit (pool of N)?",
    ],
    relatedTopics: ["promises", "async-patterns", "event-loop"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.CODING_CHALLENGES,
    difficulty: "junior",
    question:
      "Implement flatten(arr, depth = Infinity): flattens a nested array to the given depth without using Array.prototype.flat. flatten([1,[2,[3,[4]]]], 2) → [1,2,3,[4]].",
    answer: `## Reference Implementation

\`\`\`js
function flatten(arr, depth = Infinity) {
  const result = [];
  for (const item of arr) {
    if (Array.isArray(item) && depth > 0) {
      result.push(...flatten(item, depth - 1));
    } else {
      result.push(item);
    }
  }
  return result;
}
\`\`\`

Or the reduce one-liner interviewers often ask for next:

\`\`\`js
const flatten = (arr, d = Infinity) =>
  arr.reduce(
    (acc, x) =>
      acc.concat(Array.isArray(x) && d > 0 ? flatten(x, d - 1) : x),
    [],
  );
\`\`\`

## What Interviewers Check

- **\`Array.isArray\`**, not \`typeof x === 'object'\` (which would recurse into objects and match null).
- **Depth handled correctly**: decrement per level, stop pushing spread when depth hits 0.
- **No input mutation** — build a new array.
- Bonus: an **iterative version with a stack** for very deep nesting (recursion depth limits), reversing to keep order.`,
    keyPoints: [
      "Array.isArray for the branch — typeof 'object' matches null and objects",
      "Depth decrements per recursion level; depth 0 stops flattening",
      "Input is not mutated; a new array is returned",
      "Default depth Infinity flattens fully",
      "Can sketch an iterative stack version to dodge recursion limits",
    ],
    followUpQuestions: [
      "Write it iteratively with a stack.",
      "How does Array.prototype.flat handle empty slots (holes)?",
    ],
    relatedTopics: ["recursion", "arrays", "reduce"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.CODING_CHALLENGES,
    difficulty: "mid",
    question:
      "Implement an EventEmitter class with on(event, cb), off(event, cb), once(event, cb), and emit(event, ...args). Listeners added with once run a single time.",
    answer: `## Reference Implementation

\`\`\`js
class EventEmitter {
  #listeners = new Map(); // event -> Set<callback>

  on(event, cb) {
    if (!this.#listeners.has(event)) this.#listeners.set(event, new Set());
    this.#listeners.get(event).add(cb);
    return this;
  }

  off(event, cb) {
    this.#listeners.get(event)?.delete(cb);
    return this;
  }

  once(event, cb) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      cb(...args);
    };
    // Keep a handle so off(event, cb) also removes the once-wrapper
    wrapper.original = cb;
    this.on(event, wrapper);
    return this;
  }

  emit(event, ...args) {
    const set = this.#listeners.get(event);
    if (!set) return false;
    // Snapshot: listeners that unsubscribe during emit must not break iteration
    for (const cb of [...set]) cb(...args);
    return true;
  }
}
\`\`\`

## What Interviewers Check

- **once as a self-removing wrapper** — removed *before* calling, so a listener that emits the same event can't recurse infinitely.
- **Snapshot during emit** (\`[...set]\`): mutating the set while iterating (e.g. a once firing) is the classic subtle bug.
- Data structure choice: Map of Sets gives O(1) off and no duplicate listeners.
- Emitting an event with no listeners is a no-op, not a crash.`,
    keyPoints: [
      "Map<event, Set<cb>> — O(1) removal, no duplicate listeners",
      "once = self-removing wrapper, removed BEFORE invoking (recursion-safe)",
      "emit iterates a snapshot so unsubscribing mid-emit can't break iteration",
      "off/emit on unknown events are safe no-ops",
      "Chainable API (return this) is a nice touch, not a requirement",
    ],
    followUpQuestions: [
      "How would off(event, cb) remove a once() wrapper for that cb?",
      "How does this compare to DOM addEventListener semantics?",
    ],
    relatedTopics: ["pub-sub", "closures", "data-structures"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.CODING_CHALLENGES,
    difficulty: "senior",
    question:
      "Implement deepClone(value) supporting objects, arrays, Date, Map, Set, and circular references. Explain what you deliberately don't handle.",
    answer: `## Reference Implementation

\`\`\`js
function deepClone(value, seen = new WeakMap()) {
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value)) return seen.get(value); // circular ref

  if (value instanceof Date) return new Date(value.getTime());

  if (value instanceof Map) {
    const m = new Map();
    seen.set(value, m);
    for (const [k, v] of value)
      m.set(deepClone(k, seen), deepClone(v, seen));
    return m;
  }
  if (value instanceof Set) {
    const s = new Set();
    seen.set(value, s);
    for (const v of value) s.add(deepClone(v, seen));
    return s;
  }

  const clone = Array.isArray(value) ? [] : {};
  seen.set(value, clone); // register BEFORE recursing
  for (const key of Object.keys(value)) {
    clone[key] = deepClone(value[key], seen);
  }
  return clone;
}
\`\`\`

## What Interviewers Check

- **WeakMap for cycles**, registered *before* recursing into children — registering after is the classic infinite-loop bug.
- Primitives (and functions) returned as-is; \`typeof null === 'object'\` handled.
- Special types cloned properly (a naive loop turns Dates into empty objects).
- **Knowing the limits**: prototypes, getters/setters, property descriptors, symbols not handled — and saying that unprompted. Mentioning \`structuredClone()\` as the modern platform answer is senior signal.`,
    keyPoints: [
      "WeakMap tracks visited objects; clone registered BEFORE recursing (cycle-safe)",
      "null/primitive/function early return — typeof null === 'object' trap handled",
      "Date/Map/Set cloned as their real types, keys deep-cloned too",
      "States limits unprompted: prototypes, getters, symbols, descriptors",
      "Knows structuredClone() exists and JSON.parse(JSON.stringify) failure modes",
    ],
    followUpQuestions: [
      "Why WeakMap instead of Map for the seen-tracker?",
      "What does structuredClone handle that this doesn't, and vice versa?",
    ],
    relatedTopics: ["recursion", "weakmap", "structured-clone"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.CODING_CHALLENGES,
    difficulty: "mid",
    question:
      "Implement memoize(fn): caches results by arguments so repeated calls with the same args skip recomputation. Discuss your cache-key strategy and its limits.",
    answer: `## Reference Implementation

\`\`\`js
function memoize(fn, keyFn = (...args) => JSON.stringify(args)) {
  const cache = new Map();
  return function memoized(...args) {
    const key = keyFn(...args);
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}
\`\`\`

## What Interviewers Check

- **\`cache.has\`, not \`cache.get(...) !== undefined\`** — undefined is a legitimate cached result.
- **Key strategy stated honestly**: JSON.stringify breaks on object key order differences, functions, circular refs, and treats \`(1)\` vs \`("1")\`... actually stringify keeps those distinct, but \`{a:1,b:2}\` vs \`{b:2,a:1}\` produce different keys for equal objects. Offering an injectable \`keyFn\` shows judgment.
- **Single-arg object memoization**: a WeakMap keyed by the argument itself gives identity-based caching with free garbage collection — the follow-up interviewers usually want.
- Unbounded growth acknowledged: real caches need an eviction policy (LRU).

## Senior Follow-Up

For recursive functions (fib), memoization only helps if the *recursive calls* hit the memoized wrapper — a subtle and popular probe.`,
    keyPoints: [
      "cache.has() guard — undefined must be cacheable",
      "Key strategy limits stated: JSON.stringify vs object identity vs injectable keyFn",
      "WeakMap variant for single object args (identity + GC-friendly)",
      "Acknowledges unbounded growth; can sketch LRU eviction",
      "Knows recursive fns must self-call through the memoized wrapper to benefit",
    ],
    followUpQuestions: [
      "Add LRU eviction with a max size.",
      "Why does memoized fib still run in exponential time if fib calls itself directly?",
    ],
    relatedTopics: ["caching", "closures", "weakmap"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.CODING_CHALLENGES,
    difficulty: "senior",
    question:
      "Implement curry(fn): curry(add)(1)(2)(3) === add(1,2,3) for a 3-ary add. Calls may pass multiple args at once: curry(add)(1, 2)(3) must also work.",
    answer: `## Reference Implementation

\`\`\`js
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    return (...next) => curried.apply(this, [...args, ...next]);
  };
}
\`\`\`

## How It Works

- **\`fn.length\`** is the declared arity — the termination condition. Once accumulated args reach it, invoke; otherwise return a collector that concatenates and recurses.
- Multiple-args-per-call falls out naturally from \`...args\` + the \`>=\` comparison.
- \`this\` is forwarded — rarely probed, but correct.

## What Interviewers Check

- Knowing **\`fn.length\` gotchas**: default parameters and rest params don't count toward it (\`(a, b = 1) => ...\` has length 1) — so curry breaks on them, worth saying unprompted.
- No shared mutable state: each partial application builds a **new** args array; reusing one accumulator across branches is the subtle bug (\`const add1 = curried(1)\` used twice must work).
- Can explain *why* you'd curry: specializing functions, point-free pipelines — not just the trick.`,
    keyPoints: [
      "Termination on args.length >= fn.length, then fn.apply with all args",
      "Collector returns a NEW accumulated array — partials are reusable branches",
      "Multi-arg calls per step work via rest/spread naturally",
      "States fn.length gotchas unprompted (defaults/rest don't count)",
      "Can give a real use case beyond the interview trick",
    ],
    followUpQuestions: [
      "Support a placeholder (curry(fn)(_, 2)(1)).",
      "What breaks with variadic functions and how would you handle arity explicitly?",
    ],
    relatedTopics: ["currying", "closures", "functional-patterns"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.CODING_CHALLENGES,
    difficulty: "senior",
    question:
      "Implement retryWithBackoff(fn, { retries, baseDelay, maxDelay }): calls the async fn, retrying failures with exponential backoff + jitter. It resolves with the first success or rejects with the last error.",
    answer: `## Reference Implementation

\`\`\`js
async function retryWithBackoff(
  fn,
  { retries = 3, baseDelay = 250, maxDelay = 10_000 } = {},
) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastError = err;
      if (attempt === retries) break;
      const exp = Math.min(maxDelay, baseDelay * 2 ** attempt);
      const jitter = exp * (0.5 + Math.random() * 0.5); // 50-100% of exp
      await new Promise((r) => setTimeout(r, jitter));
    }
  }
  throw lastError;
}
\`\`\`

## What Interviewers Check

- **Total attempts = retries + 1** (the initial try isn't a "retry") — off-by-one heaven.
- **Exponential growth capped** by maxDelay, and **jitter** — and can explain *why* jitter: N clients failing together would otherwise retry in synchronized waves (thundering herd).
- **No delay after the final failure** — sleeping then throwing is wasted time.
- Rethrows the **last error**, not a generic one — callers need the real cause.
- Senior extras: abort support (AbortSignal), and only retrying *retryable* errors (5xx/network yes, 400 no) via a \`shouldRetry\` predicate.`,
    keyPoints: [
      "retries + 1 total attempts; no sleep after the last failure",
      "Delay = min(maxDelay, base * 2^attempt) with jitter",
      "Explains jitter: prevents synchronized retry waves (thundering herd)",
      "Rejects with the LAST real error, not a generic message",
      "Mentions AbortSignal and shouldRetry(err) filtering as production concerns",
    ],
    followUpQuestions: [
      "Add AbortSignal support that cancels mid-backoff.",
      "Which HTTP errors should never be retried, and why?",
    ],
    relatedTopics: ["async-patterns", "resilience", "backoff"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.CODING_CHALLENGES,
    difficulty: "mid",
    question:
      "Implement a useDebounce(value, delay) React hook that returns the debounced value, and explain how you'd use it for a search-as-you-type input.",
    answer: `## Reference Implementation

\`\`\`tsx
import { useEffect, useState } from "react";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id); // reset on change or unmount
  }, [value, delay]);

  return debounced;
}
\`\`\`

Usage:

\`\`\`tsx
const [query, setQuery] = useState("");
const debouncedQuery = useDebounce(query, 300);

useEffect(() => {
  if (debouncedQuery) search(debouncedQuery);
}, [debouncedQuery]);
\`\`\`

## What Interviewers Check

- **The cleanup IS the debounce**: every value change clears the previous timeout — no cleanup means every keystroke eventually fires.
- Input stays a **controlled component** on the raw value; only the *effectful* consumer uses the debounced one.
- The unmount case is free (same cleanup) — no leaked timers/setState-after-unmount.
- Distinguishes debouncing a **value** (this hook) from debouncing a **callback** (needs refs to stay stable across renders — a good follow-up).
- Knows the race remains: stale search *responses* still need handling (ignore-stale flag or AbortController) — debouncing requests ≠ ordering responses.`,
    keyPoints: [
      "Effect cleanup clears the prior timeout — that IS the debounce mechanism",
      "Raw value drives the controlled input; debounced value drives effects",
      "Unmount safety falls out of the same cleanup (no setState after unmount)",
      "Value-debounce vs callback-debounce distinction (refs for stable identity)",
      "Debouncing doesn't fix response races — AbortController/stale-flag still needed",
    ],
    followUpQuestions: [
      "Implement useDebouncedCallback — why is it trickier?",
      "How do you cancel the in-flight fetch when a new search fires?",
    ],
    relatedTopics: ["react-hooks", "useeffect-cleanup", "race-conditions"],
    source: "seed",
  },
];
