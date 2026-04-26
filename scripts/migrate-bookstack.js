require("dotenv").config();

const fetch = require("node-fetch");

const BOOKSTACK_URL = process.env.BOOKSTACK_URL;
const BOOKSTACK_TOKEN_ID = process.env.BOOKSTACK_TOKEN_ID;
const BOOKSTACK_TOKEN_SECRET = process.env.BOOKSTACK_TOKEN_SECRET;
const CUSTOM_WIKI_URL = process.env.CUSTOM_WIKI_URL || "http://localhost:3011";
const CUSTOM_WIKI_API_TOKEN = process.env.CUSTOM_WIKI_API_TOKEN;

function assertEnv() {
  const required = [
    "BOOKSTACK_URL",
    "BOOKSTACK_TOKEN_ID",
    "BOOKSTACK_TOKEN_SECRET",
    "CUSTOM_WIKI_API_TOKEN"
  ];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`Missing required variables: ${missing.join(", ")}`);
  }
}

async function bsApi(endpoint) {
  const res = await fetch(`${BOOKSTACK_URL}/api/${endpoint}`, {
    headers: {
      Authorization: `Token ${BOOKSTACK_TOKEN_ID}:${BOOKSTACK_TOKEN_SECRET}`
    }
  });
  if (!res.ok) {
    throw new Error(`BookStack API error ${endpoint}: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function cwApi(path, payload) {
  const res = await fetch(`${CUSTOM_WIKI_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CUSTOM_WIKI_API_TOKEN}`
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error(`Custom wiki API error ${path}: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function run() {
  assertEnv();

  const books = await bsApi("books?count=500");
  const chapters = await bsApi("chapters?count=500");
  const pages = await bsApi("pages?count=500");

  const chapterById = new Map((chapters.data || []).map((c) => [c.id, c]));
  const bookById = new Map((books.data || []).map((b) => [b.id, b]));
  const hierarchyCache = new Set();

  for (const page of pages.data || []) {
    const book = bookById.get(page.book_id);
    const chapter = page.chapter_id ? chapterById.get(page.chapter_id) : null;
    const shelfSlug = "bookstack-migrated";
    const shelfTitle = "BookStack Migrated";
    const bookSlug = (book?.slug || `book-${page.book_id}`).toLowerCase();
    const chapterSlug = chapter?.slug ? chapter.slug.toLowerCase() : undefined;
    const hierarchyKey = `${shelfSlug}:${bookSlug}:${chapterSlug || ""}`;

    if (!hierarchyCache.has(hierarchyKey)) {
      await cwApi("/api/import/hierarchy", {
        shelf: {
          title: shelfTitle,
          slug: shelfSlug
        },
        book: {
          title: book?.name || `Book ${page.book_id}`,
          slug: bookSlug,
          description: book?.description || ""
        },
        chapter: chapter
          ? {
              title: chapter.name,
              slug: chapterSlug,
              description: chapter.description || ""
            }
          : undefined
      });
      hierarchyCache.add(hierarchyKey);
    }

    await cwApi("/api/import/pages", {
      bookSlug,
      chapterSlug,
      title: page.name,
      slug: page.slug,
      markdown: page.markdown || page.html || "",
      summary: page.description || ""
    });
  }
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
