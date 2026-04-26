import { prisma } from "../../lib/prisma";

export const dynamic = "force-dynamic";

export default async function ReviewQueuePage() {
  const pages = await prisma.page.findMany({
    where: { deletedAt: null },
    orderBy: [{ reviewStatus: "asc" }, { category: "asc" }, { title: "asc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      kbId: true,
      category: true,
      subcategory: true,
      reviewStatus: true,
      reviewerName: true,
      reviewedAt: true
    },
    take: 505
  });

  return (
    <main className="container">
      <section className="wiki-card">
        <h1 style={{ marginTop: 0 }}>Article Review Queue</h1>
        <p>Manual validation tracking for all imported help articles.</p>
        <table className="review-table">
          <thead>
            <tr>
              <th>KB ID</th>
              <th>Title</th>
              <th>Category</th>
              <th>Subcategory</th>
              <th>Status</th>
              <th>Reviewer</th>
              <th>Reviewed</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => (
              <tr key={page.id}>
                <td>{page.kbId ?? "-"}</td>
                <td><a href={`/pages/${page.slug}`}>{page.title}</a></td>
                <td>{page.category ?? "-"}</td>
                <td>{page.subcategory ?? "-"}</td>
                <td>{page.reviewStatus}</td>
                <td>{page.reviewerName ?? "-"}</td>
                <td>{page.reviewedAt ? new Date(page.reviewedAt).toLocaleDateString() : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
