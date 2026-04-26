const { PrismaClient } = require("@prisma/client");
const { marked } = require("marked");
const sanitizeHtml = require("sanitize-html");

const prisma = new PrismaClient();

const sanitizeOptions = {
  allowedTags: [
    "h1", "h2", "h3", "h4", "h5", "h6",
    "p", "br", "hr",
    "ul", "ol", "li",
    "blockquote", "pre", "code",
    "strong", "em", "u", "s",
    "a", "table", "thead", "tbody", "tr", "th", "td"
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    "*": []
  },
  allowedSchemes: ["http", "https", "mailto"]
};

function toHtml(markdown) {
  const raw = marked.parse(markdown || "", { breaks: true, gfm: true });
  const html = typeof raw === "string" ? raw : String(raw);
  return sanitizeHtml(html, sanitizeOptions);
}

async function run() {
  const pages = await prisma.page.findMany({
    where: { deletedAt: null }
  });

  let updatedPages = 0;
  for (const page of pages) {
    const html = toHtml(page.markdown || "");
    await prisma.page.update({
      where: { id: page.id },
      data: { html }
    });
    updatedPages += 1;
  }

  const revisions = await prisma.pageRevision.findMany();
  let updatedRevisions = 0;
  for (const rev of revisions) {
    const html = toHtml(rev.markdown || "");
    await prisma.pageRevision.update({
      where: { id: rev.id },
      data: { html }
    });
    updatedRevisions += 1;
  }

  console.log(`HTML migration complete. Pages=${updatedPages}, Revisions=${updatedRevisions}`);
}

run()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
