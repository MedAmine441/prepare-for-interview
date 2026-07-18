// ============================================================================
// JAVASCRIPT FUNDAMENTALS
// ============================================================================

import { CreateQuestionInput, QUESTION_CATEGORIES } from "@/types";

export const jsFundamentalsQuestions: CreateQuestionInput[] = [
  {
    category: QUESTION_CATEGORIES.JS_FUNDAMENTALS,
    difficulty: "junior",
    question:
      "What is a closure in JavaScript? Give a practical example of where you'd use one.",
    answer: `## Definition

A closure is a function that retains access to variables from the scope where it was **defined**, even after that outer scope has finished executing. The function "closes over" those variables.

\`\`\`javascript
function createCounter() {
  let count = 0; // private — only reachable through the returned functions
  return {
    increment: () => ++count,
    current: () => count,
  };
}
const counter = createCounter();
counter.increment(); // 1
count; // ReferenceError — truly private
\`\`\`

## Practical uses

- **Data privacy / encapsulation** — the counter above; no one can mutate \`count\` directly.
- **Function factories** — \`const add5 = makeAdder(5)\` bakes configuration into a function.
- **Callbacks and event handlers** — a handler remembers the variables it needs from when it was created.
- **Memoization, debounce, throttle** — the cache or timer id lives in the closure between calls.

## The classic gotcha

\`\`\`javascript
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i)); // 3, 3, 3 — one shared i
}
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i)); // 0, 1, 2 — new binding per iteration
}
\`\`\`

With \`var\` there is a single function-scoped \`i\` that all three callbacks share; \`let\` creates a fresh binding per loop iteration.`,
    keyPoints: [
      "A function bundled with its lexical (definition-time) scope",
      "Variables stay alive as long as a function references them",
      "Enables data privacy, factories, memoization, debounce",
      "var-in-loop gotcha: one shared variable vs let's per-iteration binding",
    ],
    followUpQuestions: [
      "Can closures cause memory leaks? How?",
      "How would you implement a once() function using a closure?",
      "What's the difference between lexical scope and dynamic scope?",
    ],
    relatedTopics: ["scope", "hoisting", "memory-management", "higher-order-functions"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.JS_FUNDAMENTALS,
    difficulty: "junior",
    question:
      "Explain the differences between var, let, and const — including hoisting and the Temporal Dead Zone.",
    answer: `## Scope

- \`var\` is **function-scoped** — it ignores block boundaries like \`if\` and \`for\`.
- \`let\` and \`const\` are **block-scoped** — they exist only inside the nearest \`{ }\`.

## Hoisting

All three are hoisted (the engine registers them before executing the code), but they behave differently:

- \`var\` is initialized to \`undefined\` at the top of the function — reading it early gives \`undefined\`.
- \`let\`/\`const\` are hoisted but **uninitialized** — reading them before their declaration line throws a \`ReferenceError\`. The region between scope start and the declaration is the **Temporal Dead Zone (TDZ)**.

\`\`\`javascript
console.log(a); // undefined
console.log(b); // ReferenceError (TDZ)
var a = 1;
let b = 2;
\`\`\`

## Reassignment vs mutation

- \`const\` prevents **reassignment of the binding**, not mutation of the value: \`const arr = []; arr.push(1)\` is legal; \`arr = []\` is not.
- Default to \`const\`, use \`let\` when reassignment is needed, avoid \`var\` in modern code.

## Globals

Top-level \`var\` becomes a property of \`window\`/\`globalThis\`; \`let\`/\`const\` do not.`,
    keyPoints: [
      "var = function-scoped; let/const = block-scoped",
      "All are hoisted; let/const throw in the TDZ, var reads as undefined",
      "const prevents reassignment, not mutation of objects/arrays",
      "Default to const, then let; avoid var in modern code",
    ],
    followUpQuestions: [
      "Why does the for-loop closure bug happen with var but not let?",
      "How do you make an object truly immutable?",
    ],
    relatedTopics: ["hoisting", "scope", "closures"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.JS_FUNDAMENTALS,
    difficulty: "mid",
    question:
      "How does `this` get its value in JavaScript? Walk through the binding rules and common bugs.",
    answer: `## The four binding rules (in precedence order)

1. **new binding** — \`new Foo()\`: \`this\` is the freshly created object.
2. **Explicit binding** — \`fn.call(obj)\`, \`fn.apply(obj)\`, \`fn.bind(obj)\`: \`this\` is \`obj\`.
3. **Implicit binding** — \`obj.method()\`: \`this\` is the object left of the dot **at call time**.
4. **Default binding** — plain \`fn()\`: \`undefined\` in strict mode, \`globalThis\` in sloppy mode.

## Arrow functions

Arrow functions don't have their own \`this\` — they capture it **lexically** from the enclosing scope at definition time, and \`call\`/\`bind\` cannot change it. That's why they're ideal for callbacks inside methods, and wrong as object methods:

\`\`\`javascript
const user = {
  name: "Sam",
  greet: () => console.log(this.name), // undefined — this is the outer scope
  greetOk() { console.log(this.name); }, // "Sam"
};
\`\`\`

## Common bugs

\`\`\`javascript
const { greetOk } = user;
greetOk(); // undefined — the method lost its receiver (implicit binding is call-site based)

setTimeout(user.greetOk, 0); // same bug — passed as a bare function
setTimeout(() => user.greetOk(), 0); // fix: keep the call site intact
\`\`\`

In React class components this was the reason for \`this.handleClick = this.handleClick.bind(this)\`; hooks made most of it moot.`,
    keyPoints: [
      "Precedence: new > explicit (call/apply/bind) > implicit (obj.method) > default",
      "this is determined by the call site, not where the function is defined",
      "Arrow functions capture this lexically and can't be rebound",
      "Detached methods (const {m} = obj; m()) lose their receiver",
    ],
    followUpQuestions: [
      "What does bind return, and can you bind twice?",
      "How does this behave inside a class field arrow function?",
    ],
    relatedTopics: ["closures", "prototypes", "classes"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.JS_FUNDAMENTALS,
    difficulty: "mid",
    question:
      "Explain prototypal inheritance. What actually happens when you access a property on an object?",
    answer: `## The prototype chain

Every object has an internal link (\`[[Prototype]]\`, exposed via \`Object.getPrototypeOf\`) to another object. Property access walks this chain:

1. Look on the object itself.
2. Not found? Look on its prototype, then the prototype's prototype…
3. Chain ends at \`Object.prototype\` → \`null\`; if still not found, the result is \`undefined\`.

**Writes don't walk the chain** — \`obj.x = 1\` creates an own property on \`obj\`, shadowing any inherited \`x\`.

## Constructors and class sugar

\`\`\`javascript
function Dog(name) { this.name = name; }
Dog.prototype.bark = function () { return \`\${this.name}!\`; };

const rex = new Dog("Rex");
// rex → Dog.prototype → Object.prototype → null
rex.bark(); // found on Dog.prototype, called with this = rex
\`\`\`

\`class\` is syntax over this same mechanism — methods go on \`ClassName.prototype\`, \`extends\` wires up the chain, and \`super\` calls up it. There is one \`bark\` function shared by all dogs, which is the memory benefit over putting methods in the constructor.

## Useful APIs

- \`Object.create(proto)\` — create with an explicit prototype (including \`null\` for "dictionary" objects).
- \`Object.hasOwn(obj, key)\` — own property check (vs \`in\`, which walks the chain).`,
    keyPoints: [
      "Property reads walk the [[Prototype]] chain until found or null",
      "Writes create own properties and shadow inherited ones",
      "class/extends is sugar over constructor functions + prototype objects",
      "Methods on the prototype are shared once across all instances",
    ],
    followUpQuestions: [
      "What's the difference between __proto__ and prototype?",
      "When would you use Object.create(null)?",
      "How does instanceof work under the hood?",
    ],
    relatedTopics: ["classes", "this-binding", "object-model"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.JS_FUNDAMENTALS,
    difficulty: "junior",
    question:
      "What's the difference between == and ===? When does coercion bite, and is == ever acceptable?",
    answer: `## Strict vs loose

- \`===\` compares **without coercion**: different types are simply not equal. (One quirk: \`NaN === NaN\` is false — use \`Number.isNaN\` or \`Object.is\`.)
- \`==\` applies the **abstract equality algorithm**: operands of different types are converted before comparing.

## The coercion rules that matter

- \`null == undefined\` → true (and they equal nothing else).
- String vs number → string is converted to number: \`"5" == 5\` → true.
- Boolean vs anything → boolean converts to number first: \`true == "1"\` → true.
- Object vs primitive → object is converted via \`valueOf\`/\`toString\`: \`[1] == 1\` → true.

## Classic traps

\`\`\`javascript
"" == 0        // true
"0" == 0       // true
"" == "0"      // false  — no transitivity!
[] == false    // true   ([] → "" → 0)
null == 0      // false  (null only equals undefined)
\`\`\`

## Practical guidance

Use \`===\` everywhere. The one idiomatic exception some teams allow is \`value == null\` as a deliberate shorthand for "null **or** undefined". Truthiness checks (\`if (value)\`) are separate — remember \`0\`, \`""\`, \`NaN\`, \`null\`, \`undefined\`, and \`false\` are all falsy.`,
    keyPoints: [
      "=== never coerces; == converts types before comparing",
      "null == undefined is true; they equal nothing else",
      "Strings/booleans/objects coerce to numbers or primitives in ==",
      "Use === always; value == null is the only common idiom",
      "NaN is not equal to itself — use Number.isNaN",
    ],
    followUpQuestions: [
      "What does Object.is do differently from ===?",
      "How does coercion work with the + operator vs the - operator?",
    ],
    relatedTopics: ["type-coercion", "truthiness", "primitives"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.JS_FUNDAMENTALS,
    difficulty: "mid",
    question:
      "Implement debounce and throttle. What's the difference, and when do you use each?",
    answer: `## The difference

- **Debounce** — collapse a burst of calls into one call **after the burst goes quiet** for N ms. "Do it after they stop."
- **Throttle** — guarantee at most one call **per N ms window** during a continuous stream. "Do it at a steady rate."

## Debounce

\`\`\`javascript
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
\`\`\`

Every call cancels the previous timer; only the last call in the burst fires. The timer id lives in the closure.

## Throttle (leading edge)

\`\`\`javascript
function throttle(fn, interval) {
  let last = 0;
  return function (...args) {
    const now = Date.now();
    if (now - last >= interval) {
      last = now;
      fn.apply(this, args);
    }
  };
}
\`\`\`

Production versions (lodash) add trailing-edge calls, \`cancel()\`, and \`flush()\`.

## When to use which

- Debounce: **search-as-you-type**, form validation, resize-finished layout, autosave.
- Throttle: **scroll/mousemove handlers**, drag position updates, analytics pings — you want intermediate updates, just not 60/sec.

Interview signal: mention preserving \`this\` and arguments, and cleanup (clearing the timer on component unmount).`,
    keyPoints: [
      "Debounce fires once after calls stop; throttle fires at most once per interval",
      "Both store state (timer / last-run) in a closure",
      "Debounce: search input, autosave; throttle: scroll, mousemove",
      "Real implementations preserve this/args and offer cancel/flush",
    ],
    followUpQuestions: [
      "How would you add a leading option to debounce?",
      "How do you debounce inside a React component correctly?",
    ],
    relatedTopics: ["closures", "event-handling", "performance"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.JS_FUNDAMENTALS,
    difficulty: "mid",
    question:
      "Compare Promise combinators: all, allSettled, race, and any. How does error handling differ between .then/.catch and async/await?",
    answer: `## The four combinators

| Combinator | Resolves when | Rejects when |
|---|---|---|
| \`Promise.all\` | **all** fulfill (array of values) | **any one** rejects (fail-fast) |
| \`Promise.allSettled\` | always — array of \`{status, value/reason}\` | never |
| \`Promise.race\` | first to **settle** (fulfill or reject) | first settle is a rejection |
| \`Promise.any\` | first to **fulfill** | all reject (\`AggregateError\`) |

Pick by intent: \`all\` for "I need everything", \`allSettled\` for "do everything, report each result", \`race\` for timeouts, \`any\` for "first successful source wins".

## Error handling styles

\`\`\`javascript
// then/catch — .catch handles errors from the whole chain above it
fetchUser()
  .then((u) => fetchPosts(u.id))
  .catch(handleError); // catches either step

// async/await — synchronous-looking try/catch
try {
  const user = await fetchUser();
  const posts = await fetchPosts(user.id);
} catch (err) {
  handleError(err); // same coverage, clearer flow
}
\`\`\`

## Common pitfalls

- **Sequential awaits** for independent work: \`await a(); await b();\` — use \`Promise.all([a(), b()])\` to run them concurrently.
- **Forgotten await**: \`try { return fetchData(); }\` — the promise escapes the try; the catch never fires. \`return await\` inside try is meaningful.
- Unhandled rejections: a fire-and-forget promise with no catch crashes Node and logs errors in browsers.`,
    keyPoints: [
      "all = fail-fast everything; allSettled = report all; race = first settle; any = first success",
      "async/await is sugar over promises — try/catch replaces .catch",
      "Run independent work concurrently with Promise.all, not sequential awaits",
      "return await matters inside try blocks; forgotten awaits skip the catch",
    ],
    followUpQuestions: [
      "How would you implement a timeout wrapper with Promise.race?",
      "What happens to the other promises when Promise.all rejects?",
    ],
    relatedTopics: ["event-loop", "async-await", "error-handling"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.JS_FUNDAMENTALS,
    difficulty: "mid",
    question:
      "Shallow vs deep copy: how do you clone objects in JavaScript, and what are the pitfalls of each approach?",
    answer: `## Shallow copy

Copies one level; nested objects are still **shared references**.

\`\`\`javascript
const copy = { ...original };          // spread
const arr2 = original.slice();          // arrays
copy.nested.value = 1;                  // ⚠ also mutates original.nested
\`\`\`

Fine when the object is flat, or when you're doing immutable updates and replacing the nested path explicitly (the Redux/React pattern):

\`\`\`javascript
const next = { ...state, user: { ...state.user, name: "Sam" } };
\`\`\`

## Deep copy options

- **\`structuredClone(obj)\`** — the modern built-in. Handles nesting, Dates, Maps, Sets, RegExp, ArrayBuffers, and **circular references**. Throws on functions and DOM nodes.
- **\`JSON.parse(JSON.stringify(obj))\`** — the legacy hack. Silently **drops** \`undefined\`, functions, and symbols; converts Dates to strings; loses Map/Set; throws on circular references. Avoid it in new code.
- **Library clone** (lodash \`cloneDeep\`) — when you must clone functions-carrying structures or support very old runtimes.

## Interview framing

State *why* copies matter in frontend work: React change detection compares references, so mutation hides updates; immutable updates with shallow copies at each changed level are usually cheaper and sufficient — reach for deep clone rarely and deliberately.`,
    keyPoints: [
      "Spread/slice are shallow — nested objects stay shared",
      "structuredClone is the modern deep copy (handles cycles, Dates, Maps)",
      "JSON round-trip drops undefined/functions, mangles Dates, breaks on cycles",
      "React prefers immutable updates over deep cloning — copy only changed levels",
    ],
    followUpQuestions: [
      "Why does React rely on reference equality instead of deep equality?",
      "What can structuredClone not copy?",
    ],
    relatedTopics: ["immutability", "references", "react-state"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.JS_FUNDAMENTALS,
    difficulty: "senior",
    question:
      "Compare ES Modules and CommonJS. Why does the difference matter for bundlers and for the dual-package ecosystem?",
    answer: `## Core differences

| | CommonJS (require) | ES Modules (import) |
|---|---|---|
| Loading | synchronous, at runtime | parsed statically, async-capable |
| Structure | \`require()\` can be conditional, computed | imports are top-level, static strings |
| Exports | copy of a value at require time | **live bindings** to the source |
| Where | Node's original system | the language standard, browsers + Node |

## Why static structure matters

Because ESM imports are known **without executing the code**, bundlers can:

- **Tree shake** — prove an export is unused and drop it. CJS's dynamic \`require\` defeats this analysis, which is why CJS-only libraries bloat bundles.
- Analyze the full graph for code splitting and circular-dependency handling.

**Live bindings**: ESM exports a *binding*, not a value — if the source module reassigns an exported \`let\`, importers see the new value. CJS consumers got a snapshot copy.

## Dual-package reality

Libraries ship both via \`package.json\` \`"exports"\` conditions:

\`\`\`json
{ "exports": { ".": { "import": "./dist/index.mjs", "require": "./dist/index.cjs" } } }
\`\`\`

Pitfalls worth naming: the **dual-package hazard** (same library loaded twice as CJS and ESM → two copies of internal state, broken \`instanceof\`), default-export interop weirdness (\`module.exports\` vs \`export default\`), and that ESM in Node requires either \`.mjs\` or \`"type": "module"\`.`,
    keyPoints: [
      "CJS is dynamic/synchronous; ESM is static and analyzable",
      "Static imports enable tree shaking and bundle-graph analysis",
      "ESM exports are live bindings; CJS exports are value copies",
      "Dual-package hazard: one library loaded as both formats = two instances",
    ],
    followUpQuestions: [
      "How does dynamic import() fit into ESM's static model?",
      "What does sideEffects: false in package.json tell a bundler?",
    ],
    relatedTopics: ["tree-shaking", "bundlers", "node-resolution"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.JS_FUNDAMENTALS,
    difficulty: "senior",
    question:
      "What are iterators and generators? Show how they power for...of, spread, and async iteration.",
    answer: `## The iteration protocol

An **iterable** is any object with a \`[Symbol.iterator]()\` method returning an **iterator** — an object whose \`next()\` returns \`{ value, done }\`. Arrays, strings, Maps, Sets are built-in iterables. \`for...of\`, spread \`[...x]\`, and destructuring all consume this protocol — implement it and your custom object works with all of them.

## Generators: iterators without the boilerplate

\`\`\`javascript
function* range(start, end, step = 1) {
  for (let i = start; i < end; i += step) yield i;
}
[...range(0, 10, 3)]; // [0, 3, 6, 9]
\`\`\`

A generator function pauses at each \`yield\` and resumes on the next \`next()\` call — its local state is preserved between resumptions. This gives you **lazy sequences**: values are computed on demand, so infinite sequences are fine as long as the consumer stops.

\`yield*\` delegates to another iterable; \`gen.next(value)\` sends data *into* the paused generator (the basis of pre-async/await coroutine libraries like co).

## Async iteration

\`\`\`javascript
async function* paginate(url) {
  while (url) {
    const page = await (await fetch(url)).json();
    yield* page.items;
    url = page.nextUrl;
  }
}
for await (const item of paginate("/api/items")) { /* streams pages lazily */ }
\`\`\`

\`for await...of\` consumes async iterables — ideal for pagination, streams (Node Readables are async iterable), and websocket message loops.`,
    keyPoints: [
      "Iterable = [Symbol.iterator] returning next() with {value, done}",
      "for...of, spread, destructuring all consume the same protocol",
      "Generators pause at yield, keep state, enable lazy/infinite sequences",
      "Async generators + for await...of model pagination and streams cleanly",
    ],
    followUpQuestions: [
      "How did generators + promises emulate async/await before it existed?",
      "What happens when you break out of a for...of loop mid-iteration?",
    ],
    relatedTopics: ["event-loop", "streams", "lazy-evaluation"],
    source: "seed",
  },
];
