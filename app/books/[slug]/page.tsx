import { notFound } from "next/navigation";
import { prisma } from "../../../lib/prisma";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export default async function BookPage({ params }: Params) {
  const { slug } = await params;
  const book = await prisma.book.findFirst({
    where: { slug, deletedAt: null },
    include: { chapters: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } }, pages: { where: { deletedAt: null }, orderBy: { updatedAt: "desc" } } }
  });
  if (!book) {
    notFound();
  }

  return (
    <main className="container">
      <section className="wiki-card">
        <p><a href="/">Help Center</a></p>
        <h1 style={{ marginTop: 0, fontFamily: "Poppins, sans-serif", color: "#1E3A5F" }}>{book.title}</h1>
        {book.description ? <p>{book.description}</p> : null}
        <h2>Chapters</h2>
        <ul>
          {book.chapters.map((chapter: { id: string; slug: string; title: string }) => (
            <li key={chapter.id}>
              <a href={`/chapters/${chapter.slug}`}>{chapter.title}</a>
            </li>
          ))}
        </ul>
        <h2>Recent Pages</h2>
        <ul>
          {book.pages.map((page: { id: string; slug: string; title: string }) => (
            <li key={page.id}>
              <a href={`/pages/${page.slug}`}>{page.title}</a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
