import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(): Promise<NextResponse> {
  const [totals, byStatus, byCategory] = await Promise.all([
    prisma.page.count({ where: { deletedAt: null } }),
    prisma.page.groupBy({
      by: ["reviewStatus"],
      where: { deletedAt: null },
      _count: { _all: true }
    }),
    prisma.page.groupBy({
      by: ["category", "subcategory", "reviewStatus"],
      where: { deletedAt: null },
      _count: { _all: true }
    })
  ]);

  return NextResponse.json({
    totalPages: totals,
    statusSummary: byStatus.map((item) => ({
      reviewStatus: item.reviewStatus,
      count: item._count._all
    })),
    categorySummary: byCategory.map((item) => ({
      category: item.category ?? "Uncategorized",
      subcategory: item.subcategory ?? "General",
      reviewStatus: item.reviewStatus,
      count: item._count._all
    }))
  });
}
