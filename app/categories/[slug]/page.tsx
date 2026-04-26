import { notFound } from "next/navigation";
import { prisma } from "../../../lib/prisma";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export default async function CategoryPage({ params }: Params) {
  const { slug } = await params;
  const shelf = await prisma.shelf.findFirst({
    where: { slug, deletedAt: null },
    include: {
      books: {
        where: { deletedAt: null },
        include: {
          pages: {
            where: { deletedAt: null },
            orderBy: { updatedAt: "desc" },
            take: 6
          }
        },
        orderBy: { title: "asc" }
      }
    }
  });

  if (!shelf) notFound();

  return (
    <main className="container">
      <section className="wiki-card">
        <p><a href="/">Back to Help Center</a></p>
        <h1 style={{ marginTop: 0 }}>{shelf.title}</h1>
        <p>{shelf.description || "Browse subcategories and articles in this area."}</p>
      </section>

      <div className="wiki-grid">
        {shelf.books.map((book) => (
          <section className="wiki-card" key={book.id}>
            <h2><a href={`/books/${book.slug}`}>{book.title}</a></h2>
            <ul>
              {book.pages.map((page) => (
                <li key={page.id}>
                  <a href={`/pages/${page.slug}`}>{page.title}</a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
