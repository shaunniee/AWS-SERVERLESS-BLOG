// backend/src/storage.js
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

const region = process.env.AWS_REGION || "eu-west-1";
const tableName = process.env.BLOG_TABLE_NAME;

if (!tableName) {
  throw new Error("BLOG_TABLE_NAME env var is required");
}

const client = new DynamoDBClient({ region });
const ddb = DynamoDBDocumentClient.from(client);

function nowIso() {
  return new Date().toISOString();
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// ---------------- Public blog: list published posts ----------------

async function listPublishedPosts() {
  const cmd = new ScanCommand({
    TableName: tableName,
    FilterExpression:
      "begins_with(#pk, :pk) AND #status = :status",
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

  items.sort((a, b) =>
    (a.publishedAt || "") < (b.publishedAt || "") ? 1 : -1
  );

  return items;
}

// ---------------- Public blog: get a single post ----------------

async function getPostBySlug(slug) {
  const cmd = new GetCommand({
    TableName: tableName,
    Key: {
      pk: `POST#${slug}`,
      sk: "METADATA",
    },
  });

  const data = await ddb.send(cmd);
  return data.Item || null;
}

// ---------------- Admin: list ALL posts ----------------

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

// ---------------- Admin: list ALL leads ----------------

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

// ---------------- Create post ----------------

async function createPost({ title, slug, content, tags, status }) {
  const now = nowIso();
  const normalizedStatus = status || "draft";

  const item = {
    pk: `POST#${slug}`,
    sk: "METADATA",
    type: "POST",

    title,
    slug,
    excerpt: content
      ? content.replace(/<[^>]+>/g, "").slice(0, 180) + "..."
      : "",
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

// ---------------- Create lead ----------------

async function createLead({ name, email, message, source }) {
  const id = generateId();
  const now = nowIso();

  const item = {
    pk: `LEAD#${id}`,
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

export function createDataLayer() {
  return {
    listPublishedPosts,
    getPostBySlug,
    createPost,
    createLead,
    listAllPosts,
    listLeads,
  };
}
