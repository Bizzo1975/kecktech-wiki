import { notFound } from "next/navigation";
import { prisma } from "../../../lib/prisma";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export default async function WikiPage({ params }: Params) {
  const { slug } = await params;
  const page = await prisma.page.findFirst({
    where: { slug, deletedAt: null },
    include: { book: true, chapter: true, tags: true }
  });

  if (!page) {
    notFound();
  }

  return (
    <main className="page-article">
      <div className="container">
      <article className="wiki-card">
        <p><a href="/">Help Center</a> / <a href={`/books/${page.book.slug}`}>{page.book.title}</a>{page.chapter ? <> / <a href={`/chapters/${page.chapter.slug}`}>{page.chapter.title}</a></> : null}</p>
        <h1 style={{ marginTop: 0, fontFamily: "Poppins, sans-serif", color: "#1E3A5F" }}>{page.title}</h1>
        <p>
          <strong>Book:</strong> {page.book.title}
          {page.chapter ? (
            <>
              {" "}
              <strong>Chapter:</strong> {page.chapter.title}
            </>
          ) : null}
        </p>
        <p>
          <strong>Review status:</strong> {page.reviewStatus}
          {page.reviewerName ? <> · <strong>Reviewer:</strong> {page.reviewerName}</> : null}
        </p>
        <div
          className="article-html"
          dangerouslySetInnerHTML={{ __html: page.html ?? "" }}
        />
      </article>
      </div>
    </main>
  );
}
