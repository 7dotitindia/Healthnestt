import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// Builds a fresh throwaway SQLite test database before any test runs.
// The real schema targets Postgres, so this derives a SQLite copy of it (prisma/.test/schema.prisma),
// generates a separate client for it (node_modules/.prisma/client-test, which vitest.config.mjs aliases
// to "@prisma/client") and pushes the schema to prisma/test.db. The development client and database
// are never touched. Only prisma/test.db and prisma/.test/ are ever deleted.
const TEST_DB = path.resolve("prisma", "test.db");
const TEST_DIR = path.resolve("prisma", ".test");

export default function setup() {
  if (path.basename(TEST_DB) !== "test.db") throw new Error("Refusing to delete a non-test database.");
  for (const f of [TEST_DB, `${TEST_DB}-journal`]) fs.rmSync(f, { force: true });
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
  fs.mkdirSync(TEST_DIR, { recursive: true });

  const schema = fs
    .readFileSync(path.resolve("prisma", "schema.prisma"), "utf8")
    .replace('provider = "postgresql"', 'provider = "sqlite"')
    .replace(/\r?\n[ \t]*directUrl[ \t]*=[^\r\n]*/, "")
    .replace("generator client {", 'generator client {\n  output = "../../node_modules/.prisma/client-test"');
  const schemaPath = path.join(TEST_DIR, "schema.prisma");
  fs.writeFileSync(schemaPath, schema);

  const env = {
    ...process.env,
    DATABASE_URL: `file:${TEST_DB.replaceAll("\\", "/")}`,
    PRISMA_HIDE_UPDATE_MESSAGE: "1",
  };
  // db push also generates the client into the output folder above.
  execSync(`npx prisma db push --schema "${schemaPath}"`, { stdio: "pipe", env });
}
