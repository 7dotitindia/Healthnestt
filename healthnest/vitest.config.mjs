import { defineConfig } from "vitest/config";
import path from "node:path";
import os from "node:os";

// Tests use their own SQLite file (prisma/test.db), never the development database.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve("./src"),
      // "server-only" throws outside the Next.js server runtime, so tests swap in an empty module.
      "server-only": path.resolve("./tests/stubs/server-only.js"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.js"],
    globalSetup: ["./tests/globalSetup.js"],
    setupFiles: ["./tests/setup.js"],
    // One shared SQLite file, so test files run one at a time.
    fileParallelism: false,
    testTimeout: 20000,
    env: {
      DATABASE_URL: "file:./test.db",
      SESSION_SECRET: "test-secret-test-secret-test-secret-1234",
      SITE_URL: "http://localhost:3000",
      EMAIL_PROVIDER: "log",
      EMAIL_FROM: "Healthnestt Test <test@healthnestt.local>",
      RESEND_API_KEY: "",
      UPLOAD_DIR: path.join(os.tmpdir(), "healthnestt-test-uploads"),
    },
  },
});
