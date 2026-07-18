// ============================================================================
// TYPESCRIPT
// ============================================================================

import { CreateQuestionInput, QUESTION_CATEGORIES } from "@/types";

export const typescriptQuestions: CreateQuestionInput[] = [
  {
    category: QUESTION_CATEGORIES.TYPESCRIPT,
    difficulty: "junior",
    question:
      "type vs interface in TypeScript: what are the actual differences, and which do you default to?",
    answer: `## Where they overlap

For describing object shapes they're nearly interchangeable — both support optional/readonly properties, methods, generics, and both can be implemented by classes.

## Real differences

- **Interfaces merge; types don't.** Two \`interface Foo\` declarations combine (how libraries let you augment \`Window\` or theme objects). A duplicate \`type Foo\` is an error.
- **Types express more**: unions (\`type Status = "idle" | "loading"\`), tuples, mapped types, conditional types, primitives aliases. Interfaces only describe object/function/class shapes.
- **Extension syntax**: \`interface B extends A\` vs \`type B = A & { ... }\`. Interface \`extends\` errors on incompatible members; intersections silently produce \`never\` for clashing properties — extends gives better errors.
- Performance folklore: interfaces are marginally friendlier to the checker when extended repeatedly; irrelevant at most app scales.

## Practical default

Pick one convention and be consistent. A common one:

- \`interface\` for public object shapes / component props (mergeable, clear extends errors).
- \`type\` whenever you need unions, tuples, mapped/conditional types, or function types.

The honest senior answer: the distinction matters far less than people think — knowing **when merging matters** (declaration augmentation) is the part interviewers actually probe.`,
    keyPoints: [
      "Interfaces support declaration merging; types are unique",
      "Only type aliases express unions, tuples, mapped and conditional types",
      "extends gives clearer errors than intersections on conflicts",
      "Convention: interface for object shapes, type for everything else",
    ],
    followUpQuestions: [
      "When have you used declaration merging in practice?",
      "What happens when an intersection has conflicting property types?",
    ],
    relatedTopics: ["structural-typing", "declaration-merging", "generics"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.TYPESCRIPT,
    difficulty: "junior",
    question:
      "Explain any vs unknown vs never. Why is unknown the safe alternative to any?",
    answer: `## any — opt out of checking

\`any\` disables type checking in **both directions**: anything assigns to it, it assigns to anything, and every operation on it is allowed. It's contagious — one \`any\` flows through call chains silently. Errors surface at runtime instead of compile time.

## unknown — the safe "I don't know yet"

Anything assigns **to** \`unknown\`, but you can do **nothing with it** until you narrow it:

\`\`\`typescript
function handle(err: unknown) {
  // err.message ❌ — must narrow first
  if (err instanceof Error) console.error(err.message); // ✅
}

const data: unknown = await res.json();
const user = UserSchema.parse(data); // runtime validation → typed
\`\`\`

Use it for: \`catch\` clause errors, \`JSON.parse\`/API responses, and any boundary where data enters from outside — the compiler forces validation before use. That forcing function is exactly what \`any\` throws away.

## never — the impossible type

The type with **no values**: functions that always throw or loop forever return \`never\`; it's what remains after exhaustive narrowing. Its killer use is **exhaustiveness checking**:

\`\`\`typescript
switch (shape.kind) {
  case "circle": return ...;
  case "square": return ...;
  default:
    const _exhaustive: never = shape; // ❌ compile error if a variant was added
}
\`\`\`

Add a union member later and this line fails to compile — the compiler finds every switch you forgot to update.`,
    keyPoints: [
      "any disables checking both ways and spreads silently",
      "unknown accepts anything but forces narrowing before use",
      "Use unknown at boundaries: catch, JSON, API responses",
      "never = no possible values; enables exhaustiveness checks in switches",
    ],
    followUpQuestions: [
      "Why did TypeScript change catch variables to unknown by default?",
      "What's the difference between never and void?",
    ],
    relatedTopics: ["narrowing", "type-safety", "validation"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.TYPESCRIPT,
    difficulty: "mid",
    question:
      "How does type narrowing work in TypeScript? Cover typeof, instanceof, in, custom type guards, and discriminated unions.",
    answer: `## The idea

TypeScript's control-flow analysis **refines a union type** as your code eliminates possibilities — inside an \`if\` that rules types out, the variable has a narrower type.

## Built-in narrowing

\`\`\`typescript
function fmt(x: string | number | Date | null) {
  if (x === null) return "";              // null eliminated below
  if (typeof x === "string") return x;     // string
  if (x instanceof Date) return x.toISOString(); // Date
  return x.toFixed(2);                     // number — all that's left
}
\`\`\`

- \`typeof\` for primitives, \`instanceof\` for classes, \`"key" in obj\` for shape checks, truthiness/equality checks — all narrow. So does \`Array.isArray\`.

## Custom type guards

For shapes the built-ins can't distinguish, a **type predicate** teaches the compiler what a runtime check proves:

\`\`\`typescript
function isUser(v: unknown): v is User {
  return typeof v === "object" && v !== null && "email" in v;
}
if (isUser(data)) data.email; // typed as User
\`\`\`

The compiler trusts your predicate — a wrong guard is a hole, which is why zod-style schema validation (which generates correct guards) is popular at boundaries.

## Discriminated unions — the best narrowing

Give every union member a shared **literal tag**; switch on it and each branch narrows automatically:

\`\`\`typescript
type Result = { status: "ok"; data: User } | { status: "error"; message: string };
if (r.status === "ok") r.data; // narrowed — no casting anywhere
\`\`\`

This pattern is the backbone of typed reducers, API results, and state machines.`,
    keyPoints: [
      "Control-flow analysis narrows unions through checks",
      "typeof / instanceof / in / equality all narrow automatically",
      "Type predicates (v is T) encode custom runtime checks — compiler trusts them",
      "Discriminated unions with literal tags are the cleanest narrowing pattern",
    ],
    followUpQuestions: [
      "What can go wrong with an incorrect type predicate?",
      "How does narrowing interact with callbacks and closures?",
    ],
    relatedTopics: ["discriminated-unions", "control-flow", "zod"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.TYPESCRIPT,
    difficulty: "mid",
    question:
      "Generics with constraints: write a typed function like pluck or groupBy and explain extends and keyof.",
    answer: `## Why generics

Generics preserve the **relationship** between input and output types instead of collapsing to \`any\` or \`unknown\` — \`identity<T>(x: T): T\` remembers what went in.

## keyof + extends: the workhorse combo

\`\`\`typescript
function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {
  return items.map((item) => item[key]);
}

const users = [{ id: 1, name: "Ada" }, { id: 2, name: "Lin" }];
pluck(users, "name"); // string[] — inferred
pluck(users, "email"); // ❌ compile error — not a key of the element type
\`\`\`

- \`K extends keyof T\` **constrains** K to actual keys — this is what makes the wrong key a compile error.
- \`T[K]\` is an **indexed access type** — "the type of that property" — so the return type tracks which key you passed.
- Both T and K are **inferred from arguments**; callers never write the type parameters.

## A step up: groupBy

\`\`\`typescript
function groupBy<T, K extends PropertyKey>(
  items: T[],
  getKey: (item: T) => K
): Record<K, T[]> {
  return items.reduce((acc, item) => {
    (acc[getKey(item)] ??= []).push(item);
    return acc;
  }, {} as Record<K, T[]>);
}
\`\`\`

## Guidance

Constrain only as much as the body requires (\`T extends { id: string }\` if you read \`.id\`); avoid \`<T = any>\` defaults that mask inference failures; and if a generic parameter is used exactly once in the signature, you probably don't need it.`,
    keyPoints: [
      "Generics preserve input→output type relationships",
      "K extends keyof T turns wrong keys into compile errors",
      "Indexed access T[K] makes return types track arguments",
      "Type parameters are inferred; constrain only what the body needs",
    ],
    followUpQuestions: [
      "When does TypeScript fail to infer a type parameter?",
      "How would you type a function that accepts either an array or a single item?",
    ],
    relatedTopics: ["keyof", "indexed-access-types", "inference"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.TYPESCRIPT,
    difficulty: "mid",
    question:
      "Explain the common utility types (Partial, Pick, Omit, Record, ReturnType) and how mapped types make them work.",
    answer: `## The everyday five

\`\`\`typescript
Partial<User>            // all properties optional — update payloads
Pick<User, "id" | "name"> // subset — DTOs, component props
Omit<User, "password">    // everything except — sanitized outputs
Record<string, number>    // key/value maps — Record<CategoryId, Question[]>
ReturnType<typeof fn>     // extract a function's return type — deriving types from code
\`\`\`

Also worth knowing: \`Required\`, \`Readonly\`, \`Exclude\`/\`Extract\` (filter union members), \`Awaited\` (unwrap promises), \`Parameters\`.

## How they work: mapped types

A mapped type iterates the keys of another type:

\`\`\`typescript
type Partial<T> = { [K in keyof T]?: T[K] };   // add the ? modifier
type Readonly<T> = { readonly [K in keyof T]: T[K] };
type Pick<T, K extends keyof T> = { [P in K]: T[P] };
\`\`\`

Modifiers can also be **removed**: \`-?\` (Required), \`-readonly\`. \`Omit\` composes: \`Pick<T, Exclude<keyof T, K>>\`.

## Building your own

\`\`\`typescript
// Make selected keys optional, keep the rest required
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type CreateUser = PartialBy<User, "id" | "createdAt">;
\`\`\`

The interview signal isn't memorizing the list — it's **deriving types from a single source of truth** (Pick/Omit/ReturnType from one canonical type) instead of hand-writing near-duplicate interfaces that drift apart.`,
    keyPoints: [
      "Partial/Pick/Omit/Record/ReturnType cover most daily needs",
      "They're built on mapped types: [K in keyof T] with +/- modifiers",
      "Compose them: Omit = Pick + Exclude; PartialBy = Omit & Partial<Pick>",
      "Goal: derive variants from one source-of-truth type; don't duplicate shapes",
    ],
    followUpQuestions: [
      "How would you write a DeepPartial? What are its edge cases?",
      "What do template literal types add to mapped types?",
    ],
    relatedTopics: ["mapped-types", "keyof", "conditional-types"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.TYPESCRIPT,
    difficulty: "senior",
    question:
      "Model an async operation's state with a discriminated union. Why is it better than independent isLoading/error/data flags?",
    answer: `## The boolean-flags problem

\`\`\`typescript
// ❌ 2³ = 8 representable combinations; ~4 are meaningful
interface State { isLoading: boolean; error: Error | null; data: User | null; }
\`\`\`

Nothing stops \`isLoading && data && error\` simultaneously. Every consumer must remember the precedence rules ("check error before data…"), \`data\` is nullable **everywhere** even after you checked \`!isLoading && !error\`, and forgotten combinations become UI bugs (spinner+stale data, error+stale data).

## Make illegal states unrepresentable

\`\`\`typescript
type QueryState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }        // data exists ONLY here
  | { status: "error"; error: Error };    // error exists ONLY here

switch (state.status) {
  case "loading": return <Spinner />;
  case "error":   return <ErrorView error={state.error} />; // typed, non-null
  case "success": return <Profile user={state.data} />;      // typed, non-null
  case "idle":    return null;
  default: {
    const _x: never = state; return _x; // exhaustiveness — new states can't be forgotten
  }
}
\`\`\`

- Narrowing on the \`status\` tag makes \`data\`/\`error\` **non-nullable exactly where they're valid** — no \`!\`, no defensive checks.
- The \`never\` default makes adding a state (say \`"refreshing"\`) a **compile error** at every unhandled switch.

## Where this shows up

Reducer actions, API result types (\`{ok: true, data} | {ok: false, error}\` — this app's server actions use exactly this), form states, and state machines (XState formalizes it). The principle to say out loud: **make illegal states unrepresentable** — move invariants from runtime discipline into the type system.`,
    keyPoints: [
      "Independent flags allow impossible combinations (loading+error+data)",
      "Tagged unions make data/error exist only in their valid states",
      "Switch + never default = compiler finds every unhandled new state",
      "Principle: make illegal states unrepresentable",
    ],
    followUpQuestions: [
      "How would you extend this to include background refetching?",
      "How do reducers benefit from discriminated union actions?",
    ],
    relatedTopics: ["narrowing", "state-machines", "reducers"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.TYPESCRIPT,
    difficulty: "senior",
    question:
      "Explain as const, const assertions, and the satisfies operator. What inference problems do they solve?",
    answer: `## The problem: TypeScript widens

\`\`\`typescript
let method = "GET";        // inferred string, not "GET"
const config = { retries: 3, mode: "cors" }; // mode: string
\`\`\`

Literal values widen to their base types, which then fail where literal types are required (\`fetch\` modes, discriminant tags, action types).

## as const

Freezes the value's type to its **narrowest literal form**, deeply, with readonly:

\`\`\`typescript
const ROUTES = ["/home", "/about"] as const;
// readonly ["/home", "/about"] — element type is a union of literals
type Route = (typeof ROUTES)[number]; // "/home" | "/about"

const COLORS = { primary: "#0af", danger: "#f43" } as const;
type ColorName = keyof typeof COLORS; // "primary" | "danger"
\`\`\`

This "const object + derived types" pattern replaces enums for many teams (this codebase's \`QUESTION_CATEGORIES\` does exactly this) — single runtime source of truth, types derived from it.

## satisfies — validate without widening OR narrowing away

\`as const\` alone doesn't check the shape; an annotation (\`: Config\`) checks but **widens** the inferred type to Config. \`satisfies\` does both jobs:

\`\`\`typescript
const config = {
  endpoint: "/api",
  retries: 3,
} satisfies Config;   // ✅ checked against Config
config.retries.toFixed(); // ✅ still knows retries is number (not number | string)

const palette = { primary: [0, 170, 255], danger: "#f43" } satisfies Record<string, string | number[]>;
palette.primary.map(...) // ✅ knows primary is number[] — an annotation would have lost this
\`\`\`

Rule of thumb: **annotation** for public APIs, **satisfies** for config objects where you want checking plus precise inference, **as const** for literal unions and lookup tables.`,
    keyPoints: [
      "TS widens literals by default; as const keeps narrow readonly literal types",
      "const objects + keyof/typeof derive types from runtime values (enum alternative)",
      "satisfies checks conformance while preserving inferred precision",
      "Annotations widen; satisfies doesn't — use it for typed config objects",
    ],
    followUpQuestions: [
      "Why do many teams prefer const objects over TypeScript enums?",
      "When would an explicit annotation still be better than satisfies?",
    ],
    relatedTopics: ["inference", "literal-types", "enums"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.TYPESCRIPT,
    difficulty: "mid",
    question:
      "Typing React components: props with children, event handlers, useRef, useState, and generic components.",
    answer: `## Props

\`\`\`tsx
interface ButtonProps {
  variant?: "primary" | "ghost";          // literal unions > booleans for variants
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;               // anything renderable
}
function Button({ variant = "primary", ...rest }: ButtonProps) { ... }
\`\`\`

- \`ReactNode\` for children (elements, strings, numbers, null); \`ReactElement\` only when you require an actual element.
- Extending native elements: \`interface Props extends React.ComponentPropsWithoutRef<"button"> { variant?: ... }\` — forwards all button attributes without listing them.
- \`React.FC\` is optional and mildly discouraged — plain typed functions infer better.

## Hooks

\`\`\`tsx
const [user, setUser] = useState<User | null>(null); // explicit when initial value doesn't tell the whole story
const inputRef = useRef<HTMLInputElement>(null);      // DOM ref — readonly .current, starts null
const timerRef = useRef<number | undefined>(undefined); // mutable value ref
\`\`\`

Event types read as \`React.ChangeEvent<HTMLInputElement>\`, \`React.FormEvent<HTMLFormElement>\` — or hover the inline handler and let inference tell you.

## Generic components

For components parameterized by their data:

\`\`\`tsx
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyOf: (item: T) => string;
}
function List<T>({ items, renderItem, keyOf }: ListProps<T>) {
  return <ul>{items.map((it) => <li key={keyOf(it)}>{renderItem(it)}</li>)}</ul>;
}
// <List items={users} renderItem={(u) => u.name} ... /> — u is inferred as User
\`\`\`

The callback parameter being correctly inferred from \`items\` is the payoff interviewers look for.`,
    keyPoints: [
      "ReactNode for children; ComponentPropsWithoutRef to extend native elements",
      "useState<T | null> when the initial value underdetermines the type",
      "useRef<HTMLElement>(null) for DOM; mutable refs typed with undefined",
      "Generic components infer T from data and type their render callbacks",
    ],
    followUpQuestions: [
      "How do you type a forwardRef component?",
      "How would you type a polymorphic `as` prop?",
    ],
    relatedTopics: ["generics", "react-props", "inference"],
    source: "seed",
  },
];
