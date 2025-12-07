import "dotenv/config";
import express from "express";
import cors from "cors";
import {
  DynamoDBClient,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { createDataLayer } from "./storage.js";

console.log("Dynamo config:", {
  tableName: process.env.BLOG_TABLE_NAME,
  region: process.env.AWS_REGION,
});

//this is 

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

const tableName = process.env.BLOG_TABLE_NAME;
const data = createDataLayer();

// For leads Scan:
const region = process.env.AWS_REGION || "eu-west-1";
const lowLevelClient = new DynamoDBClient({ region });
const ddbDoc = DynamoDBDocumentClient.from(lowLevelClient);

// ---------------- Health check ----------------
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "blog-crm-backend", region });
});

// ---------------- Public blog endpoints ----------------

// List published posts
app.get("/posts", async (req, res) => {
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

// Get one post by slug
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

// ---------------- Public contact endpoint ----------------

app.post("/contact", async (req, res) => {
  try {
    const { name, email, message, source } = req.body || {};
    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ error: "NAME_EMAIL_MESSAGE_REQUIRED" });
    }

    const lead = await data.createLead({ name, email, message, source });

    // Later in AWS: publish to SNS here
    res.status(201).json({ ok: true, leadId: lead.id });
  } catch (err) {
    console.error("Error creating lead:", err);
    res.status(500).json({ error: "FAILED_TO_CREATE_LEAD" });
  }
});

// ---------------- Admin endpoints (no auth yet) ----------------

// List all posts (drafts + published)
app.get("/admin/posts", async (req, res) => {
  try {
    // In a real design we'd add a GSI for all posts.
    // For now, we can scan for type = POST.
    const cmd = new ScanCommand({
      TableName: tableName,
    });
    const dataScan = await ddbDoc.send(cmd);
    const posts = (dataScan.Items || []).filter((i) => i.type === "POST");
    res.json(posts);
  } catch (err) {
    console.error("Error listing admin posts:", err);
    res.status(500).json({ error: "FAILED_TO_LIST_ADMIN_POSTS" });
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

    // createPost will fail if slug already exists due to condition
    const item = await data.createPost({ title, slug, content, tags, status });
    res.status(201).json(item);
  } catch (err) {
    if (err.name === "ConditionalCheckFailedException") {
      return res.status(409).json({ error: "SLUG_ALREADY_EXISTS" });
    }
    console.error("Error creating post:", err);
    res.status(500).json({ error: "FAILED_TO_CREATE_POST" });
  }
});

// List leads (admin view) - basic Scan
app.get("/admin/leads", async (req, res) => {
  try {
    const cmd = new ScanCommand({
      TableName: tableName,
    });
    const dataScan = await ddbDoc.send(cmd);
    const leads = (dataScan.Items || []).filter((i) => i.type === "LEAD");
    // Sort newest first
    leads.sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1
    );
    res.json(leads);
  } catch (err) {
    console.error("Error listing leads:", err);
    res.status(500).json({ error: "FAILED_TO_LIST_LEADS" });
  }
});

// ----------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
