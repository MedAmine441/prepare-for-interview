// ============================================================================
// FEATURE FLAGS
// ============================================================================

import { CreateQuestionInput, QUESTION_CATEGORIES } from "@/types";

export const featureFlagsQuestions: CreateQuestionInput[] = [
  {
    category: QUESTION_CATEGORIES.FEATURE_FLAGS,
    difficulty: "senior",
    question:
      "Design a scalable feature flag system for a large-scale frontend application. How would you handle complex targeting, rollout dependencies, and performance?",
    answer: `## High-Level Architecture


A senior-level implementation requires a decoupled evaluation engine that supports consistent hashing for rollouts and prerequisite checks.

### 1. Data Model
We need a flexible schema that supports simple toggles, multivariate values, and dependency chains.

\`\`\`typescript
interface FeatureFlag {
  key: string;
  type: 'boolean' | 'string' | 'number';
  defaultValue: unknown;
  rules: TargetingRule[];
  rollout?: { percentage: number; seed?: string };
  // Flag Dependencies: Flag B cannot be ON unless Flag A is ON
  prerequisites?: { flagKey: string; requiredValue: unknown }[];
}

interface TargetingRule {
  conditions: Array<{
    attribute: string; // e.g., 'email', 'version', 'region'
    operator: 'in' | 'not_in' | 'regex' | 'gt' | 'lt';
    value: unknown;
  }>;
  value: unknown;
}
\`\`\`

### 2. Evaluation Engine with Consistent Bucketing

To ensure a user doesn't "flip-flop" between states during a percentage rollout, we use a hash-based bucketing system rather than \`Math.random()\`.

\`\`\`typescript
class FlagEvaluator {
  evaluate<T>(flag: FeatureFlag, context: UserContext): T {
    // 1. Recursive Prerequisite Check
    for (const prereq of flag.prerequisites ?? []) {
      const parentValue = this.evaluate(this.getFlag(prereq.flagKey), context);
      if (parentValue !== prereq.requiredValue) return flag.defaultValue as T;
    }
    
    // 2. Targeting Rules (Override rollout)
    for (const rule of flag.rules) {
      if (this.matchesRule(rule, context)) return rule.value as T;
    }
    
    // 3. Deterministic Percentage Rollout
    if (flag.rollout) {
      const isIncluded = this.computeHash(
        context.userId, 
        flag.rollout.seed || flag.key, 
        flag.rollout.percentage
      );
      if (isIncluded) return true as T;
    }
    
    return flag.defaultValue as T;
  }
  
  private computeHash(userId: string, salt: string, percentage: number): boolean {
    // Using a simple hash (e.g., FNV-1a or MurmurHash logic) 
    // to map the UserID + Salt to a value between 0-99
    const hash = [...(\`\${userId}:\${salt}\`)].reduce((acc, char) => 
      ((acc << 5) - acc) + char.charCodeAt(0), 0
    );
    return Math.abs(hash % 100) < percentage;
  }
}
\`\`\`

### 3. Performance Optimization

* **Local Evaluation:** Fetch all flag configurations (rulesets) on app initialization and evaluate locally in-memory. This avoids network latency on every \`getFlag\` call.
* **Bootstrap State:** Inject initial flag values into the HTML payload (SSR) to prevent "layout shift" or "flicker" during the first render.
* **Streaming Updates:** Use Server-Sent Events (SSE) to push flag updates in real-time without polling.`,
    keyPoints: [
      "Consistent hashing for deterministic user experience",
      "Recursive prerequisite/dependency handling",
      "Strategies to prevent UI flickering (Bootstrapping)",
      "Targeting based on complex user metadata",
    ],
    followUpQuestions: [
      "How do you handle feature flags in a Server-Side Rendering (SSR) context?",
      "How would you integrate this with Segment or Mixpanel for A/B test analysis?",
    ],
    relatedTopics: ["system-design", "distributed-systems", "ab-testing"],
    source: "seed",
    commonAt: ["Netflix", "Uber", "Airbnb"],
  },
  {
    category: QUESTION_CATEGORIES.FEATURE_FLAGS,
    difficulty: "senior",
    question:
      "Explain how feature flags facilitate Trunk-Based Development and outline a comprehensive strategy for managing the resulting technical debt.",
    answer: `## Trunk-Based Development (TBD)


In TBD, developers merge small, frequent updates to a single branch (\`main\`). Feature flags act as the "decoupling agent" between **Deployment** (moving code to prod) and **Release** (turning it on for users).

\`\`\`typescript
// The 'Branch by Abstraction' pattern
function PaymentService() {
  const isStripeEnabled = useFeatureFlag('enable-stripe-v2');
  
  // Both implementations coexist in the codebase safely
  return isStripeEnabled ? <StripeProviderV2 /> : <LegacyPayPalProvider />;
}
\`\`\`

## Testing Strategies for Binary Paths

A common pitfall is only testing the "ON" state. Senior engineers ensure coverage for both.

\`\`\`typescript
describe('Checkout Flow', () => {
  const testCases = [
    { flag: true, expected: 'new-ui' },
    { flag: false, expected: 'legacy-ui' }
  ];

  test.each(testCases)('renders correctly when flag is $flag', ({ flag, expected }) => {
    mockFeatureFlags({ 'new-checkout': flag });
    render(<Checkout />);
    expect(screen.getByTestId(expected)).toBeInTheDocument();
  });
});
\`\`\`

## Managing Long-Lived Flags & Technical Debt

To prevent "Flag Rot," we implement a multi-layered cleanup strategy:

### 1. Categorization
* **Release Flags:** Temporary (TTL < 4 weeks).
* **Ops Flags:** Permanent "Kill Switches" for circuit breaking.
* **Permission Flags:** Long-lived for tier-based access (e.g., 'premium-user').

### 2. Automated Governance
\`\`\`typescript
// CI Script to find stale flags
const STALE_THRESHOLD_DAYS = 60;

async function checkStaleFlags() {
  const flags = await flagClient.getMetadata();
  const stale = flags.filter(f => 
    f.type === 'release' && 
    diffDays(f.createdAt, Date.now()) > STALE_THRESHOLD_DAYS
  );
  
  if (stale.length) {
    notifySlack(\`Found \${stale.length} stale flags requiring cleanup: \${stale.map(s => s.key)}\`);
  }
}
\`\`\`

### 3. Code Quality Rules
* **No Nested Flags:** Avoid \`if (flagA) { if (flagB) { ... } }\`.
* **Max Flag Limit:** Enforce a linting rule or soft-cap on the number of active release flags per module to prevent combinatorial explosion.`,
    keyPoints: [
      "Decouples deployment from release",
      "Implements 'Branch by Abstraction'",
      "Mandates 'Both-Path' testing (ON and OFF)",
      "Automated stale flag detection and TTL enforcement",
    ],
    followUpQuestions: [
      "How do you handle database migrations when the code is behind a feature flag?",
      "What are the risks of 'Flag Hell' (combinatorial explosion of states)?",
    ],
    relatedTopics: ["ci-cd", "devops", "testing-strategy", "technical-debt"],
    source: "seed",
    commonAt: ["Google", "Meta", "Stripe"],
  },
];
