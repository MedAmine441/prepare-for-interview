// ============================================================================
// BEHAVIORAL & STORIES
// ============================================================================

import { CreateQuestionInput, QUESTION_CATEGORIES } from "@/types";

export const behavioralQuestions: CreateQuestionInput[] = [
  {
    category: QUESTION_CATEGORIES.BEHAVIORAL,
    difficulty: "junior",
    question: "Tell me about yourself.",
    answer: `## What They're Really Asking

"Give me the 90-second trailer of your career, aimed at THIS role." It sets the tone for the whole interview — a rambling answer here costs you goodwill you never get back.

## The Structure: Present → Past → Future

- **Present** (2-3 sentences): your current role and the work you're proudest of. Lead with scope: "I'm a frontend engineer building the checkout flow used by 2M monthly users."
- **Past** (2-3 sentences): the path that built your relevant skills — pick the two experiences that best map to this job, skip everything else.
- **Future** (1-2 sentences): why this role is the logical next step. This is where you show you researched them.

## Pitfalls

- Reciting your CV chronologically from university onward.
- Personal biography ("I was born in...") — this is a professional pitch.
- Going past two minutes. Practice it out loud with a timer until it lands at ~90 seconds.

Prepare this answer word-for-word. It is the only question you are guaranteed to get.`,
    keyPoints: [
      "Structure: Present (current role + impact) → Past (relevant path) → Future (why this role)",
      "Lead with scope and numbers: what you build, for how many users, with what result",
      "Tailor ruthlessly — only include experiences that map to this specific job",
      "Target ~90 seconds spoken; rehearse it out loud, it's the one guaranteed question",
      "Never recite the CV chronologically or drift into personal biography",
    ],
    followUpQuestions: [
      "Why are you looking to leave your current role?",
      "Which of those projects are you most proud of, and why?",
      "What are you looking for in your next team?",
    ],
    relatedTopics: ["elevator-pitch", "self-presentation", "interview-openers"],
    source: "seed",
    commonAt: ["Every company, almost every screen"],
  },
  {
    category: QUESTION_CATEGORIES.BEHAVIORAL,
    difficulty: "mid",
    question:
      "Tell me about a time you had a conflict with a teammate. How did you handle it?",
    answer: `## What They're Really Asking

Can you disagree without being disagreeable? They're screening for self-awareness, empathy, and whether you resolve friction directly or let it fester (or worse, escalate immediately).

## STAR Skeleton

- **Situation**: a real, specific disagreement — technical ones are safest ("we disagreed on adopting a state library mid-project").
- **Task**: what was at stake — deadline, quality, team velocity.
- **Action**: the key part. Show you (1) talked to them directly and privately first, (2) genuinely tried to understand their reasoning, (3) moved the discussion to shared criteria — data, a prototype, user impact — instead of opinions.
- **Result**: a concrete resolution AND what it did to the relationship. Bonus points if you were the one who turned out to be wrong and say so.

## Pitfalls

- "I don't really have conflicts" — reads as low self-awareness or no ownership.
- Stories where the other person is a cartoon villain and you're flawless.
- Escalating to a manager as step one.

The strongest version ends with the relationship *better* than before the conflict.`,
    keyPoints: [
      "Pick a real, specific conflict — a technical disagreement is the safest territory",
      "Show direct, private conversation first; escalation is a last resort, not step one",
      "Resolve on shared criteria (data, prototype, user impact), not on who argues louder",
      "Own your part — the strongest stories admit where you were wrong",
      "End with the concrete outcome AND the improved relationship",
    ],
    followUpQuestions: [
      "What would you do differently if it happened again?",
      "Tell me about a conflict you failed to resolve.",
      "How do you handle disagreement with someone more senior than you?",
    ],
    relatedTopics: ["conflict-resolution", "star-method", "teamwork"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.BEHAVIORAL,
    difficulty: "mid",
    question:
      "Tell me about the most challenging project you've worked on. What made it hard?",
    answer: `## What They're Really Asking

How do you behave when things are genuinely difficult? They're calibrating your ceiling: the complexity you can handle, and whether "hard" for you means technical depth, ambiguity, people, or scale.

## STAR Skeleton

- **Situation**: one project, named concretely. Give the shape fast: goal, team size, deadline, your role.
- **Task**: why it was hard — and be precise about the *kind* of hard: gnarly legacy migration, unclear requirements, brutal performance budget, coordination across three teams.
- **Action**: how you attacked it. Show decomposition (breaking the problem down), prioritization (what you consciously dropped), and one moment where you changed approach when the first plan failed.
- **Result**: numbers. Shipped when? Perf improved by how much? What did the business get?

## Make It Land

- End with what it taught you — one durable lesson, not a platitude.
- Pick a story where **you** drove the outcome; "I was on a team that..." wastes the question.
- Match the story to the role: for a senior role, pick ambiguity and cross-team hardness over pure algorithmic difficulty.`,
    keyPoints: [
      "Name one concrete project: goal, team size, your role, deadline — in two sentences",
      "Be precise about the KIND of hard: legacy, ambiguity, performance, coordination",
      "Show decomposition and a pivot: the moment plan A failed and what you did about it",
      "Quantify the result — shipped date, perf numbers, business impact",
      "Close with one durable lesson; pick a story where you personally drove the outcome",
    ],
    followUpQuestions: [
      "What would you do differently with hindsight?",
      "What was the biggest technical decision you made on that project?",
      "How did you keep stakeholders informed when things slipped?",
    ],
    relatedTopics: ["star-method", "project-ownership", "problem-solving"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.BEHAVIORAL,
    difficulty: "mid",
    question:
      "Tell me about a time you failed or made a serious mistake. How did you handle it?",
    answer: `## What They're Really Asking

Do you own failure or deflect it? Engineers who hide mistakes are dangerous; engineers who learn from them compound. They also want to see your incident instincts: contain, communicate, fix, prevent.

## STAR Skeleton

- **Situation/Task**: a real failure with stakes — a bad deploy, a wrong technical bet, a missed requirement. Not "I work too hard."
- **Action**: the four beats interviewers listen for:
  1. **Owned it fast** — no blaming tools or teammates.
  2. **Contained it** — rollback, feature flag off, hotfix.
  3. **Communicated** — told the team/users before they found out themselves.
  4. **Prevented recurrence** — test, alert, checklist, or process change.
- **Result**: the damage honestly stated, plus the systemic improvement that outlived the incident.

## Pitfalls

- Fake failures ("my weakness is perfectionism") — instant credibility loss.
- Stories with no consequence — if nothing was at stake, it's not a failure story.
- Stopping at "I fixed it" without the prevention step; that's the difference between an incident and a lesson.`,
    keyPoints: [
      "Choose a real failure with stakes — fake humility ('I care too much') destroys credibility",
      "Beat 1-2: own it immediately and contain the damage (rollback, flag off, hotfix)",
      "Beat 3: communicate proactively — team and users hear it from you first",
      "Beat 4: prevention that outlives you — a test, alert, or process change",
      "State the damage honestly; the lesson matters more than looking flawless",
    ],
    followUpQuestions: [
      "How did your team react?",
      "What guardrail from that incident do you still use today?",
      "Tell me about a technical bet you got wrong.",
    ],
    relatedTopics: ["failure-stories", "incident-response", "ownership"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.BEHAVIORAL,
    difficulty: "mid",
    question:
      "Tell me about a time you had to deliver under a tight deadline. What did you cut and how did you decide?",
    answer: `## What They're Really Asking

Can you prioritize like an owner? Under pressure, weak engineers work nights; strong engineers change scope. They want to hear deliberate tradeoffs, not heroics.

## STAR Skeleton

- **Situation/Task**: the deadline and why it was immovable (launch event, contract, marketing spend).
- **Action**: the prioritization story:
  - Split the work into **must-ship / should-ship / can-follow** with the PM — scope is negotiated, not suffered.
  - Name what you consciously cut (the animation polish, an admin screen, IE support) and *why it was the right cut*.
  - Name what you refused to cut: tests on the money path, accessibility basics, error handling.
  - Communicated the tradeoff early, in writing, so nobody was surprised.
- **Result**: shipped on time; the deferred work landed in the next iteration (prove the "later" actually happened).

## Pitfalls

- "I worked 80-hour weeks" as the whole answer — that's a planning failure, not a skill.
- Cutting quality silently instead of scope loudly.
- No mention of the stakeholder conversation — deciding alone is a red flag at mid+ level.`,
    keyPoints: [
      "Under pressure, negotiate scope — don't default to heroics and long nights",
      "Show a must/should/later split made WITH the PM, communicated early and in writing",
      "Name the conscious cut and justify it; name what you refused to cut (quality on the money path)",
      "Quality is cut loudly or not at all — silent corner-cutting is the red flag",
      "Close the loop: shipped on time AND the deferred work actually landed later",
    ],
    followUpQuestions: [
      "How do you push back when a deadline is simply unrealistic?",
      "Tell me about a deadline you missed anyway — what happened?",
    ],
    relatedTopics: ["prioritization", "scope-negotiation", "stakeholder-management"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.BEHAVIORAL,
    difficulty: "junior",
    question:
      "Tell me about a time you received difficult feedback. How did you respond?",
    answer: `## What They're Really Asking

Are you coachable? Teams run on feedback; someone who gets defensive is expensive to work with. They're listening for ego management and — crucially — whether the feedback produced a visible change.

## STAR Skeleton

- **Situation**: specific, uncomfortable feedback. Real examples land: "my PRs were too large to review", "I dominated design discussions", "my communication with QA was curt."
- **Action**: the three beats:
  1. **Didn't react defensively** in the moment — asked clarifying questions instead ("can you give me a recent example?").
  2. **Sat with it and found the truth in it**, even if the delivery stung.
  3. **Changed something concrete and measurable** — capped PR size, started writing design docs before meetings, added a weekly sync.
- **Result**: the behavior change stuck, and ideally the person who gave the feedback noticed and said so.

## Pitfalls

- Picking feedback you secretly think was wrong and relitigating it in the interview.
- "I always love feedback!" — nobody believes it; pick something that genuinely stung.
- No visible change afterward — feedback without action is the actual red flag.`,
    keyPoints: [
      "Pick feedback that genuinely stung and was true — not one you're still disputing",
      "In the moment: ask clarifying questions, don't defend ('can you give me an example?')",
      "Convert it into one concrete, measurable behavior change",
      "Show the change stuck — ideally the feedback-giver noticed and acknowledged it",
      "Coachability is the trait being tested; defensiveness is the instant fail",
    ],
    followUpQuestions: [
      "Tell me about feedback you disagreed with — what did you do?",
      "How do you deliver difficult feedback to someone else?",
    ],
    relatedTopics: ["feedback-culture", "coachability", "growth-mindset"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.BEHAVIORAL,
    difficulty: "senior",
    question:
      "Tell me about a time you disagreed with a technical decision your team or manager made. What did you do?",
    answer: `## What They're Really Asking

Senior calibration: do you fight for what's right, and can you commit when you lose? They want evidence of both spine (you pushed back with substance) and maturity ("disagree and commit" once the call was made).

## STAR Skeleton

- **Situation**: a decision with real consequences — architecture choice, buy-vs-build, killing a project.
- **Action**:
  1. Made the case **with evidence**: a doc, a benchmark, a prototype — not hallway opinions.
  2. Argued in the right forum, once, clearly — then stopped relitigating.
  3. When overruled: **committed visibly**. Didn't sandbag, didn't say "told you so" in standups.
  4. Optionally: defined the tripwire — "if p95 crosses 400ms, we revisit" — turning disagreement into a testable bet.
- **Result**: either you were right and the tripwire brought it back with your credibility intact, or you were wrong and you learned why — both are strong endings.

## Pitfalls

- Stories where you went around your manager or quietly did it your way anyway.
- Confusing stubbornness with conviction — the skill is *changing the decision-making*, not winning.
- "I disagreed but said nothing" — that's the worst answer at senior level.`,
    keyPoints: [
      "Push back with evidence — a doc, benchmark, or prototype, argued once in the right forum",
      "When overruled, commit visibly: no sandbagging, no 'told you so'",
      "Turn disagreement into a testable bet with a tripwire metric for revisiting",
      "Both endings are strong: proven right with credibility intact, or wrong and wiser",
      "Never go around the decision or comply silently — both fail at senior level",
    ],
    followUpQuestions: [
      "Tell me about a time you changed a decision after it was made — how?",
      "How do you handle a teammate who won't commit after losing a debate?",
    ],
    relatedTopics: ["disagree-and-commit", "technical-influence", "decision-making"],
    source: "seed",
    commonAt: ["Amazon (Leadership Principles)", "Meta", "Stripe"],
  },
  {
    category: QUESTION_CATEGORIES.BEHAVIORAL,
    difficulty: "senior",
    question:
      "Tell me about a time you mentored someone or raised the bar for your team.",
    answer: `## What They're Really Asking

At senior level you're paid for *multiplied* output. They want proof you make other engineers better — deliberately, not accidentally — and that you can point at the delta you created.

## STAR Skeleton

- **Situation/Task**: a specific person or team gap — a junior drowning in review comments, a team with no testing culture, flaky deploys everyone tolerated.
- **Action**: show a *system*, not just goodwill:
  - Diagnosed the actual gap (skill? confidence? process?).
  - Deliberate mechanism: pairing schedule, PR review rubric, tech-talk series, "good first issue" pipeline, a written onboarding doc.
  - Adjusted based on what worked; gave the person increasing scope and public credit.
- **Result**: measurable delta — the junior now leads a workstream, review turnaround halved, test coverage on new code went from 0 to standard practice. Name what THEY achieved, not what you did.

## Pitfalls

- "I'm always happy to answer questions" — that's availability, not mentorship.
- Taking credit for the mentee's wins; the flex is their independence.
- No mechanism — senior-level mentorship is designed, not incidental.`,
    keyPoints: [
      "Mentorship is a designed system: pairing cadence, rubrics, docs — not 'I answer questions'",
      "Diagnose the real gap first: skill vs confidence vs process",
      "Give increasing scope and public credit; the goal is their independence",
      "Measure the delta: what the mentee/team achieves NOW that they couldn't before",
      "The flex is multiplied output — their wins, not yours",
    ],
    followUpQuestions: [
      "Tell me about someone you mentored who didn't improve — what did you do?",
      "How do you raise engineering standards without becoming the process police?",
    ],
    relatedTopics: ["mentorship", "technical-leadership", "team-multiplier"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.BEHAVIORAL,
    difficulty: "junior",
    question: "Why do you want to work here?",
    answer: `## What They're Really Asking

Did you do your homework, and will you stay? Generic answers signal you're spraying applications; specific ones signal genuine intent. This question is free points for anyone who prepared.

## The Three-Layer Answer

1. **The product/mission** (specific): name the actual product, a feature you used, a recent launch or engineering blog post. "I read your post on migrating to RSC and the tradeoffs you documented" beats "you're innovative."
2. **The craft match**: connect their stack and challenges to what you want to get better at — "you're doing offline-first sync at scale, which is exactly the class of problem I want to go deep on."
3. **The values fit** (one sentence): something true about how they work — small teams, writing culture, accessibility bar — that matches how you work best.

## Pitfalls

- Compliments that could apply to any company ("great culture, smart people").
- Leading with compensation, prestige, or "I need a job."
- Knowing nothing concrete about the product — instant rejection at strong companies.

Prepare a distinct version of this for every company you interview with.`,
    keyPoints: [
      "Three layers: specific product knowledge → craft match with their stack → values fit",
      "Cite something concrete: a feature, launch, or engineering blog post you actually read",
      "Connect their technical challenges to skills you deliberately want to deepen",
      "Anything that could apply to any company is a wasted sentence",
      "Prepare a distinct version per company — this question is free points",
    ],
    followUpQuestions: [
      "What do you know about our product's biggest challenges?",
      "What would make you turn down an offer from us?",
    ],
    relatedTopics: ["company-research", "motivation", "culture-fit"],
    source: "seed",
  },
  {
    category: QUESTION_CATEGORIES.BEHAVIORAL,
    difficulty: "junior",
    question:
      "Do you have any questions for us? (And what should you actually ask?)",
    answer: `## Why This Matters

"No questions" reads as no interest. This slot is also your best data source: you're deciding whether to join them, and thoughtful questions raise their evaluation of you at the same time.

## Strong Questions

- **Team reality**: "Walk me through how a feature goes from idea to production here." (Reveals process maturity, deploy frequency, autonomy.)
- **Calibration**: "What separates a good engineer from a great one on this team?" (Tells you what they actually reward.)
- **Health check**: "What's the biggest source of friction in your day-to-day right now?" (Honest teams answer honestly.)
- **For the manager**: "How do you handle it when a project is clearly slipping?"
- **Growth**: "Can you give an example of someone who grew significantly here — what did that look like?"

## Avoid

- Anything answered on the careers page.
- Compensation/vacation in the technical rounds — save it for the recruiter.
- Zero questions, or one limp "what's the culture like?"

Prepare five; ask two or three based on time. Write their answers down — you'll want them when comparing offers.`,
    keyPoints: [
      "Always have questions prepared — 'no questions' reads as no interest",
      "Ask process reality: 'how does a feature go from idea to production here?'",
      "Ask calibration: 'what separates good from great on this team?'",
      "Friction questions ('biggest day-to-day pain?') reveal team honesty",
      "Save comp/perks for the recruiter; prepare five questions, ask two or three",
    ],
    followUpQuestions: [
      "What would you want to know before accepting an offer?",
      "What red flags do you look for in an interview process?",
    ],
    relatedTopics: ["reverse-interview", "offer-evaluation", "interview-closers"],
    source: "seed",
  },
];
