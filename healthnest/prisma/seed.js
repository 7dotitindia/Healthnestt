/* Seeds development data: staff accounts, taxonomy, static pages, calculators and a few sample articles.
   Run with: npm run db:seed
   Dev login emails/passwords are defined below. Change them (or set the env vars) before any real deployment. */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const db = new PrismaClient();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@healthnestt.local";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Admin#Dev2026!";
const WRITER_EMAIL = process.env.SEED_WRITER_EMAIL || "writer@healthnestt.local";
const WRITER_PASSWORD = process.env.SEED_WRITER_PASSWORD || "Writer#Dev2026!";

const categories = [
  ["Diabetes", "diabetes", "Understand blood sugar, prediabetes and type 2 diabetes with practical, India-focused guidance."],
  ["Heart Health", "heart-health", "Blood pressure, cholesterol and heart-healthy habits explained in plain language."],
  ["Mental Health", "mental-health", "Anxiety, stress, burnout and when to reach out for support."],
  ["Women's Health", "womens-health", "PCOS, periods, pregnancy and menopause, explained clearly."],
  ["Nutrition", "nutrition", "Eating well with Indian foods, vitamins, protein and weight management."],
  ["Fitness", "fitness", "Walking, yoga and simple home workouts for every level."],
  ["Skin and Hair", "skin-and-hair", "Acne, hair fall, sun care and everyday skin health."],
  ["Sleep", "sleep", "Sleep habits, insomnia and getting better rest."],
  ["Child Health", "child-health", "Newborn care, common childhood illnesses, vaccines and nutrition."],
  ["Home Remedies and Ayurveda", "home-remedies-and-ayurveda", "A careful look at what the evidence says about common home remedies."],
];

const conditions = [
  ["Type 2 Diabetes", "type-2-diabetes", "diabetes", "Type 2 diabetes is a long-term condition in which the body does not use insulin well, so blood sugar stays high."],
  ["High Blood Pressure", "high-blood-pressure", "heart-health", "High blood pressure (hypertension) means the force of blood against artery walls is consistently too high."],
  ["Anxiety", "anxiety", "mental-health", "Anxiety involves persistent worry or fear that is hard to control and gets in the way of daily life."],
  ["PCOS", "pcos", "womens-health", "Polycystic ovary syndrome (PCOS) is a hormonal condition that can affect periods, ovulation and metabolism."],
  ["Insomnia", "insomnia", "sleep", "Insomnia is difficulty falling asleep, staying asleep or waking too early, despite having the chance to sleep."],
];

const calculators = [
  ["BMI Calculator", "bmi", "bmi", "Work out your body mass index from height and weight."],
  ["Daily Calorie Calculator", "calorie", "calorie", "Estimate how many calories you use each day."],
  ["Water Intake Calculator", "water", "water", "Get a rough daily water target based on body weight and activity."],
];

const pages = [
  ["About Healthnestt", "about", "<p>Healthnestt publishes clear, sourced health information for readers in India. Every article cites reputable sources and is checked by our editorial team before it goes live.</p><p>We do not diagnose or treat. If you are worried about your health, please talk to a qualified doctor.</p>"],
  ["Editorial Policy", "editorial-policy", "<p>Articles are written by paid freelance writers and reviewed by our editor before publication. Every article must cite reputable sources such as the WHO, ICMR, NIH, the Ministry of Health and peer-reviewed journals.</p><p>We do not publish diagnoses, dosage instructions or cure claims. Articles are re-checked on a regular schedule and updated when guidance changes.</p><p><em>Draft policy text. Replace with your final, legally reviewed version before launch.</em></p>"],
  ["Advertising Policy", "advertising-policy", "<p>Advertising and sponsored content, when present, are clearly labelled and never influence editorial decisions.</p><p><em>Draft policy text. Replace before launch.</em></p>"],
  ["Privacy Policy", "privacy", "<p>We collect only what we need: your email address if you subscribe to the newsletter, and basic analytics. We do not collect personal health data. You can unsubscribe at any time.</p><p><em>Draft policy text. Replace with a version reviewed for India's DPDP Act before launch.</em></p>"],
  ["Terms of Use", "terms", "<p>By using Healthnestt you agree that the content is for general information only.</p><p><em>Draft policy text. Replace before launch.</em></p>"],
  ["Medical Disclaimer", "disclaimer", "<p>The information on Healthnestt is for general educational purposes only. It is not a substitute for professional medical advice, diagnosis or treatment. Always seek the advice of a qualified health provider with any questions you may have about a medical condition. If you think you may have a medical emergency, call your local emergency number immediately.</p>"],
  ["Contact", "contact", "<p>Questions or corrections? Email the editorial team at the address published here once your mailbox is set up.</p>"],
];

const lorem = (intro, sections) =>
  `<p>${intro}</p>` +
  sections.map(([h, p]) => `<h2>${h}</h2><p>${p}</p>`).join("");

const samples = [
  {
    title: "Understanding Your Blood Pressure Reading",
    slug: "understanding-your-blood-pressure-reading",
    category: "heart-health",
    condition: "high-blood-pressure",
    excerpt: "What the two numbers on a blood pressure reading mean, and what to do if yours is often high.",
    body: lorem(
      "A blood pressure reading has two numbers, such as 120/80. Knowing what each number means helps you talk to your doctor with confidence.",
      [
        ["What the numbers mean", "The first (upper) number is systolic pressure, the force when your heart beats. The second (lower) number is diastolic pressure, the force between beats. Both matter. Blood pressure is measured in millimetres of mercury, written mmHg."],
        ["When it counts as high", "High blood pressure is diagnosed by a health professional after readings on more than one occasion. A single high reading does not always mean you have hypertension, because stress, caffeine and rushing can raise it temporarily. Many people have no symptoms, which is why regular checks are useful."],
        ["Everyday habits that help", "Eating less salt, staying active, keeping a healthy weight, limiting alcohol and not smoking all support healthy blood pressure. Take any medicine exactly as your doctor prescribes."],
        ["When to see a doctor", "See a doctor if your home readings are often high, or if you have chest pain, severe headache or sudden weakness. These can be signs of an emergency."],
      ],
    ),
    sources: [["Hypertension fact sheet", "World Health Organization", "https://www.who.int/news-room/fact-sheets/detail/hypertension", 2023]],
    featured: true,
  },
  {
    title: "Type 2 Diabetes: Early Signs and When to Get Tested",
    slug: "type-2-diabetes-early-signs-and-when-to-get-tested",
    category: "diabetes",
    condition: "type-2-diabetes",
    excerpt: "Common early signs of type 2 diabetes, who should consider testing, and why early action matters.",
    body: lorem(
      "Type 2 diabetes often develops slowly, and many people have no clear symptoms for years. Knowing the early signs can help you get tested sooner.",
      [
        ["Common early signs", "These can include feeling very thirsty, passing urine more often, feeling tired, blurred vision, slow-healing cuts and tingling in the hands or feet. Many of these also have other causes, so they are a reason to get checked, not a diagnosis."],
        ["Who should consider testing", "Adults with overweight, a family history of diabetes, high blood pressure or a history of gestational diabetes may be advised to test regularly. Ask your doctor how often is right for you."],
        ["How it is diagnosed", "Diagnosis uses blood tests such as fasting blood glucose or HbA1c, interpreted by a health professional."],
        ["Why early action matters", "Lifestyle changes such as a balanced diet and regular activity can help manage blood sugar and lower the risk of complications."],
      ],
    ),
    sources: [["Diabetes fact sheet", "World Health Organization", "https://www.who.int/news-room/fact-sheets/detail/diabetes", 2024]],
    featured: true,
  },
  {
    title: "How Much Physical Activity Do Adults Really Need?",
    slug: "how-much-physical-activity-do-adults-really-need",
    category: "fitness",
    condition: null,
    excerpt: "The weekly activity targets for adults, and simple ways to fit movement into a busy day.",
    body: lorem(
      "Regular movement supports your heart, mood, sleep and long-term health. The good news is that you do not need a gym to meet the guidelines.",
      [
        ["The weekly target", "Guidelines suggest adults aim for at least 150 to 300 minutes of moderate-intensity activity a week, or 75 to 150 minutes of vigorous activity, plus muscle-strengthening on two or more days."],
        ["What counts", "Brisk walking, cycling, swimming, yoga, dancing and climbing stairs all count. Even short bouts add up across the day."],
        ["Starting safely", "If you have been inactive or have a health condition, start slowly and increase gradually. Talk to your doctor before beginning a new programme if you are unsure."],
        ["Easy ways to move more", "Walk after meals, take the stairs, stand up every hour and schedule a short walk with a friend."],
      ],
    ),
    sources: [["Physical activity fact sheet", "World Health Organization", "https://www.who.int/news-room/fact-sheets/detail/physical-activity", 2024]],
    featured: false,
  },
];

async function main() {
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const writerHash = await bcrypt.hash(WRITER_PASSWORD, 12);

  const admin = await db.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: { name: "Admin", email: ADMIN_EMAIL, passwordHash: adminHash, role: "admin", slug: "admin", bio: "Editor of Healthnestt." },
  });
  const writer = await db.user.upsert({
    where: { email: WRITER_EMAIL },
    update: {},
    create: { name: "Sample Writer", email: WRITER_EMAIL, passwordHash: writerHash, role: "freelancer", slug: "sample-writer", bio: "Freelance health writer. This is a sample account." },
  });

  const catBySlug = {};
  for (const [i, [name, slug, description]] of categories.entries()) {
    catBySlug[slug] = await db.category.upsert({ where: { slug }, update: {}, create: { name, slug, description, position: i } });
  }
  const condBySlug = {};
  for (const [name, slug, catSlug, overview] of conditions) {
    condBySlug[slug] = await db.condition.upsert({
      where: { slug },
      update: {},
      create: { name, slug, overview, categoryId: catBySlug[catSlug].id },
    });
  }
  for (const [name, slug, type, description] of calculators) {
    await db.calculator.upsert({ where: { slug }, update: {}, create: { name, slug, type, description } });
  }
  for (const [title, slug, body] of pages) {
    await db.page.upsert({ where: { slug }, update: {}, create: { title, slug, body, seoTitle: title, seoDescription: title } });
  }

  const now = new Date();
  const next = new Date(now);
  next.setMonth(next.getMonth() + 12);
  for (const [idx, a] of samples.entries()) {
    const exists = await db.article.findUnique({ where: { slug: a.slug } });
    if (exists) continue;
    const words = a.body.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
    await db.article.create({
      data: {
        title: a.title,
        slug: a.slug,
        excerpt: a.excerpt,
        body: a.body,
        status: "published",
        seoTitle: a.title.slice(0, 60),
        seoDescription: a.excerpt.slice(0, 155),
        readingTimeMin: Math.max(1, Math.round(words / 200)),
        isFeatured: a.featured,
        featuredRank: a.featured ? idx + 1 : null,
        submittedAt: now,
        publishedAt: now,
        lastReviewedAt: now,
        nextReviewDueAt: next,
        authorId: writer.id,
        categoryId: catBySlug[a.category].id,
        conditionId: a.condition ? condBySlug[a.condition].id : null,
        sources: { create: a.sources.map(([title, publisher, url, publishedYear], position) => ({ title, publisher, url, publishedYear, position })) },
      },
    });
  }

  console.log("Seed complete. Dev accounts:");
  console.log(`  admin:      ${admin.email}`);
  console.log(`  freelancer: ${writer.email}`);
  console.log("Passwords are defined in prisma/seed.js (or SEED_* env vars).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
