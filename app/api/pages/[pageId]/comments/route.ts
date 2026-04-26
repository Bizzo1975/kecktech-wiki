import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../../lib/prisma";
import { requireApiToken } from "../../../../../lib/auth";

const commentSchema = z.object({
  authorId: z.string().uuid(),
  body: z.string().min(1),
  parentId: z.string().uuid().optional()
});

type Params = { params: Promise<{ pageId: string }> };

export async function GET(_: NextRequest, { params }: Params): Promise<NextResponse> {
  const { pageId } = await params;
  const comments = await prisma.comment.findMany({
    where: { pageId, deletedAt: null },
    include: { author: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" }
  });
  return NextResponse.json({ comments });
}

export async function POST(req: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    await requireApiToken();
    const { pageId } = await params;
    const payload = commentSchema.parse(await req.json());

    const page = await prisma.page.findFirst({ where: { id: pageId, deletedAt: null } });
    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const comment = await prisma.comment.create({
      data: {
        pageId,
        authorId: payload.authorId,
        body: payload.body,
        parentId: payload.parentId ?? null
      }
    });

    await prisma.auditLog.create({
      data: {
        action: "CREATE",
        resourceType: "PAGE",
        resourceId: pageId,
        payload: { commentId: comment.id }
      }
    });

    return NextResponse.json({ id: comment.id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
