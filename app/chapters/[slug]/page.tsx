import { notFound } from "next/navigation";
import { prisma } from "../../../lib/prisma";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export default async function ChapterPage({ params }: Params) {
  const { slug } = await params;
  const chapter = await prisma.chapter.findFirst({
    where: { slug, deletedAt: null },
    include: { book: true, pages: { where: { deletedAt: null }, orderBy: { updatedAt: "desc" } } }
  });
  if (!chapter) {
    notFound();
  }

  return (
    <main className="container">
      <section className="wiki-card">
        <p><a href="/">Help Center</a> / <a href={`/books/${chapter.book.slug}`}>{chapter.book.title}</a></p>
        <h1 style={{ marginTop: 0, fontFamily: "Poppins, sans-serif", color: "#1E3A5F" }}>{chapter.title}</h1>
        <p><strong>Book:</strong> {chapter.book.title}</p>
        <ul>
          {chapter.pages.map((page: { id: string; slug: string; title: string }) => (
            <li key={page.id}>
              <a href={`/pages/${page.slug}`}>{page.title}</a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
