import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Safety: resetDb deletes rows, so it refuses to run against anything but the test database.
function assertTestDb() {
  if (!/test\.db$/.test(process.env.DATABASE_URL || "")) {
    throw new Error(`Refusing to touch a non-test database: ${process.env.DATABASE_URL}`);
  }
}

export async function resetDb() {
  assertTestDb();
  // Children before parents.
  await db.reviewNote.deleteMany();
  await db.articleTag.deleteMany();
  await db.source.deleteMany();
  await db.article.deleteMany();
  await db.mediaAsset.deleteMany();
  await db.tag.deleteMany();
  await db.condition.deleteMany();
  await db.category.deleteMany();
  await db.page.deleteMany();
  await db.newsletterSubscriber.deleteMany();
  await db.emailLog.deleteMany();
  await db.user.deleteMany();
}

let counter = 0;
const next = () => ++counter;
const HASH = bcrypt.hashSync("Test-pass-123", 4); // low cost so tests stay fast
export const TEST_PASSWORD = "Test-pass-123";

export async function makeUser(role = "freelancer", extra = {}) {
  const n = next();
  return db.user.create({
    data: {
      name: `${role} ${n}`,
      email: `${role}${n}@test.local`,
      slug: `${role}-${n}`,
      role,
      passwordHash: HASH,
      ...extra,
    },
  });
}

export const makeCategory = (extra = {}) => {
  const n = next();
  return db.category.create({
    data: { name: `Category ${n}`, slug: `category-${n}`, description: "A category description that is long enough.", ...extra },
  });
};

export const makeMedia = (uploadedById, extra = {}) => {
  const n = next();
  const filename = `${String(n).padStart(32, "a")}.png`;
  return db.mediaAsset.create({
    data: { filename, url: `/uploads/${filename}`, mimeType: "image/png", sizeBytes: 70, uploadedById, ...extra },
  });
};

// Directly inserts an article (bypasses the actions) so a test can start from any status.
export function makeArticle(authorId, extra = {}) {
  const n = next();
  return db.article.create({
    data: { title: `Seeded article number ${n} for tests`, slug: `seeded-${n}`, authorId, ...extra },
  });
}

// Chooses who the mocked session says is logged in. Pass null for logged out.
export function loginAs(user) {
  getCurrentUser.mockResolvedValue(
    user ? { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status ?? "active", slug: user.slug } : null,
  );
}

export function form(fields = {}) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) if (v !== undefined && v !== null) fd.set(k, String(v));
  return fd;
}

// Server actions end with redirect(), which throws. Returns { redirectTo } or { result }.
export async function run(fn) {
  try {
    return { result: await fn() };
  } catch (e) {
    if (e?.redirectTo) return { redirectTo: e.redirectTo };
    throw e;
  }
}

const WORDS = "Drinking enough water helps your body regulate temperature and keep energy steady during hot weather. ";
// About 180 words, comfortably over the 100-word minimum for submitting.
export const longBody = `<p>${WORDS.repeat(7)}</p><h2>When to see a doctor</h2><p>${WORDS.repeat(5)}</p>`;

// A complete, valid article form as a freelancer would submit it.
export async function validArticleFields(uploaderId, overrides = {}) {
  const cover = await makeMedia(uploaderId);
  const category = await makeCategory();
  return {
    title: "A clear and helpful title for a test article",
    excerpt: "A short summary of the article that is comfortably long enough to pass validation.",
    body: longBody,
    categoryId: category.id,
    coverImageUrl: cover.url,
    coverImageAlt: "A glass of water",
    tags: "water, summer",
    sources: JSON.stringify([{ title: "Water and health", publisher: "WHO", url: "https://www.who.int/example", publishedYear: 2023 }]),
    ...overrides,
  };
}
