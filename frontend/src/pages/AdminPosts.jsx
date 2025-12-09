// src/admin/AdminPosts.jsx (or wherever you keep it)
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchAdminPosts } from "../api";

export default function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await fetchAdminPosts(); // calls /admin/posts
        if (!cancelled) {
          setPosts(data || []);
        }
      } catch (err) {
        console.error("Error loading admin posts", err);
        if (!cancelled) setError("Could not load posts.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleNewPost = () => {
    navigate("/admin/posts/new");
  };

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">
            Posts
          </h2>
          <p className="text-xs text-slate-400">
            Manage published posts and drafts fetched from DynamoDB.
          </p>
        </div>
        <button
          onClick={handleNewPost}
          className="inline-flex items-center rounded-full bg-sky-500 px-4 py-1.5 text-xs font-semibold text-sky-950 shadow-sm hover:bg-sky-400"
        >
          + New post
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-xs text-slate-400">Loading posts…</div>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-6 text-xs text-slate-400">
          No posts yet. Click <span className="font-medium text-slate-200">New post</span>{" "}
          to create your first blog article.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-slate-400">
                  Title
                </th>
                <th className="px-4 py-2 text-left font-medium text-slate-400">
                  Status
                </th>
                <th className="px-4 py-2 text-left font-medium text-slate-400">
                  Tags
                </th>
                <th className="px-4 py-2 text-left font-medium text-slate-400">
                  Updated
                </th>
                <th className="px-4 py-2 text-right font-medium text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => {
                const isPublished = post.status === "published";
                const viewPath = isPublished
                  ? `/blog/${post.slug}` // public route
                  : `/admin/posts/${post.slug}/edit`; // use editor for draft “preview”

                return (
                  <tr
                    key={post.slug}
                    className="border-t border-slate-800/80 hover:bg-slate-900/40"
                  >
                    <td className="px-4 py-2 align-top text-slate-100">
                      <div className="font-medium text-[13px]">
                        {post.title}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        /blog/{post.slug}
                      </div>
                    </td>

                    <td className="px-4 py-2 align-top">
                      <span
                        className={
                          isPublished
                            ? "inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-300 border border-emerald-500/40"
                            : "inline-flex items-center rounded-full bg-slate-800/60 px-2 py-0.5 text-[11px] text-slate-200 border border-slate-700"
                        }
                      >
                        <span
                          className={
                            isPublished
                              ? "h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1.5"
                              : "h-1.5 w-1.5 rounded-full bg-slate-400 mr-1.5"
                          }
                        />
                        {isPublished ? "Published" : "Draft"}
                      </span>
                    </td>

                    <td className="px-4 py-2 align-top text-slate-300">
                      {post.tags && post.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {post.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] text-slate-300 border border-slate-700/70"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500">
                          –
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-2 align-top text-slate-400">
                      <div className="text-[11px]">
                        {post.updatedAt
                          ? new Date(post.updatedAt).toLocaleString()
                          : "—"}
                      </div>
                    </td>

                    <td className="px-4 py-2 align-top text-right">
                      <div className="inline-flex items-center gap-2">
                        {/* Edit – always goes to editor */}
                        <Link
                          to={`/admin/posts/${post.slug}/edit`}
                          className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] text-slate-100 hover:bg-slate-800"
                        >
                          Edit
                        </Link>

                        {/* View: public for published, editor for draft */}
                        <Link
                          to={viewPath}
                          target={isPublished ? "_blank" : "_self"}
                          rel={isPublished ? "noreferrer" : undefined}
                          className="rounded-full border border-slate-700/70 bg-slate-950 px-3 py-1 text-[11px] text-slate-200 hover:bg-slate-800"
                        >
                          {isPublished ? "View live" : "Preview"}
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
