// backend/src/lambda-handler.js
import {
  createDataLayer,
  uploadMediaFromBase64,
  getPostBySlug,
  updatePostBySlug,
} from "./storage.js";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const region = process.env.AWS_REGION || "eu-west-1";
const data = createDataLayer();
const sns = new SNSClient({ region });
const leadsTopicArn = process.env.LEADS_TOPIC_ARN;
/**
 * Small helpers
 */
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_ORIGIN,
].filter(Boolean);

function jsonResponse(statusCode, body, origin) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": origin || allowedOrigins[0] || "*",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers":
      "Content-Type,Authorization,X-Requested-With,Origin,Accept",
    "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
  };

  return {
    statusCode,
    headers,
    body: JSON.stringify(body),
  };
}

function getOriginFromEvent(event) {
  return (
    event?.headers?.origin ||
    event?.headers?.Origin ||
    allowedOrigins[0] ||
    "*"
  );
}

function normalizePath(event) {
  // HTTP API v2: event.rawPath
  // REST API: event.path
  let path = event.rawPath || event.path || "/";
  const stage = event.requestContext?.stage;

  // Strip stage prefix like /prod/posts -> /posts
  if (stage && path.startsWith(`/${stage}/`)) {
    path = path.slice(stage.length + 1); // remove "/{stage}"
  } else if (stage && path === `/${stage}`) {
    path = "/";
  }

  return path;
}

function getMethod(event) {
  // HTTP API v2: event.requestContext.http.method
  // REST API: event.httpMethod
  return (
    event.requestContext?.http?.method ||
    event.httpMethod ||
    "GET"
  ).toUpperCase();
}

function parseBody(event) {
  if (!event.body) return null;
  try {
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body, "base64").toString("utf8")
      : event.body;
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to parse JSON body", err);
    return null;
  }
}

export const handler = async (event) => {
  const origin = getOriginFromEvent(event);
  const method = getMethod(event);
  const path = normalizePath(event);

  console.log("Incoming request:", {
    method,
    path,
    rawPath: event.rawPath,
    stage: event.requestContext?.stage,
  });

  // CORS preflight
  if (method === "OPTIONS") {
    return jsonResponse(200, { ok: true }, origin);
  }

  const body = parseBody(event) || {};

  try {
    // -----------------------------------------------------------------------
    // HEALTH
    // -----------------------------------------------------------------------
    if (method === "GET" && path === "/health") {
      return jsonResponse(
        200,
        { status: "ok", service: "blog-crm-backend", region },
        origin
      );
    }

    // -----------------------------------------------------------------------
    // PUBLIC BLOG
    // -----------------------------------------------------------------------

    // List published posts
    if (method === "GET" && path === "/posts") {
      const items = await data.listPublishedPosts();
      const mapped = items.map((p) => ({
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        tags: p.tags,
        publishedAt: p.publishedAt,
      }));
      return jsonResponse(200, mapped, origin);
    }

    // Get one published post by slug – /posts/{slug}
    if (method === "GET" && path.startsWith("/posts/")) {
      const slug = decodeURIComponent(path.replace("/posts/", "") || "");
      if (!slug) {
        return jsonResponse(400, { error: "SLUG_REQUIRED" }, origin);
      }

      const post = await data.getPostBySlug(slug);
      if (!post || post.status !== "published") {
        return jsonResponse(404, { error: "POST_NOT_FOUND" }, origin);
      }

      return jsonResponse(200, post, origin);
    }

    // -----------------------------------------------------------------------
    // PUBLIC CONTACT
    // -----------------------------------------------------------------------
    if (method === "POST" && path === "/contact") {
      const { name, email, message, source } = body || {};

      if (!name || !email || !message) {
        return jsonResponse(
          400,
          { error: "NAME_EMAIL_MESSAGE_REQUIRED" },
          origin
        );
      }

      const lead = await data.createLead({
        name,
        email,
        message,
        source,
      });

      // SNS / email fan-out can be added later
       // Fire-and-forget SNS notification if configured
            if (leadsTopicArn) {
              const snsPayload = {
                TopicArn: leadsTopicArn,
                Subject: "New blog lead",
                Message: JSON.stringify(
                  {
                    name,
                    email,
                    message,
                    source: source || "unknown",
                    leadId: lead.id,
                    createdAt: lead.createdAt
                  },
                  null,
                  2
                )
              };
      
              try {
                await sns.send(new PublishCommand(snsPayload));
              } catch (err) {
                console.error("Failed to publish SNS notification", err);
                // Do NOT fail the request because of SNS
              }
            }
      return jsonResponse(201, { ok: true, leadId: lead.id }, origin);
    }

    // -----------------------------------------------------------------------
    // ADMIN ENDPOINTS
    // (Cognito auth is enforced at API Gateway level)
    // -----------------------------------------------------------------------

    // List all posts (draft + published)
    if (method === "GET" && path === "/admin/posts") {
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
      return jsonResponse(200, mapped, origin);
    }

    // Create a new post
    if (method === "POST" && path === "/admin/posts") {
      const { title, slug, content, tags, status } = body || {};

      if (!title || !slug) {
        return jsonResponse(
          400,
          { error: "TITLE_AND_SLUG_REQUIRED" },
          origin
        );
      }

      try {
        const item = await data.createPost({
          title,
          slug,
          content,
          tags,
          status,
        });
        return jsonResponse(201, item, origin);
      } catch (err) {
        if (err.name === "ConditionalCheckFailedException") {
          return jsonResponse(
            409,
            { error: "SLUG_ALREADY_EXISTS" },
            origin
          );
        }
        throw err;
      }
    }

    // List leads
    if (method === "GET" && path === "/admin/leads") {
      const leads = await data.listLeads();
      leads.sort((a, b) =>
        (a.createdAt || "") < (b.createdAt || "") ? 1 : -1
      );
      return jsonResponse(200, leads, origin);
    }

    // Media upload: /admin/media
    if (method === "POST" && path === "/admin/media") {
      console.log("Received /admin/media request");

      const { base64Data, contentType, filename } = body || {};
      console.log("Media upload:", {
        filename,
        contentType,
        hasData: !!base64Data,
      });

      if (!base64Data) {
        return jsonResponse(400, { error: "BASE64_REQUIRED" }, origin);
      }

      const result = await uploadMediaFromBase64({
        base64Data,
        contentType,
        originalName: filename || "image",
      });

      return jsonResponse(
        201,
        { ok: true, url: result.url, key: result.key },
        origin
      );
    }

    // Single post admin fetch: /admin/posts/{slug}
    if (method === "GET" && path.startsWith("/admin/posts/")) {
      const slug = decodeURIComponent(
        path.replace("/admin/posts/", "") || ""
      );
      if (!slug) {
        return jsonResponse(400, { error: "SLUG_REQUIRED" }, origin);
      }

      const post = await getPostBySlug(slug);
      if (!post) {
        return jsonResponse(404, { error: "NOT_FOUND" }, origin);
      }

      return jsonResponse(200, post, origin);
    }

    // Update post: /admin/posts/{slug}
    if (method === "PUT" && path.startsWith("/admin/posts/")) {
      const slug = decodeURIComponent(
        path.replace("/admin/posts/", "") || ""
      );
      if (!slug) {
        return jsonResponse(400, { error: "SLUG_REQUIRED" }, origin);
      }

      const { title, content, status, tags } = body || {};

      try {
        const updated = await updatePostBySlug(slug, {
          title,
          content,
          status,
          tags,
        });

        return jsonResponse(200, updated, origin);
      } catch (e) {
        if (e.message === "POST_NOT_FOUND") {
          return jsonResponse(404, { error: "NOT_FOUND" }, origin);
        }
        throw e;
      }
    }

    // -----------------------------------------------------------------------
    // FALLBACK – no route matched
    // -----------------------------------------------------------------------
    return jsonResponse(
      404,
      { error: "NOT_FOUND", method, path },
      origin
    );
  } catch (err) {
    console.error("Unhandled error in Lambda handler:", err);
    return jsonResponse(
      500,
      { error: "INTERNAL_ERROR", message: err.message || "Unknown error" },
      origin
    );
  }
};
