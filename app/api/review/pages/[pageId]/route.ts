import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../../lib/prisma";
import { requireApiToken } from "../../../../../lib/auth";

const reviewSchema = z.object({
  reviewStatus: z.enum(["DRAFT", "IN_REVIEW", "APPROVED", "NEEDS_FIX"]),
  reviewNotes: z.string().optional(),
  reviewerName: z.string().optional(),
  sourceReferences: z.string().optional(),
  factChecklist: z.record(z.string(), z.boolean()).optional()
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
): Promise<NextResponse> {
  try {
    await requireApiToken();
    const { pageId } = await params;
    const payload = reviewSchema.parse(await req.json());

    const page = await prisma.page.update({
      where: { id: pageId },
      data: {
        reviewStatus: payload.reviewStatus,
        reviewNotes: payload.reviewNotes ?? null,
        reviewerName: payload.reviewerName ?? null,
        sourceReferences: payload.sourceReferences ?? null,
        factChecklist: payload.factChecklist,
        reviewedAt: payload.reviewerName ? new Date() : null
      },
      select: { id: true, title: true, reviewStatus: true, reviewedAt: true }
    });

    return NextResponse.json(page);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
