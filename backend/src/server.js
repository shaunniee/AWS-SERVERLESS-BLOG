// backend/src/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import {
  createDataLayer,
  uploadMediaFromBase64,
  getPostBySlug,
  updatePostBySlug,
} from "./storage.js";

const region = process.env.AWS_REGION || "eu-west-1";
const tableName = process.env.BLOG_TABLE_NAME;

console.log("Dynamo config:", {
  tableName,
  region,
});

const app = express();
const PORT = process.env.PORT || 4000;

// CORS – allow local dev + optional extra origin
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // allow tools like curl / Postman (no origin)
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: false,
  })
);

app.use(express.json({ limit: "10mb" })); // handle JSON bodies & media uploads

const data = createDataLayer();

// -----------------------------------------------------------------------------
// Health check
// -----------------------------------------------------------------------------
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "blog-crm-backend", region });
});

// -----------------------------------------------------------------------------
// Public blog endpoints
// -----------------------------------------------------------------------------

// List published posts
app.get("/posts", async (_req, res) => {
  try {
    const items = await data.listPublishedPosts();
    const mapped = items.map((p) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      tags: p.tags,
      publishedAt: p.publishedAt,
    }));
    res.json(mapped);
  } catch (err) {
    console.error("Error listing posts:", err);
    res.status(500).json({ error: "FAILED_TO_LIST_POSTS" });
  }
});

// Get one post by slug (only published visible publicly)
app.get("/posts/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const post = await data.getPostBySlug(slug);

    if (!post || post.status !== "published") {
      return res.status(404).json({ error: "POST_NOT_FOUND" });
    }

    res.json(post);
  } catch (err) {
    console.error("Error getting post:", err);
    res.status(500).json({ error: "FAILED_TO_GET_POST" });
  }
});

// -----------------------------------------------------------------------------
// Public contact endpoint
// -----------------------------------------------------------------------------

app.post("/contact", async (req, res) => {
  try {
    const { name, email, message, source } = req.body || {};
    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ error: "NAME_EMAIL_MESSAGE_REQUIRED" });
    }

    const lead = await data.createLead({ name, email, message, source });

    // later in AWS: publish to SNS here
    res.status(201).json({ ok: true, leadId: lead.id });
  } catch (err) {
    console.error("Error creating lead:", err);
    res.status(500).json({ error: "FAILED_TO_CREATE_LEAD" });
  }
});

// -----------------------------------------------------------------------------
// Admin endpoints (auth handled via API Gateway / Cognito in Lambda deployment)
// -----------------------------------------------------------------------------

// List all posts (drafts + published)
app.get("/admin/posts", async (_req, res) => {
  try {
    const items = await data.listAllPosts();
    const mapped = items.map((p) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      tags: p.tags,
      publishedAt: p.publishedAt,
      status: p.status,
      updatedAt: p.updatedAt,
    }));
    res.json(mapped);
  } catch (err) {
    console.error("Error listing posts:", err);
    res.status(500).json({ error: "FAILED_TO_LIST_POSTS" });
  }
});

// Create a new post
app.post("/admin/posts", async (req, res) => {
  try {
    const { title, slug, content, tags, status } = req.body || {};

    if (!title || !slug) {
      return res
        .status(400)
        .json({ error: "TITLE_AND_SLUG_REQUIRED" });
    }

    const item = await data.createPost({
      title,
      slug,
      content,
      tags,
      status,
    });

    res.status(201).json(item);
  } catch (err) {
    if (err.name === "ConditionalCheckFailedException") {
      return res.status(409).json({ error: "SLUG_ALREADY_EXISTS" });
    }
    console.error("Error creating post:", err);
    res.status(500).json({ error: "FAILED_TO_CREATE_POST" });
  }
});

// List leads (admin view) – now uses data layer instead of raw Scan
app.get("/admin/leads", async (_req, res) => {
  try {
    const leads = await data.listLeads();

    // sort newest first
    leads.sort((a, b) =>
      (a.createdAt || "") < (b.createdAt || "") ? 1 : -1
    );

    res.json(leads);
  } catch (err) {
    console.error("Error listing leads:", err);
    res.status(500).json({ error: "FAILED_TO_LIST_LEADS" });
  }
});

// Media upload (admin) – for markdown editor image uploads
app.post("/admin/media", async (req, res) => {
  console.log("Received /admin/media request");
  try {
    const { base64Data, contentType, filename } = req.body || {};
    console.log("Media upload:", {
      filename,
      contentType,
      hasData: !!base64Data,
    });

    if (!base64Data) {
      return res.status(400).json({ error: "BASE64_REQUIRED" });
    }

    const result = await uploadMediaFromBase64({
      base64Data,
      contentType,
      originalName: filename || "image",
    });

    return res.status(201).json({
      ok: true,
      url: result.url,
      key: result.key,
    });
  } catch (err) {
    console.error("Error uploading media:", err);
    return res.status(500).json({ error: "MEDIA_UPLOAD_FAILED" });
  }
});

// Single post admin fetch (draft or published)
app.get("/admin/posts/:slug", async (req, res) => {
  try {
    const post = await getPostBySlug(req.params.slug);
    if (!post) return res.status(404).json({ error: "NOT_FOUND" });
    return res.json(post);
  } catch (e) {
    console.error("Error fetching admin post:", e);
    return res.status(500).json({ error: "FAILED_TO_FETCH_POST" });
  }
});

// Update post
app.put("/admin/posts/:slug", async (req, res) => {
  try {
    const { title, content, status, tags } = req.body || {};
    const slug = req.params.slug;

    const updated = await updatePostBySlug(slug, {
      title,
      content,
      status,
      tags,
    });

    return res.json(updated);
  } catch (e) {
    console.error("Error updating post:", e);
    if (e.message === "POST_NOT_FOUND") {
      return res.status(404).json({ error: "NOT_FOUND" });
    }
    return res.status(500).json({ error: "FAILED_TO_UPDATE_POST" });
  }
});

// -----------------------------------------------------------------------------
// Local dev server
// -----------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
