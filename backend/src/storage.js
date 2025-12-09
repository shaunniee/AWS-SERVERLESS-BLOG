// backend/src/storage.js

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

// -----------------------------------------------------------------------------
// Environment & clients
// -----------------------------------------------------------------------------

const region = process.env.AWS_REGION || "eu-west-1";
const tableName = process.env.BLOG_TABLE_NAME;

if (!tableName) {
  throw new Error("BLOG_TABLE_NAME env var is required");
}

const ddb = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region })
);

const s3 = new S3Client({
  region,
});

const MEDIA_BUCKET = process.env.MEDIA_BUCKET;
const MEDIA_PREFIX = process.env.MEDIA_PREFIX || "media/";
const MEDIA_BASE_URL = process.env.MEDIA_BASE_URL;

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function nowIso() {
  return new Date().toISOString();
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function sanitizeFilename(name = "image") {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function buildPostPk(slug) {
  return `POST#${slug}`;
}

function buildLeadPk(id) {
  return `LEAD#${id}`;
}

// -----------------------------------------------------------------------------
// Public blog: list published posts
// -----------------------------------------------------------------------------

async function listPublishedPosts() {
  const cmd = new ScanCommand({
    TableName: tableName,
    FilterExpression: "begins_with(#pk, :pk) AND #status = :status",
    ExpressionAttributeNames: {
      "#pk": "pk",
      "#status": "status",
    },
    ExpressionAttributeValues: {
      ":pk": "POST#",
      ":status": "published",
    },
  });

  const data = await ddb.send(cmd);
  const items = data.Items || [];

  // newest first by publishedAt
  items.sort((a, b) =>
    (a.publishedAt || "") < (b.publishedAt || "") ? 1 : -1
  );

  return items;
}

// -----------------------------------------------------------------------------
// Public blog: get single post by slug
// -----------------------------------------------------------------------------

export async function getPostBySlug(slug) {
  const cmd = new GetCommand({
    TableName: tableName,
    Key: {
      pk: buildPostPk(slug),
      sk: "METADATA",
    },
  });

  const data = await ddb.send(cmd);
  return data.Item || null;
}

// -----------------------------------------------------------------------------
// Admin: list ALL posts (draft + published)
// -----------------------------------------------------------------------------

async function listAllPosts() {
  const cmd = new ScanCommand({
    TableName: tableName,
    FilterExpression: "begins_with(#pk, :pk)",
    ExpressionAttributeNames: {
      "#pk": "pk",
    },
    ExpressionAttributeValues: {
      ":pk": "POST#",
    },
  });

  const data = await ddb.send(cmd);
  return data.Items || [];
}

// -----------------------------------------------------------------------------
// Admin: list ALL leads
// -----------------------------------------------------------------------------

async function listLeads() {
  const cmd = new ScanCommand({
    TableName: tableName,
    FilterExpression: "begins_with(#pk, :pk)",
    ExpressionAttributeNames: {
      "#pk": "pk",
    },
    ExpressionAttributeValues: {
      ":pk": "LEAD#",
    },
  });

  const data = await ddb.send(cmd);
  return data.Items || [];
}

// -----------------------------------------------------------------------------
// Create post
// -----------------------------------------------------------------------------

async function createPost({ title, slug, content, tags, status }) {
  const now = nowIso();
  const normalizedStatus = status || "draft";

  const plainText = content
    ? content.replace(/<[^>]+>/g, "").slice(0, 180)
    : "";

  const item = {
    pk: buildPostPk(slug),
    sk: "METADATA",
    type: "POST",

    title,
    slug,
    excerpt: plainText ? `${plainText}...` : "",
    content: content || "",
    tags: tags || [],
    status: normalizedStatus,
    createdAt: now,
    updatedAt: now,
    publishedAt: normalizedStatus === "published" ? now : null,
  };

  const cmd = new PutCommand({
    TableName: tableName,
    Item: item,
    ConditionExpression: "attribute_not_exists(pk)",
  });

  await ddb.send(cmd);
  return item;
}

// -----------------------------------------------------------------------------
// Update post by slug
// -----------------------------------------------------------------------------

export async function updatePostBySlug(slug, updates) {
  const existing = await getPostBySlug(slug);
  if (!existing) throw new Error("POST_NOT_FOUND");

  const now = nowIso();

  // Never allow callers to overwrite keys or type
  const {
    pk: _pkIgnored,
    sk: _skIgnored,
    type: _typeIgnored,
    ...safeExisting
  } = existing;

  const {
    pk: _pk2,
    sk: _sk2,
    type: _type2,
    ...safeUpdates
  } = updates || {};

  const next = {
    ...safeExisting,
    ...safeUpdates,
    pk: buildPostPk(existing.slug),
    sk: "METADATA",
    type: "POST",
    updatedAt: now,
  };

  // if status changed to published and no publishedAt yet
  if (
    safeUpdates.status === "published" &&
    !safeExisting.publishedAt
  ) {
    next.publishedAt = now;
  }

  const cmd = new PutCommand({
    TableName: tableName,
    Item: next,
  });

  await ddb.send(cmd);
  return next;
}

// -----------------------------------------------------------------------------
// Create lead (contact form)
// -----------------------------------------------------------------------------

async function createLead({ name, email, message, source }) {
  const id = generateId();
  const now = nowIso();

  const item = {
    pk: buildLeadPk(id),
    sk: "METADATA",
    type: "LEAD",

    id,
    name,
    email,
    message,
    source: source || null,
    status: "new",
    createdAt: now,
  };

  const cmd = new PutCommand({
    TableName: tableName,
    Item: item,
  });

  await ddb.send(cmd);
  return item;
}

// -----------------------------------------------------------------------------
// Media upload (base64 -> S3)
// -----------------------------------------------------------------------------

export async function uploadMediaFromBase64({
  base64Data,
  contentType,
  originalName,
}) {
  if (!MEDIA_BUCKET || !MEDIA_BASE_URL) {
    throw new Error("MEDIA_BUCKET or MEDIA_BASE_URL not configured");
  }

  const buffer = Buffer.from(base64Data, "base64");
  const safeName = sanitizeFilename(originalName);
  const id = crypto.randomUUID();
  const key = `${MEDIA_PREFIX}${Date.now()}-${id}-${safeName}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: MEDIA_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType || "application/octet-stream",
    })
  );

  return {
    key,
    url: `${MEDIA_BASE_URL}/${key}`,
  };
}

// -----------------------------------------------------------------------------
// Data layer factory (used by Express / Lambda handlers)
// -----------------------------------------------------------------------------

export function createDataLayer() {
  return {
    listPublishedPosts,
    getPostBySlug,
    createPost,
    createLead,
    listAllPosts,
    listLeads,
    uploadMediaFromBase64,
    updatePostBySlug,
  };
}

// Optional: named exports if you want to import directly elsewhere
export {
  listPublishedPosts,
  listAllPosts,
  listLeads,
  createPost,
  createLead,
};
