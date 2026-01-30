// ============================================================================
// ACCESSIBILITY (Consolidated & Refined)
// ============================================================================

import { CreateQuestionInput, QUESTION_CATEGORIES } from "@/types";

export const accessibilityQuestions: CreateQuestionInput[] = [
  {
    category: QUESTION_CATEGORIES.ACCESSIBILITY,
    difficulty: "senior",
    question:
      "Design a highly reusable, fully accessible 'Select' component (Combobox pattern). Explain the critical differences between the ARIA `combobox` and `menu` roles, and implement the keyboard logic using `aria-activedescendant` for performance.",
    answer: `## Combobox vs. Menu

A senior engineer must distinguish these patterns:
* **Combobox (Select):** Used for *form inputs* where a user selects a value. It allows type-ahead or filtering.
* **Menu:** Used for *navigation or actions* (e.g., "File > Save"). It typically does not hold a "value."

## Implementation: Accessible Select (Combobox)

We use \`aria-activedescendant\` to manage "virtual focus." This is more performant than moving actual DOM focus (Roving Tabindex) because it prevents browser layout thrashing and works better with virtualized lists.

\`\`\`tsx
import { useState, useRef, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';

type Option = { value: string; label: string };

export function AccessibleSelect({ options, value, onChange, label }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listboxId = useId();
  const labelId = useId();
  const comboId = useId();

  // 1. Handle Type-ahead and Keys
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ': // Space opens/selects in Combobox
        e.preventDefault();
        if (isOpen && activeIndex >= 0) {
          onChange(options[activeIndex].value);
          setIsOpen(false);
        } else {
          setIsOpen(true);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) setIsOpen(true);
        setActiveIndex(prev => (prev + 1) % options.length); // Cycle
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => (prev - 1 + options.length) % options.length);
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      case 'Tab':
        setIsOpen(false); // Native tab behavior closes dropdown
        break;
      default:
        // Implement type-ahead logic here (omitted for brevity)
        break;
    }
  };

  // 2. Ensure active option is visible (Scroll into view)
  useEffect(() => {
    if (isOpen && activeIndex >= 0) {
      const el = document.getElementById(\`\${listboxId}-opt-\${activeIndex}\`);
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex, isOpen, listboxId]);

  return (
    <div className="relative">
      <label id={labelId} className="block text-sm font-medium">{label}</label>
      
      <div
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={labelId}
        aria-controls={listboxId}
        aria-activedescendant={
          isOpen && activeIndex >= 0 
            ? \`\${listboxId}-opt-\${activeIndex}\` 
            : undefined
        }
      >
        <button
          id={comboId}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          className="w-full border p-2 text-left"
        >
          {value ? options.find(o => o.value === value)?.label : "Select..."}
        </button>
      </div>

      {/* 3. Use Portal to avoid z-index/overflow clipping issues */}
      {isOpen && createPortal(
        <ul
          id={listboxId}
          role="listbox"
          aria-labelledby={labelId}
          tabIndex={-1}
          className="absolute z-50 max-h-60 overflow-auto border bg-white"
          style={{ /* Position logic via Popper/Floating UI would go here */ }}
        >
          {options.map((opt, i) => (
            <li
              key={opt.value}
              id={\`\${listboxId}-opt-\${i}\`}
              role="option"
              aria-selected={value === opt.value}
              className={\`p-2 \${i === activeIndex ? 'bg-blue-100' : ''}\`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.label}
              {/* Screen reader only "Check" for selected state */}
              {value === opt.value && <span className="sr-only">Selected</span>}
            </li>
          ))}
        </ul>,
        document.body
      )}
    </div>
  );
}
\`\`\`

## Key Senior Considerations
1.  **Portal Rendering:** Essential for preventing the dropdown from being clipped by \`overflow: hidden\` on parent containers.
2.  **Visual vs. DOM Focus:** We keep DOM focus on the Trigger Button. The list items are never focused; we use \`aria-activedescendant\` to tell the screen reader which item is "active."
3.  **High Contrast Mode:** Ensure selection states don't rely solely on background color (use borders or icons).`,
    keyPoints: [
      "Distinguishes Combobox (Form) vs Menu (Action) roles",
      "Implements aria-activedescendant for virtual focus",
      "Uses React Portals to solve stacking context issues",
      "Manages scroll-into-view for keyboard navigation",
      "Handles aria-selected and visual selection states independently",
    ],
    followUpQuestions: [
      "How would you handle asynchronous data loading in this component?",
      "Why might you choose Roving Tabindex over aria-activedescendant for a Grid component?",
    ],
    relatedTopics: [
      "aria",
      "react-portals",
      "focus-management",
      "virtualization",
    ],
    source: "seed",
    commonAt: ["Top-tier Tech Companies (Meta, Airbnb)"],
  },
  {
    category: QUESTION_CATEGORIES.ACCESSIBILITY,
    difficulty: "mid",
    question:
      "Explain the hierarchy of 'Accessible Name Computation'. specifically the difference between `aria-label`, `aria-labelledby`, and `aria-describedby`.",
    answer: `## Accessible Name Computation (Priority Order)

Browsers calculate the "Name" (what is announced) based on this specific priority. The first non-empty value wins:

1.  **\`aria-labelledby\`** (Highest Priority): Overrides *everything*, including visible text.
2.  **\`aria-label\`**: Overrides visible text (e.g., button content).
3.  **Native Label**: \`<label for="id">\`, \`alt\` attribute, or \`placeholder\` (as a fallback).
4.  **Text Content**: The inner text of the element.
5.  **Title Attribute**: (Lowest priority, generally discouraged).

## The Differences

### 1. \`aria-labelledby\` (The Gold Standard)
Points to the ID of another element.
* **Why use it:** It references *visible* text on the screen. If the text changes (e.g., translation), the label updates automatically.
* **Use case:** A modal title or a label for a complex widget.

\`\`\`html
<h2 id="modal-header">Delete User?</h2>
<div role="dialog" aria-labelledby="modal-header">...</div>
\`\`\`

### 2. \`aria-label\`
A string value applied directly to the element.
* **Why use it:** When there is no visible text on the screen (e.g., an icon button).
* **Risk:** Translators often miss these strings if they are hardcoded props.

\`\`\`html
<button aria-label="Close">X</button>
\`\`\`

### 3. \`aria-describedby\`
Provides *supplementary* information, not the name. It is read *after* the name and role, often after a short pause.
* **Use case:** Error messages, help text, or format requirements.

\`\`\`html
<label for="pw">Password</label>
<input id="pw" aria-describedby="pw-help" />
<span id="pw-help">Must be 8 characters long</span>
\`\`\`

## Senior Tip: Handling ID Collisions
In React, hardcoding IDs (e.g., \`id="modal-header"\`) breaks if the component renders twice. **Always use \`useId()\`** to generate stable, unique IDs for these relationships.`,
    keyPoints: [
      "Knows the calculation priority (LabelledBy > Label > Content)",
      "Understands aria-describedby is for description, not naming",
      "Identifies i18n risks with aria-label",
      "Uses useId() to prevent ID collisions in reused components",
    ],
    followUpQuestions: [
      "How does 'aria-hidden' affect name computation?",
      "How would you debug an element with a missing accessible name?",
    ],
    relatedTopics: ["aria", "wcag", "semantics"],
    source: "seed",
    commonAt: ["All frontend roles"],
  },
  {
    category: QUESTION_CATEGORIES.ACCESSIBILITY,
    difficulty: "senior",
    question:
      "Beyond basic alt-text and contrast, what are the most complex systemic accessibility issues in modern React SPAs (Single Page Applications), and how do you mitigate them?",
    answer: `## 1. Route Change & Focus Management
**The Issue:** In SPAs, when a user clicks a link, the content swaps, but the focus often remains on the \`<body>\` or is lost entirely. Screen reader users are left waiting in silence, unsure if the page loaded.

**The Fix:**
Implement a \`RouteAnnouncer\` or manage focus manually on route transition.

\`\`\`tsx
// Example Route Focus Manager
useEffect(() => {
  // 1. Reset scroll to top
  window.scrollTo(0, 0);
  
  // 2. Move focus to the main heading or a wrapper
  const mainHeader = document.querySelector('h1');
  if (mainHeader) {
    mainHeader.tabIndex = -1;
    mainHeader.focus();
  } else {
    // Fallback: Skip link
    document.getElementById('skip-link')?.focus();
  }
}, [location.pathname]); // Trigger on route change
\`\`\`

## 2. Invalid HTML Nesting (Hydration Errors)
**The Issue:** React allows you to write invalid nesting (e.g., \`<div>\` inside \`<p>\` or \`<button>\` inside \`<button>\`) that browsers try to "fix" by rearranging the DOM. This breaks the Accessibility Tree and causes hydration mismatches.

**The Fix:**
* Use standard validation tools (W3C validator).
* Strict linting (\`eslint-plugin-jsx-a11y\`).
* **Never** nest interactive elements.

## 3. Dynamic Content (Live Regions)
**The Issue:** Toasts, error messages, or loading spinners appear dynamically but aren't announced because they weren't in the DOM initially.

**The Fix:**
Use \`aria-live\` regions effectively.

\`\`\`tsx
// Polite: Waits for user to stop typing/interacting
<div aria-live="polite" aria-atomic="true">
  {saving ? "Saving..." : "Changes saved."}
</div>

// Assertive: Interrupts immediately (Use sparingly!)
<div role="alert" aria-live="assertive">
  {error}
</div>
\`\`\`

## 4. The "Button vs Link" Anti-Pattern
**The Issue:** Using \`<div onClick>\` or using a \`<button>\` that navigates to a URL.
* Links (\`<a>\`) are for **navigation** (changing URL).
* Buttons (\`<button>\`) are for **actions** (submitting, opening modals).

**The Fix:**
Strict code reviews. If it has an \`href\`, it must be an anchor. If it changes state, it must be a button.

## 5. Automated vs Manual Testing
Senior devs know automated tools (axe-core, Lighthouse) only catch ~30% of issues.
**Required Manual Checks:**
* **Keyboard Flow:** Can you use the site without a mouse?
* **Zoom:** Does the layout break at 200% zoom?
* **Screen Reader:** Turn on VoiceOver/NVDA. Do the announcements match the visual experience?`,
    keyPoints: [
      "Identifies SPA routing as a major focus trap",
      "Understand the limitations of automated testing (30% coverage)",
      "Correctly implements aria-live for dynamic updates",
      "Enforces semantic distinction between Buttons and Links",
    ],
    followUpQuestions: [
      "How do you automate accessibility testing in CI/CD?",
      "What is the difference between aria-live='polite' and 'assertive'?",
    ],
    relatedTopics: [
      "spa-architecture",
      "focus-management",
      "semantic-html",
      "testing",
    ],
    source: "seed",
    commonAt: ["Senior/Lead Frontend Roles"],
  },
];
