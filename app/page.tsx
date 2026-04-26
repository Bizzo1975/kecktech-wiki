import { prisma } from "../lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Maps shelf/category names to Kecktech service brand colors and icons.
 * Matches the 5-service identity from the brand guide (Section 06).
 */
function getCategoryStyle(title: string): { color: string; icon: string } {
  const t = title.toLowerCase();

  if (
    t.includes("senior") || t.includes("elder") || t.includes("smartphone") ||
    t.includes("tablet") || t.includes("iphone") || t.includes("ipad") ||
    t.includes("android") || t.includes("mobile")
  ) {
    return { color: "#7C3AED", icon: "👴" };
  }

  if (
    t.includes("laptop") || t.includes("hardware") || t.includes("printer") ||
    t.includes("monitor") || t.includes("peripheral") || t.includes("haas") ||
    t.includes("device")
  ) {
    return { color: "#2E7D32", icon: "💻" };
  }

  if (
    t.includes("network") || t.includes("hosting") || t.includes("server") ||
    t.includes("router") || t.includes("firewall") || t.includes("vpn") ||
    t.includes("wifi") || t.includes("wi-fi") || t.includes("internet")
  ) {
    return { color: "#4A6887", icon: "🌐" };
  }

  if (
    t.includes("software") || t.includes("app") || t.includes("application") ||
    t.includes("ai") || t.includes("custom") || t.includes("development")
  ) {
    return { color: "#C07810", icon: "🤖" };
  }

  return { color: "#0D6E6E", icon: "🖥️" };
}

export default async function HomePage() {
  const [shelves, pages, statusCounts] = await Promise.all([
    prisma.shelf.findMany({
      where: { deletedAt: null },
      orderBy: { title: "asc" },
      include: {
        books: {
          where: { deletedAt: null },
          include: { _count: { select: { pages: { where: { deletedAt: null } } } } }
        }
      }
    }),
    prisma.page.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { book: true }
    }),
    prisma.page.groupBy({
      by: ["reviewStatus"],
      where: { deletedAt: null },
      _count: { _all: true }
    })
  ]);

  const totalArticles = await prisma.page.count({ where: { deletedAt: null } });
  const approvedCount = statusCounts.find((item) => item.reviewStatus === "APPROVED")?._count._all ?? 0;

  return (
    <>
      <section className="wiki-hero">
        <div className="wiki-hero-overlay" aria-hidden="true" />
        <div className="wiki-hero-inner container">
          <h1>Kecktech Help Center</h1>
          <p>
            Find step-by-step guides fast. Browse by category, search by issue, and follow verified support instructions.
          </p>
          <form action="/search" method="get" className="wiki-search-form">
            <input
              name="term"
              type="search"
              placeholder="Search: startup issues, email setup, Wi-Fi troubleshooting..."
              aria-label="Search help articles"
            />
            <button type="submit">Search</button>
          </form>
          <div className="wiki-hero-meta">
            <span>{totalArticles} total articles</span>
            <span>{approvedCount} approved</span>
            <span>{shelves.length} categories</span>
          </div>
        </div>
      </section>

      <main className="container">
        <div className="help-layout">

          {/* ── LEFT SIDEBAR ──────────────────────────────────────────── */}
          <aside className="help-sidebar">
            <section className="wiki-card">
              <h2>Top Tasks</h2>
              <ul>
                <li><a href="/search?term=startup">Fix startup and boot issues</a></li>
                <li><a href="/search?term=wifi">Troubleshoot Wi-Fi and internet</a></li>
                <li><a href="/search?term=email">Set up or repair email</a></li>
                <li><a href="/search?term=backup">Run backup and restore checks</a></li>
                <li><a href="/search?term=printer">Printer and peripheral setup</a></li>
              </ul>
            </section>

            <section className="wiki-card">
              <h2>Recently Updated</h2>
              {pages.length === 0 ? (
                <p>No recently updated articles.</p>
              ) : (
                <ul>
                  {pages.map((page: { id: string; slug: string; title: string; book: { title: string } }) => (
                    <li key={page.id}>
                      <a href={`/pages/${page.slug}`}>{page.title}</a>
                      <div style={{ fontSize: "13px", color: "#64748b" }}>{page.book.title}</div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="wiki-card">
              <h2>Article Review Progress</h2>
              <ul>
                {statusCounts.map((entry) => (
                  <li key={entry.reviewStatus}>
                    {entry.reviewStatus.replace("_", " ")} &mdash; {entry._count._all}
                  </li>
                ))}
              </ul>
              <a href="/review">Open review queue &rarr;</a>
            </section>
          </aside>

          {/* ── RIGHT CONTENT — CATEGORY GRID ─────────────────────────── */}
          <div className="help-content">
            <section className="category-section">
              <h2>Browse by Category</h2>
              <div className="category-grid">
                {shelves.map((shelf) => {
                  const pageCount = shelf.books.reduce((sum, book) => sum + book._count.pages, 0);
                  const { color, icon } = getCategoryStyle(shelf.title);
                  return (
                    <div
                      key={shelf.id}
                      className="svc-category-card"
                      style={{ "--card-accent": color } as React.CSSProperties}
                    >
                      <div className="svc-category-icon" aria-hidden="true">{icon}</div>
                      <h3 className="svc-category-title">{shelf.title}</h3>
                      <p className="svc-category-meta">
                        {shelf.books.length} {shelf.books.length === 1 ? "subcategory" : "subcategories"} &middot; {pageCount} articles
                      </p>

                      {/* Hover dropdown — shows subcategories without navigating to an intermediate page */}
                      <div className="subcategory-dropdown">
                        {shelf.books.map((book) => (
                          <a key={book.id} href={`/books/${book.slug}`} className="subcategory-link">
                            {book.title}
                          </a>
                        ))}
                        <a href={`/categories/${shelf.slug}`} className="subcategory-browse-all">
                          Browse all in {shelf.title} &rarr;
                        </a>
                      </div>

                      <a href={`/categories/${shelf.slug}`} className="svc-category-cta">
                        Browse articles &rarr;
                      </a>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

        </div>
      </main>
    </>
  );
}
