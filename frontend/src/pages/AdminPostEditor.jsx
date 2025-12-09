// src/admin/AdminPostEditor.jsx (or wherever you keep it)
import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  fetchAdminPost,
  createAdminPost,
  updatePost,
  uploadMedia,
} from "../api";

function slugifyTitle(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function AdminPostEditor() {
  const { slug: routeSlug } = useParams();

  // /admin/posts/new  => create mode
  // /admin/posts/:slug/edit => edit mode
  const isNewMode = !routeSlug || routeSlug === "new";
  const isEditMode = !isNewMode;

  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState("draft");
  const [tagsInput, setTagsInput] = useState("");
  const [content, setContent] = useState(
    "# New post\n\nWrite your content here…"
  );

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [autoSlug, setAutoSlug] = useState(true);

  const textareaRef = useRef(null);

  // Load existing post when editing
  useEffect(() => {
    if (!isEditMode) {
      // Make sure create mode is clean
      setLoading(false);
      setError("");
      setStatus("draft");
      setTagsInput("");
      setContent("# New post\n\nWrite your content here…");
      setAutoSlug(true);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await fetchAdminPost(routeSlug);
        if (cancelled) return;

        if (!data) {
          setError("Post not found.");
          return;
        }

        setTitle(data.title || "");
        setSlug(data.slug || routeSlug);
        setStatus(data.status || "draft");
        setContent(data.content || "");
        setTagsInput((data.tags || []).join(", "));
        setAutoSlug(false); // don't auto-change slug on edit
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
  }, [isEditMode, routeSlug]);

  // Keep slug in sync with title when autoSlug is enabled (mainly for new posts)
  useEffect(() => {
    if (!autoSlug) return;
    if (!title) {
      setSlug("");
      return;
    }
    setSlug(slugifyTitle(title));
  }, [title, autoSlug]);

  const handleToggleAutoSlug = () => {
    setAutoSlug((prev) => !prev);
  };

  const handleInsertAtCursor = (text) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setContent((prev) => prev + text);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const before = content.slice(0, start);
    const after = content.slice(end);

    const next = before + text + after;
    setContent(next);

    requestAnimationFrame(() => {
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
      textarea.focus();
    });
  };

  const handleUploadMedia = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const result = await uploadMedia(file);
      const url = result.url || result.Location || result.mediaUrl;

      const markdownImage = `\n\n![${file.name}](${url})\n`;
      handleInsertAtCursor(markdownImage);
    } catch (err) {
      console.error("Media upload failed", err);
      setError("Image upload failed. Please try again.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      if (!title.trim()) {
        setError("Title is required.");
        setSaving(false);
        return;
      }

      let effectiveSlug = slug?.trim();
      if (!effectiveSlug) {
        effectiveSlug = slugifyTitle(title);
        setSlug(effectiveSlug);
      }

      const tags =
        tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean) || [];

      const payload = {
        title: title.trim(),
        slug: effectiveSlug,
        status,
        tags,
        content,
      };

      if (isEditMode) {
        await updatePost(routeSlug, payload);
        // stay on page; you can toast or log if you want
      } else {
        await createAdminPost(payload);
        // go back to posts list after creating
        navigate("/admin/posts");
        return;
      }
    } catch (err) {
      console.error("Save failed", err);
      setError("Could not save post. Check console / logs for details.");
    } finally {
      setSaving(false);
    }
  };

  const handleBackToPosts = () => {
    navigate("/admin/posts");
  };

  const handleCancel = () => {
    // simplest behaviour: just go back to posts list
    // (so you don't accidentally keep half-written junk)
    navigate("/admin/posts");
  };

  if (loading) {
    return (
      <div className="text-xs text-slate-400">
        Loading post editor…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top row: title + actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="space-y-1">
          <button
            type="button"
            onClick={handleBackToPosts}
            className="inline-flex items-center text-[11px] text-slate-400 hover:text-slate-200 mb-1"
          >
            <span className="mr-1">←</span> Back to posts
          </button>
          <h2 className="text-base font-semibold text-slate-100">
            {isEditMode ? "Edit post" : "New post"}
          </h2>
          <p className="text-xs text-slate-400">
            Markdown editor with live preview and S3-backed media uploads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
          >
            Cancel
          </button>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-full bg-slate-900 border border-slate-700 text-xs text-slate-100 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>

          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-emerald-950 shadow-sm hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Save post"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      )}

      {/* Meta fields */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-[11px] font-medium text-slate-300">
            Title
          </label>
          <input
            type="text"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="e.g. Building a serverless blog on AWS"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-medium text-slate-300">
              Slug
            </label>
            <button
              type="button"
              onClick={handleToggleAutoSlug}
              className="text-[11px] text-sky-400 hover:text-sky-300"
            >
              {autoSlug ? "Unlock slug" : "Auto from title"}
            </button>
          </div>
          <input
            type="text"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="serverless-blog-on-aws"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setAutoSlug(false);
            }}
          />
          <p className="text-[10px] text-slate-500">
            URL:{" "}
            <span className="text-slate-300">
              /blog/{slug || "your-slug"}
            </span>
          </p>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-1">
        <label className="block text-[11px] font-medium text-slate-300">
          Tags
        </label>
        <input
          type="text"
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
          placeholder="aws, serverless, dynamodb"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
        />
        <p className="text-[10px] text-slate-500">
          Comma-separated. Used to group posts on the blog.
        </p>
      </div>

      {/* Editor + preview */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Editor */}
        <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-950/70">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
            <span className="text-[11px] font-medium text-slate-300">
              Markdown editor
            </span>
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center text-[11px] text-slate-400 gap-2 cursor-pointer">
                <span className="rounded-full bg-slate-900 px-2 py-1 border border-slate-700">
                  Upload image
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUploadMedia}
                />
              </label>
              {uploading && (
                <span className="text-[10px] text-slate-400">
                  Uploading…
                </span>
              )}
            </div>
          </div>
          <textarea
            ref={textareaRef}
            className="min-h-[320px] w-full flex-1 resize-none bg-transparent px-4 py-3 text-xs text-slate-100 focus:outline-none"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            spellCheck={false}
          />
        </div>

        {/* Preview */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40">
          <div className="px-4 py-2 border-b border-slate-800 text-[11px] font-medium text-slate-300">
            Live preview
          </div>
          <div className="prose prose-invert prose-slate max-w-none p-4 prose-headings:scroll-mt-24">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                img: (props) => (
                  <img
                    {...props}
                    className="rounded-lg border border-slate-800 shadow-sm max-w-full"
                  />
                ),
                a: (props) => (
                  <a
                    {...props}
                    className="text-sky-400 hover:text-sky-300 underline underline-offset-2"
                  />
                ),
                code: ({ inline, className, children, ...rest }) =>
                  inline ? (
                    <code
                      className="rounded bg-slate-900 px-1.5 py-0.5 text-[12px] text-slate-100"
                      {...rest}
                    >
                      {children}
                    </code>
                  ) : (
                    <pre className="rounded-xl bg-slate-950 text-slate-50 text-[13px] p-4 overflow-x-auto">
                      <code {...rest} className={className}>
                        {children}
                      </code>
                    </pre>
                  ),
              }}
            >
              {content || "_Nothing yet…_"}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
