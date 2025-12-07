// src/pages/BlogPost.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchPost } from "../api";

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError("");
    setPost(null);

    fetchPost(slug)
      .then((data) => {
        setPost(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load post");
        setLoading(false);
      });
  }, [slug]);

  return (
    <section className="space-y-6">
      {/* Back link */}
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/blog"
          className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-slate-600 hover:text-sky-600"
        >
          <span className="rounded-full border border-slate-300 bg-white px-2 py-0.5">
            ← Back to blog
          </span>
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <div className="font-medium mb-0.5">Couldn&apos;t load this post</div>
          <p className="text-xs text-rose-800/90">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && !error && (
        <div className="space-y-4">
          <div className="h-5 w-40 rounded-full bg-slate-200 animate-pulse" />
          <div className="h-8 w-3/4 rounded-full bg-slate-200 animate-pulse" />
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 space-y-3">
            <div className="h-4 w-full rounded-full bg-slate-200 animate-pulse" />
            <div className="h-4 w-5/6 rounded-full bg-slate-200 animate-pulse" />
            <div className="h-4 w-4/5 rounded-full bg-slate-200 animate-pulse" />
            <div className="h-4 w-2/3 rounded-full bg-slate-200 animate-pulse" />
          </div>
        </div>
      )}

      {/* Post */}
      {!loading && !error && post && (
        <article className="space-y-5">
          {/* Header */}
          <header className="space-y-3">
            {post.category && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 text-[11px] font-medium text-slate-200 px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {post.category}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              {post.publishedAt && <span>{post.publishedAt}</span>}
              {post.readingTime && (
                <>
                  <span className="text-slate-400">·</span>
                  <span>{post.readingTime}</span>
                </>
              )}
              {(post.tags || []).length > 0 && (
                <>
                  <span className="text-slate-400">·</span>
                  <div className="flex flex-wrap gap-1">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-slate-100 text-slate-700 px-2 py-0.5"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </header>

          {/* Content – SAME STYLE AS PREVIEW */}
          <div className="rounded-2xl border border-slate-200 bg-white">
            <div className="p-3 sm:p-4 bg-white text-slate-900 text-sm sm:text-base leading-relaxed">
              <div
                className="prose prose-slate max-w-none prose-sm sm:prose-base"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </div>
          </div>
        </article>
      )}
    </section>
  );
}
