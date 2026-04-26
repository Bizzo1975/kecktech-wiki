import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { requireApiToken } from "../../../../lib/auth";
import { markdownToSanitizedHtml, sanitizeArticleHtml } from "../../../../lib/content";

const importSchema = z.object({
  bookSlug: z.string().min(1),
  chapterSlug: z.string().optional(),
  title: z.string().min(1),
  slug: z.string().min(1),
  markdown: z.string().optional(),
  html: z.string().optional(),
  summary: z.string().optional(),
  tags: z.array(z.object({ name: z.string().min(1), value: z.string().optional() })).optional(),
  kbId: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  reviewStatus: z.enum(["DRAFT", "IN_REVIEW", "APPROVED", "NEEDS_FIX"]).optional(),
  reviewNotes: z.string().optional(),
  reviewerName: z.string().optional(),
  sourceReferences: z.string().optional(),
  factChecklist: z.record(z.string(), z.boolean()).optional()
}).refine((data) => Boolean(data.html?.trim() || data.markdown?.trim()), {
  message: "Either html or markdown must be provided"
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    await requireApiToken();
    const payload = importSchema.parse(await req.json());

    const book = await prisma.book.findFirst({
      where: { slug: payload.bookSlug, deletedAt: null }
    });
    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const chapter = payload.chapterSlug
      ? await prisma.chapter.findFirst({
          where: { bookId: book.id, slug: payload.chapterSlug, deletedAt: null }
        })
      : null;

    const markdownContent = payload.markdown?.trim() ?? "";
    const htmlContent = payload.html?.trim()
      ? sanitizeArticleHtml(payload.html)
      : markdownToSanitizedHtml(markdownContent);

    const page = await prisma.page.upsert({
      where: {
        bookId_slug: {
          bookId: book.id,
          slug: payload.slug
        }
      },
      update: {
        title: payload.title,
        markdown: markdownContent,
        html: htmlContent,
        summary: payload.summary ?? null,
        chapterId: chapter?.id ?? null,
        kbId: payload.kbId ?? null,
        category: payload.category ?? null,
        subcategory: payload.subcategory ?? null,
        reviewStatus: payload.reviewStatus ?? "DRAFT",
        reviewNotes: payload.reviewNotes ?? null,
        reviewerName: payload.reviewerName ?? null,
        sourceReferences: payload.sourceReferences ?? null,
        factChecklist: payload.factChecklist,
        reviewedAt: payload.reviewerName ? new Date() : null
      },
      create: {
        bookId: book.id,
        chapterId: chapter?.id ?? null,
        title: payload.title,
        slug: payload.slug,
        markdown: markdownContent,
        html: htmlContent,
        summary: payload.summary ?? null,
        kbId: payload.kbId ?? null,
        category: payload.category ?? null,
        subcategory: payload.subcategory ?? null,
        reviewStatus: payload.reviewStatus ?? "DRAFT",
        reviewNotes: payload.reviewNotes ?? null,
        reviewerName: payload.reviewerName ?? null,
        sourceReferences: payload.sourceReferences ?? null,
        factChecklist: payload.factChecklist,
        reviewedAt: payload.reviewerName ? new Date() : null
      }
    });

    if (payload.tags?.length) {
      await prisma.contentTag.deleteMany({
        where: { pageId: page.id }
      });
      await prisma.contentTag.createMany({
        data: payload.tags.map((tag) => ({
          pageId: page.id,
          name: tag.name,
          value: tag.value ?? null
        }))
      });
    }

    const latestRevision = await prisma.pageRevision.findFirst({
      where: { pageId: page.id },
      orderBy: { version: "desc" }
    });

    await prisma.pageRevision.create({
      data: {
        pageId: page.id,
        version: (latestRevision?.version ?? 0) + 1,
        title: page.title,
        markdown: page.markdown,
        html: page.html
      }
    });

    await prisma.auditLog.create({
      data: {
        action: "IMPORT",
        resourceType: "PAGE",
        resourceId: page.id,
        payload: {
          title: page.title,
          slug: page.slug
        }
      }
    });

    return NextResponse.json({ id: page.id, slug: page.slug });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
