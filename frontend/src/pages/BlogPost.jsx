import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { fetchPost } from "../api"; // adjust name if different

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await fetchPost(slug);
        if (!cancelled) {
          setPost(data);
        }
      } catch (err) {
        console.error("Error loading post", err);
        if (!cancelled) setError("Could not load this post.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-10 text-sm text-slate-500">
        Loading post…
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-3xl mx-auto py-10 text-sm text-red-500">
        {error || "Post not found."}
      </div>
    );
  }

  const publishedAt = post.publishedAt || post.createdAt;

  return (
    <article className="max-w-3xl mx-auto py-10 space-y-6">
      <header className="space-y-3 border-b border-slate-200 pb-6">
        <Link
          to="/blog"
          className="inline-flex items-center text-xs text-slate-500 hover:text-slate-800"
        >
          ← Back to blog
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          {post.title}
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          {publishedAt && (
            <span>
              Published{" "}
              {new Date(publishedAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Markdown content */}
      <section className="prose prose-slate max-w-none prose-headings:scroll-mt-24">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            img: (props) => (
              <img
                {...props}
                className="rounded-lg border border-slate-200 shadow-sm max-w-full"
              />
            ),
            a: (props) => (
              <a
                {...props}
                className="text-sky-600 hover:text-sky-700 underline underline-offset-2"
              />
            ),
            code: ({ inline, className, children, ...rest }) =>
              inline ? (
                <code
                  className="rounded bg-slate-100 px-1.5 py-0.5 text-[12px] text-slate-800"
                  {...rest}
                >
                  {children}
                </code>
              ) : (
                <pre className="rounded-xl bg-slate-950 text-slate-100 text-[13px] p-4 overflow-x-auto">
                  <code {...rest} className={className}>
                    {children}
                  </code>
                </pre>
              ),
          }}
        >
          {post.content || ""}
        </ReactMarkdown>
      </section>
    </article>
  );
}
