# FrontMaster

A local-first study app for frontend interview preparation:

- **Flashcards with spaced repetition** — SM-2 (Anki-style) scheduling with Again / Hard / Good / Easy ratings
- **Practice (cram) mode** — flip through every card in a topic, shuffled, without touching your review schedule
- **AI mock interviews** — a conversational interviewer that asks questions from the bank, grades your answers against key points, and gives you a final debrief
- **AI question generation** — grow the bank on demand, in your chosen category and difficulty
- **~78 curated questions** across 13 categories: JavaScript fundamentals, React patterns & internals, TypeScript, web performance, system design, CSS, security, accessibility, and more

Built with Next.js 15, TypeScript, Tailwind CSS, and a local SQLite database (via Node's built-in `node:sqlite` — no native build step). Everything runs and stays on your machine.

## Quick Start

**Prerequisites:** Node.js 22+ (the database uses Node's built-in SQLite module)

```bash
# 1. Install dependencies
npm install

# 2. Seed the question bank (creates data/frontmaster.db)
npm run seed

# 3. Start the app
npm run dev
```

Open http://localhost:3000 — the home page should show the seeded questions waiting to be studied.

### Enable the AI features (optional)

The mock interview and "Generate with AI" features need a [Moonshot AI](https://platform.moonshot.ai) API key. Everything else works without one.

```bash
cp .env.example .env.local
# then edit .env.local and set KIMI_API_KEY=sk-...
```

## How to Study

- **Review due** (default) — spaced repetition. Rate each card honestly; the SM-2 algorithm schedules the next review (the real intervals are shown on the rating buttons). Cards you fail come back sooner; cards you know drift out to weeks.
- **Practice all** — cramming before an interview. Every matching card, shuffled, schedule untouched. "Repeat later" sends a card to the back of the deck.
- The card back shows a concise **Quick Answer** (the key points); expand **Show full answer** for the deep dive.

### Keyboard shortcuts

| Key | Action |
| --- | --- |
| `Space` / `Enter` | Flip the card |
| `1` – `4` | Rate: Again / Hard / Good / Easy (review mode) |
| `Enter` / `→` | Next card (practice mode) |
| `R` | Repeat card later (practice mode) |
| `A` | Toggle the full answer |

### Mock interviews

Interview → pick topics, difficulty, question source, and count → the AI interviewer works through real questions from your bank, one at a time, and evaluates answers against each question's key points. End the session with the flag button to get a debrief: strengths, gaps, and what to study next.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run seed` | Add seed questions to `data/frontmaster.db` (idempotent — existing questions and your progress are kept) |
| `npm run seed:clear` | Remove seed questions and **all study progress**, then reseed fresh |

## Your Data

All state lives in a SQLite database at `data/frontmaster.db` — questions, spaced-repetition progress, and streaks. The file is **gitignored**: it's personal study data, created by `npm run seed` on first setup.

- Re-running `npm run seed` is safe — it only adds missing seed questions.
- To start completely fresh, delete `data/frontmaster.db` (and its `-wal`/`-shm` sidecars) and run `npm run seed` again, or use `npm run seed:clear`.
- Questions you add via the UI ("Add Question" / "Generate with AI") live only in the database — back up `data/frontmaster.db` if you want to keep them.
- Inspect it with any SQLite client: `sqlite3 data/frontmaster.db 'SELECT category, COUNT(*) FROM questions GROUP BY category'`.

### Adding to the question bank

- **In the app**: *Add Question* for manual entry, *Generate with AI* on the Questions page for AI-written ones (marked with an `AI` chip).
- **In code**: add entries to a category file in `data/*-questions.ts` (append at the end — seed IDs are positional) and run `npm run seed`. New categories are registered in `src/types/question.types.ts` and `src/lib/constants/categories.ts`.

## Notes

- The `dev`/`start` scripts set `NODE_OPTIONS=--dns-result-order=ipv4first` — a workaround for machines with broken IPv6, where API calls to Moonshot would otherwise hang.
- AI responses stream through `src/app/api/chat/route.ts`; the interviewer's system prompt is built server-side in `src/app/interview/[sessionId]/page.tsx`.
