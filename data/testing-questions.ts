// ============================================================================
// TESTING & QUALITY
// ============================================================================

import { CreateQuestionInput, QUESTION_CATEGORIES } from "@/types";

export const testingQuestions: CreateQuestionInput[] = [
  {
    category: QUESTION_CATEGORIES.TESTING,
    difficulty: "junior",
    question:
      "What makes a good unit test? Walk me through the properties you aim for.",
    answer: `## The Shape of a Good Test

A good unit test verifies **one behavior** through the public API, and its name tells you what broke when it fails.

## Properties (FIRST)

- **Fast** — milliseconds, so the suite runs on every save.
- **Isolated** — no shared state with other tests; order must not matter.
- **Repeatable** — same result on every machine; no real network, clock, or randomness.
- **Self-validating** — passes or fails without a human reading output.
- **Timely** — written with the code, while the behavior is fresh.

## Structure: Arrange–Act–Assert

\`\`\`ts
test("applies the discount above the threshold", () => {
  const cart = buildCart({ subtotal: 120 });   // Arrange
  const total = checkout(cart);                // Act
  expect(total).toBe(108);                     // Assert — one behavior
});
\`\`\`

## What Interviewers Probe

- Testing **behavior, not implementation**: asserting on outputs and observable effects, not internal calls — so refactors don't break green tests.
- One logical assertion per test (multiple \`expect\`s are fine if they verify the same behavior).
- Descriptive names: \`"rejects expired tokens"\` beats \`"test auth 3"\`.`,
    keyPoints: [
      "One behavior per test, exercised through the public API — not internals",
      "FIRST: fast, isolated, repeatable, self-validating, timely",
      "Arrange–Act–Assert structure with a name that identifies what broke",
      "Test behavior, not implementation — refactors shouldn't break green tests",
      "No real network, clock, or randomness — determinism is non-negotiable",
    ],
    followUpQuestions: [
      "When is it OK to test a private function directly?",
      "How many assertions per test is too many?",
      "How do you test code that depends on the current date?",
    ],
    relatedTopics: ["unit-testing", "test-design", "jest"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.TESTING,
    difficulty: "mid",
    question:
      "How do you decide what to test at which level — unit, integration, or end-to-end?",
    answer: `## The Model: Pyramid vs Trophy

The classic **pyramid** says many unit tests, fewer integration, few E2E — optimizing for speed. Frontend practice shifted toward the **testing trophy** (Kent C. Dodds): the bulk goes to **integration** tests, because most frontend bugs live in the wiring — components + state + fetching together — not in isolated functions.

## A Practical Split

- **Unit**: pure logic with real branching — date math, parsers, reducers, validation. Cheap, exhaustive edge cases.
- **Integration** (the bulk): render a feature with React Testing Library + mock the network at the boundary (MSW). "User fills the form, submits, sees the success state."
- **E2E** (a handful): the money paths only — signup, checkout, login — against a real browser and real backend. Expensive and slower, so every one must earn its place.
- **Static** (the base): TypeScript and lint catch a whole bug class for free.

## The Deciding Question

"What breaks the user?" Test the confidence-per-second: an integration test that proves the form works beats ten unit tests proving each handler exists.

## Anti-Patterns

- 100% unit coverage on components while nothing tests them together.
- E2E suites re-testing every validation branch already covered below.`,
    keyPoints: [
      "Frontend reality favors the testing trophy: the bulk is integration tests",
      "Unit tests for pure branching logic: parsers, reducers, date math, validation",
      "Integration: render the feature, mock the network at the boundary (MSW), assert user outcomes",
      "E2E only for money paths (login, checkout) — each one must earn its cost",
      "Decide by confidence-per-second: what actually breaks the user?",
    ],
    followUpQuestions: [
      "Where do visual regression tests fit in this model?",
      "How would you introduce tests to a codebase that has none?",
      "What's your take on snapshot tests?",
    ],
    relatedTopics: ["testing-trophy", "integration-testing", "test-strategy"],
    source: "seed",
    commonAt: ["Most product companies"],
  },
  {
    category: QUESTION_CATEGORIES.TESTING,
    difficulty: "mid",
    question:
      "Explain React Testing Library's philosophy. How does it change the way you write component tests?",
    answer: `## The Guiding Principle

> "The more your tests resemble the way your software is used, the more confidence they can give you."

RTL renders real DOM and makes you interact the way a user (or screen reader) would. There's deliberately **no access to state, props, or instances** — if the user can't see it, your test shouldn't either.

## What That Looks Like

\`\`\`tsx
render(<LoginForm />);
await userEvent.type(screen.getByLabelText(/email/i), "a@b.co");
await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
expect(await screen.findByText(/welcome/i)).toBeInTheDocument();
\`\`\`

- **Query priority**: \`getByRole\` > \`getByLabelText\` > \`getByText\` > ... > \`getByTestId\` (last resort). The order is an accessibility audit in disguise — if you can't find it by role, users of assistive tech can't either.
- **userEvent over fireEvent**: full event sequences (hover, focus, keydown) like a real browser.
- \`getBy\` throws now, \`findBy\` awaits appearance, \`queryBy\` asserts absence.

## The Payoff

Refactors (renaming state, splitting components, swapping hooks for reducers) keep tests green as long as behavior holds — the tests document behavior instead of freezing implementation.`,
    keyPoints: [
      "Test what the user experiences: real DOM, no access to state/props/internals",
      "Query priority is an a11y audit: getByRole first, getByTestId last resort",
      "userEvent simulates full interaction sequences; fireEvent is a low-level escape hatch",
      "getBy throws / findBy awaits async appearance / queryBy asserts absence",
      "Behavior-coupled tests survive refactors; implementation-coupled ones break on rename",
    ],
    followUpQuestions: [
      "When would you reach for getByTestId?",
      "How do you test a component that uses context or a router?",
      "What does wrapping in act() actually do, and when do you need it manually?",
    ],
    relatedTopics: ["react-testing-library", "user-event", "accessible-queries"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.TESTING,
    difficulty: "mid",
    question:
      "What's your mocking strategy? Compare jest.mock, spies, and network-level mocking like MSW.",
    answer: `## The Rule

Mock at the **boundary you don't own**, keep everything inside real. Every mock is a place your test can lie to you.

## The Tools

- **\`jest.mock('module')\`** — replaces a whole module. Right for hard boundaries: analytics SDKs, payment libraries, \`next/router\`. Wrong for your own modules — mocking those couples the test to file structure.
- **Spies (\`jest.spyOn\`)** — wrap a real method, observe calls, optionally stub, restore after. Good for "was analytics.track called with X?" assertions.
- **MSW (Mock Service Worker)** — intercepts \`fetch\`/XHR at the network layer. The whole app runs real: components, hooks, caching, serialization. One handler set serves tests, Storybook, and local dev.

\`\`\`ts
server.use(
  http.get("/api/user", () => HttpResponse.json({ name: "Ada" }))
);
\`\`\`

## Why Network-Level Wins for Frontend

Mocking \`useUserQuery\` skips your cache config, error mapping, and retries — the code most likely to be wrong. MSW exercises all of it and survives refactoring from axios to fetch to React Query.

## Smells

- Mocks re-implementing real logic ("mock drift" — test passes, prod fails).
- Mocking your own utils to "isolate" a component.
- Asserting mock call counts when you could assert visible outcomes.`,
    keyPoints: [
      "Mock at boundaries you don't own; keep your own code real in the test",
      "jest.mock for hard third-party boundaries; never for your own modules",
      "MSW mocks at the network layer so hooks, caching, and error mapping run for real",
      "Spies observe real methods (analytics calls); restore them to avoid leaks",
      "Prefer asserting visible outcomes over mock call counts; watch for mock drift",
    ],
    followUpQuestions: [
      "How do you keep mock data in sync with the real API schema?",
      "When is dependency injection better than module mocking?",
    ],
    relatedTopics: ["msw", "jest-mocks", "test-boundaries"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.TESTING,
    difficulty: "mid",
    question:
      "How do you test asynchronous UI — loading states, debounced inputs, and timers — without flakiness?",
    answer: `## The Golden Rule

Never assert on a fixed delay. \`setTimeout(assert, 500)\` is a flake factory — await the **observable outcome** instead.

## The Toolkit

- **\`findBy*\`** — waits (default 1s) for an element to appear: \`await screen.findByText(/saved/i)\`.
- **\`waitFor\`** — polls an arbitrary assertion until it passes; put the assertion inside, nothing else.
- **\`waitForElementToBeRemoved\`** — the idiomatic way to await a spinner disappearing.

\`\`\`tsx
await userEvent.click(screen.getByRole("button", { name: /save/i }));
await waitForElementToBeRemoved(() => screen.queryByRole("progressbar"));
expect(screen.getByText(/saved/i)).toBeInTheDocument();
\`\`\`

## Fake Timers for Debounce/Intervals

\`jest.useFakeTimers()\` + \`jest.advanceTimersByTime(300)\` makes a 300ms debounce instant and deterministic. Two traps:

- Configure userEvent with the fake clock: \`userEvent.setup({ advanceTimers: jest.advanceTimersByTime })\`, or interactions hang.
- Promises still need microtasks to flush — advancing timers doesn't resolve an in-flight mocked fetch by itself.

## Also

Test the loading state itself (spinner shows, button disables, double-submit blocked) — async bugs live there, not in the happy path.`,
    keyPoints: [
      "Never sleep-and-assert — await observable outcomes (findBy, waitFor)",
      "waitForElementToBeRemoved is the idiom for 'spinner goes away'",
      "Fake timers make debounce deterministic: advanceTimersByTime(300), no real waiting",
      "userEvent must be configured with fake timers or interactions hang",
      "Test the loading state itself: disabled button, double-submit protection",
    ],
    followUpQuestions: [
      "Why can advancing fake timers still leave a promise unresolved?",
      "How would you test a polling component that refetches every 30 seconds?",
    ],
    relatedTopics: ["async-testing", "fake-timers", "waitfor"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.TESTING,
    difficulty: "senior",
    question:
      "Design an E2E strategy with Playwright for a large frontend app. What runs where, and how do you keep it maintainable?",
    answer: `## Scope: E2E Is the Tip

E2E verifies the **system**, not components: a handful of user-critical journeys (auth, checkout, core CRUD) against a real browser. Everything else belongs further down where it's cheaper.

## Architecture

- **Page Object Model** (or fixture-based helpers): selectors and flows live in one place; tests read as intent — \`await checkoutPage.payWith(testCard)\`.
- **Stable selectors**: \`getByRole\`/\`getByLabel\` first (they double as a11y checks), \`data-testid\` where semantics don't exist. Never CSS classes.
- **Test data isolation**: each test creates its own user/records via API calls in fixtures — parallel workers must never share mutable state.
- **Auth via storage state**: log in once per worker, reuse the session; don't click through login in all 200 tests.
- **Network control**: for edge cases (payment declined, 500s) intercept with \`page.route\` — a full-stack E2E only for the golden paths.

## CI Layout

Smoke pack (~5 min) on every PR; full pack nightly and pre-release. Trace + video only on retry/failure. One retry allowed in CI — but every retry is logged and triaged, not accepted.

## Maintainability

Auto-waiting web-first assertions (\`expect(locator).toBeVisible()\`) instead of manual waits; quarantine tag for known-flaky with an owner and a deadline.`,
    keyPoints: [
      "E2E covers a handful of money journeys; push everything else down the stack",
      "Page objects/fixtures centralize selectors; tests read as user intent",
      "Isolation: per-test data via API setup, auth reused via storage state",
      "Role-based selectors over CSS; page.route for edge-case network states",
      "CI: smoke pack per PR, full nightly; retries logged and triaged, never ignored",
    ],
    followUpQuestions: [
      "How do you run E2E against which environment — preview, staging, prod?",
      "Playwright vs Cypress — what actually drives the choice?",
      "How do you handle third-party iframes (payments) in E2E?",
    ],
    relatedTopics: ["playwright", "e2e-strategy", "page-object-model"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.TESTING,
    difficulty: "senior",
    question:
      "Your team's CI is red 30% of the time from flaky tests. How do you fix it — immediately and systemically?",
    answer: `## Why It's Urgent

A 30%-flaky suite trains engineers to click "re-run" — at that point the suite catches nothing. Flakiness is a systems problem, not bad luck.

## Immediate: Stop the Bleeding

- **Quarantine** flaky tests behind a tag: they run but don't block merges. Every quarantined test gets an owner and an expiry — quarantine without a deadline is deletion in slow motion.
- **Instrument**: retries, traces, videos on failure; a dashboard ranking tests by flake rate. You fix the top 5, not random ones.

## Diagnose the Classic Causes

1. **Async races** — sleep-based waits, missing \`await\`, asserting before render settles. Fix: event/outcome-based waiting.
2. **Shared state** — tests coupled through a database row, localStorage, or module singleton; order-dependent. Fix: per-test isolation, randomized order to flush hidden coupling.
3. **Time** — real clocks, timezone-dependent assertions, midnight boundaries. Fix: fake timers, frozen clock, UTC.
4. **External dependencies** — real network in unit/integration layers. Fix: mock the boundary.
5. **Infra** — underpowered CI workers timing out; parallel port collisions.

## Systemic

Flake budget as a team metric; a failed retry files a ticket automatically; new tests reviewed against a "determinism checklist". The goal is cultural: red means broken, always.`,
    keyPoints: [
      "Quarantine with owner + expiry stops the bleeding without deleting coverage",
      "Instrument first: flake-rate dashboard, traces on failure — fix the top offenders",
      "Classic causes: async races, shared state, real clocks, real network, weak CI infra",
      "Randomize test order to expose hidden coupling; isolate state per test",
      "Make it cultural: red must mean broken, retries are triaged not tolerated",
    ],
    followUpQuestions: [
      "How would you detect order-dependent tests automatically?",
      "When is deleting a flaky test the right call?",
    ],
    relatedTopics: ["flaky-tests", "ci-reliability", "test-quarantine"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.TESTING,
    difficulty: "junior",
    question:
      "What does code coverage actually measure, and why is chasing 100% a mistake?",
    answer: `## What It Measures

Coverage counts which **lines/branches/functions executed** during tests. It answers "did this code run?" — never "was this behavior verified?" A test with zero assertions can produce 100% coverage.

## Why 100% Misleads

- **Assertion-free coverage**: rendering a component covers every line while proving nothing.
- **Goodhart's law**: make coverage the target and people write tests that execute code instead of tests that catch bugs — worse than no metric.
- **Diminishing returns**: the last 10% is usually defensive branches and glue, where tests cost much and catch little.
- **False confidence**: 100% coverage with shallow assertions reads as safety and isn't.

## How to Use It Well

- Treat it as a **gap detector**: uncovered code you *thought* was tested is the real signal.
- Enforce on **changed lines** (diff coverage) rather than a repo-wide number — keeps new code honest without gaming old code.
- Pair with **mutation testing** (Stryker) when you need truth: it changes your code and checks tests fail — measuring assertion strength, which coverage can't.

## Sane Target

~80% with strong assertions on core logic beats 100% of executed-but-unverified lines. State this tradeoff explicitly in interviews.`,
    keyPoints: [
      "Coverage = code executed, not behavior verified; zero-assertion tests still count",
      "Goodhart's law: target the number and tests optimize execution, not bug-catching",
      "Use as a gap detector and enforce diff coverage on changed lines",
      "Mutation testing (Stryker) measures assertion strength — what coverage can't see",
      "~80% with real assertions beats 100% shallow; say the tradeoff out loud",
    ],
    followUpQuestions: [
      "What's the difference between line, branch, and statement coverage?",
      "How does mutation testing work under the hood?",
    ],
    relatedTopics: ["code-coverage", "mutation-testing", "test-quality"],
    source: "seed",
  },
];
