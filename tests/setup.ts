// tests/setup.ts

import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Each test file gets its own throwaway database — the db module reads
// this before opening its singleton connection, so real study data in
// data/frontmaster.db is never touched by tests.
process.env.FRONTMASTER_DB_PATH = join(
  mkdtempSync(join(tmpdir(), "frontmaster-test-")),
  "test.db",
);
