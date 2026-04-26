const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function buildRemediatedMarkdown(title, currentMarkdown) {
  return `# ${title}

## Quick Summary
This article has been standardized to Kecktech Help Center format for safer support handling and clearer escalation.

## Scope
- Audience: End users and support staff
- Category: General/Uncategorized legacy article
- Goal: Resolve the issue consistently while reducing risk

## Step-by-Step Resolution
1. Confirm the exact symptom and capture any on-screen errors.
2. Verify basic conditions (power, connectivity, login/session validity).
3. Apply lowest-risk corrective action first and re-test.
4. If unresolved, review logs/history and isolate account vs device vs service cause.
5. Record final outcome and next preventive action.

## Safety and Security
- Do not disable protection controls permanently to force a result.
- Stop and escalate if sensitive data, account abuse, or malware indicators appear.

## Escalation Criteria
- Escalate when the issue remains reproducible after core steps.
- Escalate immediately for security, compliance, or business-critical impact.

## Legacy Source Content
${(currentMarkdown || "").trim() || "Legacy content was minimal and has been normalized."}
`;
}

async function run() {
  const pages = await prisma.page.findMany({
    where: { deletedAt: null, category: null },
    select: { id: true, title: true, markdown: true }
  });

  let updated = 0;
  for (const page of pages) {
    await prisma.page.update({
      where: { id: page.id },
      data: {
        category: "General",
        subcategory: "Legacy",
        markdown: buildRemediatedMarkdown(page.title, page.markdown),
        reviewStatus: "IN_REVIEW",
        reviewNotes: "Legacy uncategorized article normalized to standard help format; pending final SME approval.",
        reviewedAt: new Date()
      }
    });
    updated += 1;
  }

  console.log(`Remediation complete. Updated=${updated}`);
}

run()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
