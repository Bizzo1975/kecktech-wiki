import { prisma } from "../../lib/prisma";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ term?: string; category?: string }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const { term = "", category = "" } = await searchParams;
  const query = term.trim();
  const selectedCategory = category.trim();

  const results = query
    ? await prisma.page.findMany({
        where: {
          deletedAt: null,
          ...(selectedCategory ? { category: selectedCategory } : {}),
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { html: { contains: query, mode: "insensitive" } },
            { tags: { some: { name: { contains: query, mode: "insensitive" } } } }
          ]
        },
        orderBy: { updatedAt: "desc" },
        take: 50,
        include: { book: true },
      })
    : [];

  const categories = await prisma.page.groupBy({
    by: ["category"],
    where: { deletedAt: null, category: { not: null } }
  });

  return (
    <main className="container">
      <section className="wiki-card">
        <h1 style={{ marginTop: 0 }}>Search Results</h1>
        <p>Showing results for: <strong>{query || "empty query"}</strong></p>
        <div className="chip-row">
          <a href={`/search?term=${encodeURIComponent(query)}`} className={!selectedCategory ? "chip chip-active" : "chip"}>All</a>
          {categories.map((entry) => {
            const cat = entry.category ?? "";
            const href = `/search?term=${encodeURIComponent(query)}&category=${encodeURIComponent(cat)}`;
            const active = selectedCategory.toLowerCase() === cat.toLowerCase();
            return <a key={cat} href={href} className={active ? "chip chip-active" : "chip"}>{cat}</a>;
          })}
        </div>
        {!query ? <p>Enter a keyword from the homepage search bar.</p> : null}
        {query && results.length === 0 ? <p>No articles matched your search.</p> : null}
        {results.length > 0 ? (
          <ul className="results-list">
            {results.map((page) => (
              <li key={page.id} className="result-item">
                <a href={`/pages/${page.slug}`}>{page.title}</a>
                <div className="result-meta">
                  <span>{page.category ?? "General"} / {page.subcategory ?? page.book.title}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </main>
  );
}
