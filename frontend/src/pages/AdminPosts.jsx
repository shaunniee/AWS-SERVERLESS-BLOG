import { useEffect, useState } from "react";
import { fetchAdminPosts, createAdminPost } from "../api";
import { marked } from "marked";

export default function AdminPosts() {
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  // Markdown source and tab state
  const [markdown, setMarkdown] = useState("");
  const [activeTab, setActiveTab] = useState("edit");

  const [form, setForm] = useState({
    title: "",
    slug: "",
    content: "", // HTML generated from markdown
    status: "draft",
  });

  async function loadPosts() {
    try {
      setError("");
      setLoading(true);
      const data = await fetchAdminPosts();
      setPosts(data || []);
    } catch (err) {
      setError(err.message || "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

  function update(field) {
    return (e) => {
      const value = e.target.value;
      setForm((f) => {
        // auto-suggest slug from title if slug is empty
        if (field === "title" && !f.slug) {
          const suggestedSlug = value
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "");
          return { ...f, title: value, slug: suggestedSlug };
        }
        return { ...f, [field]: value };
      });
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSavedMsg("");
    setSaving(true);

    try {
      await createAdminPost({
        ...form,
        tags: ["aws", "portfolio"], // temp tags
      });
      setForm({ title: "", slug: "", content: "", status: "draft" });
      setMarkdown("");
      setActiveTab("edit");
      setSavedMsg("Post saved. It will now appear on the public blog.");
      await loadPosts();
    } catch (err) {
      setError(err.message || "Failed to save post");
    } finally {
      setSaving(false);
    }
  }

  // Handle markdown typing: keep markdown + derived HTML in sync
  function handleMarkdownChange(value) {
    setMarkdown(value);
    const html = marked.parse(value || "");
    setForm((f) => ({
      ...f,
      content: html,
    }));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2.2fr)]">
      {/* Form / editor side */}
      <div className="space-y-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-500/10 border border-sky-500/40 text-[11px]">
              ✎
            </span>
            <span className="text-sm font-semibold text-slate-50">
              Create / edit post
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Posts are written in Markdown, converted to HTML as you type, and
            served to the public blog via the same API.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4"
        >
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-200">
              Title
            </label>
            <input
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              value={form.title}
              onChange={update("title")}
              placeholder="e.g. Serverless AWS blog + CRM case study"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-200">
              Slug
            </label>
            <input
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              value={form.slug}
              onChange={update("slug")}
              placeholder="e.g. serverless-blog-crm"
              required
            />
            <p className="text-[10px] text-slate-500">
              Used in the URL as <span className="font-mono">/blog/&lt;slug&gt;</span>.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-slate-200">
              Status
            </label>
            <select
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              value={form.status}
              onChange={update("status")}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          {/* Markdown editor + preview tabs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-200">
                Content
              </span>
              <div className="inline-flex rounded-full border border-slate-700 bg-slate-950 text-[11px]">
                <button
                  type="button"
                  onClick={() => setActiveTab("edit")}
                  className={[
                    "px-3 py-1 rounded-full transition-colors",
                    activeTab === "edit"
                      ? "bg-slate-800 text-slate-50"
                      : "text-slate-400 hover:text-slate-100",
                  ].join(" ")}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={[
                    "px-3 py-1 rounded-full transition-colors",
                    activeTab === "preview"
                      ? "bg-slate-800 text-slate-50"
                      : "text-slate-400 hover:text-slate-100",
                  ].join(" ")}
                >
                  Preview
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden">
              {activeTab === "edit" ? (
                <textarea
                  className="w-full rounded-none border-0 bg-slate-950 px-3 py-2 text-xs text-slate-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[200px]"
                  value={markdown}
                  onChange={(e) => handleMarkdownChange(e.target.value)}
                  placeholder={[
                    "# Serverless AWS blog + CRM",
                    "",
                    "Explain the architecture, decisions, trade-offs,",
                    "and what you'd do next.",
                    "",
                    "## Architecture",
                    "- React front end",
                    "- API Gateway + Lambda",
                    "- DynamoDB + Cognito",
                    "",
                    "## What this shows in an interview",
                    "- Serverless patterns",
                    "- Auth + JWT",
                    "- CI/CD ready setup",
                  ].join("\n")}
                />
              ) : (
                <div className="bg-white text-slate-900 text-sm leading-relaxed p-3 max-h-[320px] overflow-auto">
                  {form.content ? (
                    <div
                      className="prose prose-slate max-w-none prose-sm"
                      dangerouslySetInnerHTML={{ __html: form.content }}
                    />
                  ) : (
                    <p className="text-[11px] text-slate-500">
                      Nothing to preview yet. Start typing in the Edit tab.
                    </p>
                  )}
                </div>
              )}
            </div>

            <p className="text-[10px] text-slate-500">
              You write in Markdown. It&apos;s converted to HTML as you type and
              saved in <span className="font-mono">content</span>. The public
              blog renders that HTML directly.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-full bg-sky-500 px-4 py-2 text-xs sm:text-sm font-medium text-slate-950 shadow-sm hover:bg-sky-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Saving…" : "Save post"}
            </button>

            {savedMsg && (
              <p className="text-[11px] text-emerald-300">{savedMsg}</p>
            )}
          </div>

          {error && (
            <p className="text-[11px] text-rose-300">Error: {error}</p>
          )}
        </form>
      </div>

      {/* Posts list side */}
      <div className="space-y-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 border border-slate-600 text-[11px]">
              ☰
            </span>
            <span className="text-sm font-semibold text-slate-50">
              All posts
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            This list is powered by the same backend API the public blog uses,
            so you can show how admin and public views share the same data.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60">
          {loading && (
            <div className="p-3 text-[11px] text-slate-400">
              Loading posts…
            </div>
          )}

          {!loading && posts && posts.length === 0 && (
            <div className="p-3 text-[11px] text-slate-300">
              No posts yet. Create your first one on the left and it will appear
              here.
            </div>
          )}

          {!loading && posts && posts.length > 0 && (
            <ul className="divide-y divide-slate-800 text-xs">
              {posts.map((p) => (
                <li key={p.id} className="px-3 py-2.5 hover:bg-slate-900/60">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-50">
                          {p.title}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          ({p.slug})
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Created: {p.createdAt}
                      </div>
                    </div>
                    <StatusPill status={p.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const label = status || "draft";
  const normalized = label.toLowerCase();

  let colorClasses =
    "bg-slate-900 text-slate-100 border border-slate-600";

  if (normalized === "draft") {
    colorClasses = "bg-slate-900 text-slate-200 border border-slate-600";
  } else if (normalized === "published") {
    colorClasses =
      "bg-emerald-900/40 text-emerald-200 border border-emerald-500/40";
  }

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
        colorClasses,
      ].join(" ")}
    >
      {label}
    </span>
  );
}
