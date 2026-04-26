const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();
const OUTPUT_PATH = path.resolve(__dirname, "../reports/article-validation-report.json");

function hasAny(text, patterns) {
  const lower = text.toLowerCase();
  return patterns.some((p) => lower.includes(p));
}

function validatePage(page) {
  const issues = [];
  const markdown = (page.markdown || "").trim();
  const lower = markdown.toLowerCase();

  if (markdown.length < 800) {
    issues.push("Content length under 800 characters.");
  }

  if (!hasAny(lower, ["quick summary", "scope"])) {
    issues.push("Missing summary/scope section.");
  }

  if (!hasAny(lower, ["step-by-step", "verified resolution workflow", "resolution"])) {
    issues.push("Missing explicit workflow section.");
  }

  if (!hasAny(lower, ["security", "safety"])) {
    issues.push("Missing safety/security guidance.");
  }

  if (!hasAny(lower, ["escalation"])) {
    issues.push("Missing escalation criteria.");
  }

  const category = (page.category || "").toLowerCase();
  if (category.includes("windows") || category.includes("laptop")) {
    if (!hasAny(lower, ["event viewer", "sfc /scannow", "dism"])) {
      issues.push("Windows/Laptop article missing diagnostic command/check references.");
    }
  }
  if (category.includes("smartphone")) {
    if (!hasAny(lower, ["ios", "android", "carrier", "network settings"])) {
      issues.push("Smartphone article missing mobile-specific checks.");
    }
  }
  if (category.includes("business tech")) {
    if (!hasAny(lower, ["mfa", "rbac", "tenant", "audit"])) {
      issues.push("Business Tech article missing business controls context.");
    }
  }

  return issues;
}

async function run() {
  const pages = await prisma.page.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      kbId: true,
      slug: true,
      title: true,
      markdown: true,
      category: true,
      subcategory: true,
      reviewStatus: true
    }
  });

  const failing = [];
  const passing = [];

  for (const page of pages) {
    const issues = validatePage(page);
    if (issues.length > 0) {
      failing.push({ ...page, issues });
      await prisma.page.update({
        where: { id: page.id },
        data: {
          reviewStatus: "NEEDS_FIX",
          reviewNotes: issues.join(" "),
          reviewedAt: new Date()
        }
      });
    } else {
      passing.push(page);
      if (page.reviewStatus === "DRAFT") {
        await prisma.page.update({
          where: { id: page.id },
          data: {
            reviewStatus: "IN_REVIEW",
            reviewNotes: "Automated structural validation passed; pending SME factual sign-off.",
            reviewedAt: new Date()
          }
        });
      }
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    total: pages.length,
    passedStructuralValidation: passing.length,
    failedStructuralValidation: failing.length,
    failingByCategory: failing.reduce((acc, item) => {
      const key = item.category || "Uncategorized";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}),
    failures: failing.map((item) => ({
      kbId: item.kbId,
      title: item.title,
      slug: item.slug,
      category: item.category,
      subcategory: item.subcategory,
      issues: item.issues
    }))
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(report, null, 2), "utf8");
  console.log(`Validation complete. Total=${report.total}, Passed=${report.passedStructuralValidation}, Failed=${report.failedStructuralValidation}`);
  console.log(`Report written: ${OUTPUT_PATH}`);
}

run()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
