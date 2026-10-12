import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// Builds a fresh test database before any test runs.
// It deletes only prisma/test.db (a throwaway file) and recreates it with a plain
// `prisma db push`. No reset flags, and the development database is never touched.
const TEST_DB = path.resolve("prisma", "test.db");

export default function setup() {
  if (path.basename(TEST_DB) !== "test.db") throw new Error("Refusing to delete a non-test database.");
  for (const f of [TEST_DB, `${TEST_DB}-journal`]) fs.rmSync(f, { force: true });

  execSync("npx prisma db push --skip-generate", {
    stdio: "pipe",
    env: { ...process.env, DATABASE_URL: "file:./test.db", PRISMA_HIDE_UPDATE_MESSAGE: "1" },
  });
}
