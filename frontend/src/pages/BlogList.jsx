import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchPosts } from "../api";

export default function BlogList() {
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts()
      .then((data) => {
        setPosts(data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load posts");
        setLoading(false);
      });
  }, []);

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-900 text-[11px] font-medium text-slate-200 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          AWS blog · architectures · real projects
        </span>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
          Blog
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl">
          Articles about AWS, serverless patterns, and how different
          architectures are put together in real projects.
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <div className="font-medium mb-0.5">Couldn&apos;t load posts</div>
          <p className="text-xs text-rose-800/90">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loading && !error && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm animate-pulse space-y-3"
            >
              <div className="h-4 w-24 rounded-full bg-slate-200" />
              <div className="h-4 w-3/4 rounded-full bg-slate-200" />
              <div className="h-3 w-full rounded-full bg-slate-200" />
              <div className="h-3 w-5/6 rounded-full bg-slate-200" />
              <div className="flex justify-between items-center pt-2">
                <div className="h-3 w-20 rounded-full bg-slate-200" />
                <div className="flex gap-2">
                  <div className="h-5 w-12 rounded-full bg-slate-200" />
                  <div className="h-5 w-10 rounded-full bg-slate-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Posts list */}
      {!loading && !error && posts && (
        <>
          {posts.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              No posts yet. Once you create a post from the{" "}
              <span className="font-medium text-slate-900">Admin &gt; Posts</span>{" "}
              section, it will appear here as a public article.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {posts.map((p) => (
                <Link
                  key={p.slug}
                  to={`/blog/${p.slug}`}
                  className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-sky-200 hover:shadow-md transition-all flex flex-col gap-3"
                >
                  <div className="space-y-1">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      {p.category || "AWS architecture"}
                    </div>
                    <h2 className="text-sm sm:text-base font-semibold text-slate-900 group-hover:text-sky-600">
                      {p.title}
                    </h2>
                  </div>

                  {p.excerpt && (
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {p.excerpt}
                    </p>
                  )}

                  <div className="mt-auto flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <div className="flex flex-col">
                      {p.publishedAt && (
                        <span className="text-[11px] text-slate-500">
                          {p.publishedAt}
                        </span>
                      )}
                      {p.readingTime && (
                        <span className="text-[11px] text-slate-400">
                          {p.readingTime}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {(p.tags || []).map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-slate-100 text-[11px] text-slate-700 px-2 py-0.5"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
