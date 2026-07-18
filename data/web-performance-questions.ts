// ============================================================================
// WEB PERFORMANCE
// ============================================================================

import { CreateQuestionInput, QUESTION_CATEGORIES } from "@/types";

export const webPerformanceQuestions: CreateQuestionInput[] = [
  {
    category: QUESTION_CATEGORIES.WEB_PERFORMANCE,
    difficulty: "junior",
    question:
      "What are the Core Web Vitals? Explain LCP, CLS, and INP and their 'good' thresholds.",
    answer: `## The three metrics

Google's user-centric metrics, measured on **real users** (field data) and feeding into search ranking:

- **LCP — Largest Contentful Paint** (loading): time until the largest text block or image in the viewport renders. Good: **≤ 2.5s**.
- **CLS — Cumulative Layout Shift** (visual stability): how much visible content unexpectedly jumps around, scored by impact × distance of shifts not caused by user interaction. Good: **≤ 0.1**.
- **INP — Interaction to Next Paint** (responsiveness, replaced FID in 2024): the worst-case latency from a user interaction (click/tap/keypress) to the next frame painted. Good: **≤ 200ms**.

Thresholds must be met at the **75th percentile** of page loads.

## What typically hurts each

- LCP: slow server (TTFB), render-blocking CSS/JS, hero image not prioritized, client-side rendering waterfalls.
- CLS: images without dimensions, late-loading ads/embeds/banners pushing content, web fonts swapping metrics.
- INP: long JavaScript tasks blocking the main thread, heavy event handlers, big synchronous renders.

## Supporting metrics

TTFB and FCP diagnose LCP; TBT (Total Blocking Time) is the lab proxy for INP. Lab tools (Lighthouse) simulate; field data (CrUX, RUM) is what actually counts.`,
    keyPoints: [
      "LCP ≤ 2.5s (loading), CLS ≤ 0.1 (stability), INP ≤ 200ms (responsiveness)",
      "Measured at the 75th percentile of real-user visits",
      "INP replaced FID in 2024 — covers full interaction latency",
      "LCP←TTFB/blocking resources; CLS←missing dimensions; INP←long tasks",
    ],
    followUpQuestions: [
      "What's the difference between lab data and field data?",
      "How would you find which element is the LCP element?",
    ],
    relatedTopics: ["lighthouse", "rum", "rendering"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.WEB_PERFORMANCE,
    difficulty: "mid",
    question:
      "A page's LCP is 4.5 seconds. Walk through how you'd diagnose and fix it.",
    answer: `## Diagnose: break LCP into its phases

Using the Performance panel / Lighthouse, attribute time to: **TTFB → resource load delay → resource load time → render delay**. The fix depends entirely on which phase dominates.

## Server phase (TTFB > ~800ms)

CDN for HTML, cache/streaming SSR, faster backend, early hints (\`103\`).

## Resource phases (usually a hero image or web font)

- Make the hero discoverable **in the initial HTML** — not injected by JS or hidden in CSS \`background-image\` (preload scanner can't see those early enough). If unavoidable: \`<link rel="preload" as="image">\`.
- \`fetchpriority="high"\` on the LCP image; **never** \`loading="lazy"\` on it (lazy-loading the LCP image is the classic self-own).
- Shrink delivery: AVIF/WebP, responsive \`srcset\`, right-sized dimensions, CDN image optimization.
- \`preconnect\` to critical third-party origins.

## Render delay phase

- Eliminate render-blocking resources: inline critical CSS, defer non-critical CSS and scripts (\`defer\`/\`module\`).
- For SPA-shell apps the real fix is architectural: SSR/SSG so the LCP element arrives in HTML instead of after the JS bundle boots and fetches data (the CSR waterfall: HTML → JS → data → render).

## Verify

Re-measure in the field (RUM/CrUX), not just Lighthouse — lab throttling and your dev machine both lie.`,
    keyPoints: [
      "Attribute LCP time to phases: TTFB, load delay, load time, render delay",
      "Hero image: discoverable in HTML, fetchpriority=high, never lazy-loaded",
      "Inline critical CSS; defer scripts; preconnect third-party origins",
      "CSR waterfalls need SSR/SSG-level fixes, not tweaks",
      "Validate with field data, not just lab runs",
    ],
    followUpQuestions: [
      "When does preloading hurt performance?",
      "How does streaming SSR improve LCP vs classic SSR?",
    ],
    relatedTopics: ["ssr", "resource-hints", "images", "critical-css"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.WEB_PERFORMANCE,
    difficulty: "mid",
    question:
      "Explain the critical rendering path. How do script async/defer and CSS affect first render?",
    answer: `## From bytes to pixels

1. Parse HTML → **DOM**.
2. Parse CSS → **CSSOM**.
3. DOM + CSSOM → **render tree** (visible nodes with computed styles).
4. **Layout** (geometry) → **Paint** (pixels into layers) → **Composite** (GPU assembles layers).

First render is blocked by everything on the "critical path": the HTML, all render-blocking CSS, and any synchronous JS encountered along the way.

## How CSS blocks

CSS is **render-blocking** (browsers won't paint half-styled content) and also **blocks script execution** — a script may read styles, so it waits for CSSOM. Fixes: split/media-query non-critical CSS (\`media="print"\`, \`media="(min-width:...)"\` only block matching contexts), inline the critical subset.

## How scripts block

- **Plain \`<script>\`**: pauses HTML parsing → fetch → execute → resume. Worst case.
- **\`async\`**: fetch in parallel, execute **whenever ready** (parser pauses then) — order not guaranteed. For independent scripts (analytics).
- **\`defer\`**: fetch in parallel, execute **after parsing**, in document order, before \`DOMContentLoaded\`. The right default for app code. \`type="module"\` defers by default.

## Also worth naming

The **preload scanner** — a lookahead parser that discovers and fetches resources even while the main parser is blocked; keeping key resources visible in plain HTML markup is what lets it help you.`,
    keyPoints: [
      "DOM + CSSOM → render tree → layout → paint → composite",
      "CSS blocks rendering AND script execution; inline/split the critical part",
      "async = execute when ready, unordered; defer = after parse, in order",
      "Preload scanner fetches ahead — keep critical resources in plain HTML",
    ],
    followUpQuestions: [
      "Which CSS properties trigger layout vs paint vs composite-only?",
      "Where do requestAnimationFrame callbacks fit in the pipeline?",
    ],
    relatedTopics: ["browser-internals", "css-loading", "script-loading"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.WEB_PERFORMANCE,
    difficulty: "mid",
    question:
      "What's your complete strategy for optimizing images on the web?",
    answer: `## Format

Modern formats first — **AVIF** then **WebP** with fallback (\`<picture>\` + \`<source type>\`), JPEG/PNG as base. SVG for icons/illustrations. Rough savings: AVIF ~50% smaller than JPEG at similar quality.

## Right size for the display

Serving a 2000px image into a 400px slot wastes most of its bytes:

\`\`\`html
<img
  srcset="hero-400.avif 400w, hero-800.avif 800w, hero-1600.avif 1600w"
  sizes="(max-width: 600px) 100vw, 50vw"
  src="hero-800.jpg" alt="…" width="800" height="450"
/>
\`\`\`

\`srcset\`+\`sizes\` lets the browser pick per device/DPR; an image CDN (or next/image) automates the variants.

## Loading behavior

- **Below the fold**: \`loading="lazy"\` + \`decoding="async"\`.
- **LCP/hero image**: eager + \`fetchpriority="high"\` — never lazy.
- **Always** set \`width\`/\`height\` (or CSS \`aspect-ratio\`) so space is reserved → no CLS.

## Polish

Blur-up/LQIP or dominant-color placeholders for perceived speed; \`Cache-Control: immutable\` with hashed filenames; \`preconnect\` to the image CDN; audit with Lighthouse's "Properly size images" and "Serve next-gen formats".

Framework note: \`next/image\` bundles most of this (resizing, AVIF/WebP negotiation, lazy default, priority prop, size reservation) — say *why* it exists, not just that you use it.`,
    keyPoints: [
      "AVIF/WebP via <picture>; SVG for icons",
      "srcset + sizes serve per-viewport/DPR variants",
      "Lazy-load below the fold; fetchpriority=high and eager for the LCP image",
      "width/height or aspect-ratio reserve space — prevents CLS",
      "Hashed filenames + immutable caching; image CDN automates variants",
    ],
    followUpQuestions: [
      "How does the browser choose among srcset candidates?",
      "What are the tradeoffs of inlining images as data URIs?",
    ],
    relatedTopics: ["cls", "lcp", "caching", "cdn"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.WEB_PERFORMANCE,
    difficulty: "mid",
    question:
      "Web fonts: what are FOIT and FOUT, and how do you load fonts without hurting performance?",
    answer: `## The two failure modes

While a web font downloads, the browser must decide what to show:

- **FOIT** (Flash of Invisible Text) — text hidden until the font arrives. Terrible: content is unreadable, LCP blocked.
- **FOUT** (Flash of Unstyled Text) — fallback font shown, swapped when ready. Readable immediately but the swap can shift layout (CLS) since fonts have different metrics.

## font-display

\`\`\`css
@font-face {
  font-family: "Inter";
  src: url("/fonts/inter-var.woff2") format("woff2");
  font-display: swap;   /* or optional */
}
\`\`\`

- \`swap\` — show fallback immediately, swap when loaded (FOUT; risk of shift).
- \`optional\` — tiny block, then **use fallback for this page view** if the font isn't cached yet. Zero CLS; the font appears from cache on subsequent views. Increasingly the recommended choice for body text.

## Reducing the cost

- **WOFF2 only**; **subset** to needed scripts (latin) — often 70-90% smaller; **variable fonts** replace multiple weight files.
- **Self-host** with \`Cache-Control: immutable\` (also avoids third-party connection setup; Google Fonts' cache is partitioned per-site anyway, so no shared-cache benefit).
- \`<link rel="preload" as="font" type="font/woff2" crossorigin>\` for the critical text font.
- Kill the swap-shift: tune the fallback with \`size-adjust\`/\`ascent-override\` metrics so fallback ≈ web font (next/font automates exactly this).
- System font stack = zero cost when brand allows.`,
    keyPoints: [
      "FOIT hides text; FOUT swaps and can shift layout",
      "font-display: swap or optional; optional gives zero CLS",
      "WOFF2 + subsetting + variable fonts + self-host + preload",
      "size-adjust fallback metric tuning eliminates swap shift (next/font does this)",
    ],
    followUpQuestions: [
      "Why doesn't loading Google Fonts from their CDN share cache across sites anymore?",
      "How does next/font eliminate layout shift?",
    ],
    relatedTopics: ["cls", "resource-hints", "self-hosting"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.WEB_PERFORMANCE,
    difficulty: "senior",
    question:
      "Your app has poor INP — interactions feel sluggish. Explain long tasks and the strategies to keep the main thread responsive.",
    answer: `## Why interactions lag

The main thread runs JS, style, layout, and paint. A **long task** (>50ms) blocks everything — a click during one waits for it to finish. INP captures this: input delay → event processing → next paint.

## Find the tasks

Performance panel (red-triangled tasks), \`PerformanceObserver\` with \`longtask\`/\`event\` entries in RUM, React Profiler for render cost attribution.

## Strategies

**1. Do less work** — the unglamorous majority: kill accidental re-renders (memo, selectors), virtualize long lists, drop heavy third-party scripts, debounce input-driven recomputation.

**2. Break work up (yield to the main thread)** — a 500ms task becomes ten 50ms slices; input runs between slices:

\`\`\`javascript
// scheduler.yield() where available, else:
const yieldToMain = () => new Promise(r => setTimeout(r, 0));
for (const chunk of chunks) {
  process(chunk);
  await yieldToMain();
}
\`\`\`

React's \`useTransition\` is the same idea managed for you — renders become interruptible.

**3. Split urgent from deferrable in handlers** — update UI state immediately; schedule analytics/recomputation after paint (\`requestAnimationFrame\` → \`setTimeout\`, or \`scheduler.postTask\` with low priority).

**4. Move work off-thread** — Web Workers for pure computation (parsing, diffing, crypto); \`OffscreenCanvas\` for rendering work. Structured-clone messaging is the constraint: no DOM access, so it fits data-in/data-out jobs.

**5. Reduce paint cost** — smaller invalidation areas, \`content-visibility: auto\`, avoid layout thrash in handlers.`,
    keyPoints: [
      "Long tasks (>50ms) block input; INP = delay + processing + paint",
      "First do less: fewer renders, virtualization, fewer third-party scripts",
      "Chunk work and yield (scheduler.yield / setTimeout, useTransition)",
      "Web Workers for pure computation off the main thread",
      "Split urgent UI updates from deferrable work in handlers",
    ],
    followUpQuestions: [
      "What are the limits of Web Workers for React apps?",
      "How does scheduler.postTask differ from setTimeout?",
    ],
    relatedTopics: ["event-loop", "workers", "react-concurrent", "inp"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.WEB_PERFORMANCE,
    difficulty: "senior",
    question:
      "What is layout thrashing? Show the read/write pattern that causes it and how to fix it.",
    answer: `## The mechanism

The browser batches DOM writes and recalculates layout lazily. But reading a **geometry property** (\`offsetHeight\`, \`getBoundingClientRect\`, \`scrollTop\`…) when styles are dirty forces a **synchronous layout** (reflow) right now. Alternate writes and reads in a loop and you force layout on every iteration:

\`\`\`javascript
// ❌ N forced synchronous layouts
items.forEach((el) => {
  el.style.width = container.offsetWidth / 2 + "px"; // read → forces layout after prior write
});

// ✅ read once, then write — 1 layout at the end
const width = container.offsetWidth / 2 + "px";
items.forEach((el) => { el.style.width = width; });
\`\`\`

The rule: **batch all reads, then all writes** per frame. For interleaved code paths, schedule writes in \`requestAnimationFrame\` (libraries like fastdom formalize the two queues).

## Bigger levers

- **Animate compositor-only properties** — \`transform\` and \`opacity\` skip layout *and* paint; animating \`top/left/width\` reflows every frame.
- **CSS containment** — \`contain: layout paint\` / \`content-visibility: auto\` scope a subtree's layout so changes don't invalidate the world (and skip rendering offscreen content entirely).
- Read layout-dependent values from \`ResizeObserver\`/\`IntersectionObserver\` callbacks instead of polling geometry in handlers.
- In React, measure in \`useLayoutEffect\` (post-DOM-update, pre-paint) — and keep it cheap, since it blocks paint.

Diagnose in the Performance panel: mid-task purple "Layout" blocks flagged **"Forced reflow"** with the guilty stack trace.`,
    keyPoints: [
      "Geometry reads on dirty styles force synchronous layout",
      "Write-read-write loops = N reflows; batch reads then writes",
      "Animate transform/opacity — compositor-only, no layout or paint",
      "contain / content-visibility scope layout invalidation",
      "DevTools flags 'Forced reflow' with the responsible code",
    ],
    followUpQuestions: [
      "Why does useLayoutEffect block paint, and when is that desirable?",
      "What does will-change do and what's the cost of overusing it?",
    ],
    relatedTopics: ["rendering-pipeline", "compositing", "css-containment"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.WEB_PERFORMANCE,
    difficulty: "mid",
    question:
      "How do you measure web performance properly? Compare lab vs field data and name the key tools and APIs.",
    answer: `## Lab vs field

- **Lab** (Lighthouse, WebPageTest, DevTools): controlled, reproducible, throttled runs. Great for debugging and CI regression gates — but it's one synthetic device/network, and can't see real-world variety or INP-style interaction data well.
- **Field / RUM** (CrUX, your own RUM via web-vitals): what actual users experience across devices, networks, and geographies — the data Core Web Vitals rankings use (75th percentile). Diagnostic detail is limited; you know *that* it's slow before *why*.

Workflow: **field data tells you what to fix and whether the fix worked; lab tells you why it's slow.** A page can score 95 in Lighthouse and still fail CWV in the field (cheap Androids, slow networks) — say this; it's the interview signal.

## Instrumenting the field

\`\`\`javascript
import { onLCP, onCLS, onINP } from "web-vitals";
onLCP(sendToAnalytics); onCLS(sendToAnalytics); onINP(sendToAnalytics);
\`\`\`

Underneath: \`PerformanceObserver\` over entry types — \`largest-contentful-paint\`, \`layout-shift\`, \`event\`, \`longtask\`, \`navigation\`/\`resource\` timing. \`performance.mark()/measure()\` for custom spans ("time to first search result").

## Process points

- Track **percentiles (p75/p95), never averages** — performance is a distribution.
- Segment by device class, country, connection.
- Budget + CI: Lighthouse CI or bundle-size checks to stop regressions at PR time.`,
    keyPoints: [
      "Lab = reproducible diagnosis; field = real users and the ranking data",
      "Fix-finding in lab, success-verification in field, both needed",
      "web-vitals library / PerformanceObserver instrument RUM cheaply",
      "Percentiles over averages; segment by device and network",
      "Enforce budgets in CI (Lighthouse CI, bundle checks)",
    ],
    followUpQuestions: [
      "Why can Lighthouse be green while CrUX fails?",
      "How would you build a performance budget for a team?",
    ],
    relatedTopics: ["core-web-vitals", "lighthouse", "rum", "ci"],
    source: "seed",
  },
];
