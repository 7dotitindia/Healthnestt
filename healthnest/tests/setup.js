import { vi } from "vitest";

// Stand-ins for Next.js runtime pieces. redirect() really throws in Next, so tests catch it
// with the helper in tests/helpers.js.
vi.mock("next/navigation", () => ({
  redirect: (url) => {
    throw Object.assign(new Error(`NEXT_REDIRECT:${url}`), { redirectTo: url });
  },
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": "10.0.0.1" }),
  cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }),
}));

// The signed-cookie session itself is not under test here. Tests choose who is "logged in".
vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn(async () => null) }));
vi.mock("@/lib/session", () => ({
  createSession: vi.fn(async () => {}),
  destroySession: vi.fn(async () => {}),
  readSessionUserId: vi.fn(async () => null),
}));
