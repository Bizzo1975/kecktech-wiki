import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { requireApiToken } from "../../../../lib/auth";

const hierarchySchema = z.object({
  shelf: z.object({
    title: z.string().min(1),
    slug: z.string().min(1),
    description: z.string().optional()
  }),
  book: z.object({
    title: z.string().min(1),
    slug: z.string().min(1),
    description: z.string().optional()
  }),
  chapter: z
    .object({
      title: z.string().min(1),
      slug: z.string().min(1),
      description: z.string().optional()
    })
    .optional()
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    await requireApiToken();
    const payload = hierarchySchema.parse(await req.json());

    const shelf = await prisma.shelf.upsert({
      where: { slug: payload.shelf.slug },
      update: {
        title: payload.shelf.title,
        description: payload.shelf.description ?? null
      },
      create: {
        title: payload.shelf.title,
        slug: payload.shelf.slug,
        description: payload.shelf.description ?? null
      }
    });

    const book = await prisma.book.upsert({
      where: { shelfId_slug: { shelfId: shelf.id, slug: payload.book.slug } },
      update: {
        title: payload.book.title,
        description: payload.book.description ?? null
      },
      create: {
        shelfId: shelf.id,
        title: payload.book.title,
        slug: payload.book.slug,
        description: payload.book.description ?? null
      }
    });

    let chapterId: string | null = null;
    if (payload.chapter) {
      const chapter = await prisma.chapter.upsert({
        where: { bookId_slug: { bookId: book.id, slug: payload.chapter.slug } },
        update: {
          title: payload.chapter.title,
          description: payload.chapter.description ?? null
        },
        create: {
          bookId: book.id,
          title: payload.chapter.title,
          slug: payload.chapter.slug,
          description: payload.chapter.description ?? null
        }
      });
      chapterId = chapter.id;
    }

    return NextResponse.json({
      shelfId: shelf.id,
      bookId: book.id,
      chapterId
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
