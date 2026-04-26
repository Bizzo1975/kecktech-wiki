import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const term = req.nextUrl.searchParams.get("term")?.trim() ?? "";
  if (!term) {
    return NextResponse.json({ results: [] });
  }

  const results = await prisma.page.findMany({
    where: {
      deletedAt: null,
      OR: [
        { title: { contains: term, mode: "insensitive" } },
        { html: { contains: term, mode: "insensitive" } },
        { tags: { some: { name: { contains: term, mode: "insensitive" } } } }
      ]
    },
    select: {
      id: true,
      title: true,
      slug: true,
      summary: true,
      updatedAt: true
    },
    take: 50,
    orderBy: { updatedAt: "desc" }
  });

  return NextResponse.json({ results });
}
