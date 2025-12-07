// backend/src/lambda-posts.js
import "dotenv/config";
import { createDataLayer } from "./storage.js";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const region = process.env.AWS_REGION || "eu-west-1";


const data = createDataLayer();

const sns = new SNSClient({ region });
const leadsTopicArn = process.env.LEADS_TOPIC_ARN;

function corsHeaders() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*", // later: restrict to your domain
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
  };
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: corsHeaders(),
    body: JSON.stringify(body)
  };
}

export const handler = async (event) => {
  const method = event.requestContext?.http?.method;
  const path = event.requestContext?.http?.path;
  const routeKey = event.routeKey || `${method} ${path}`;

  console.log("Incoming event", {
    routeKey,
    method,
    path,
    pathParameters: event.pathParameters
  });

  // Handle CORS preflight generically
  if (method === "OPTIONS") {
    return {
      statusCode: 204,
      headers: corsHeaders(),
      body: ""
    };
  }

  try {
    // --------------- Public blog endpoints ---------------

    if (routeKey === "GET /posts") {
      const items = await data.listPublishedPosts();
      const mapped = items.map((p) => ({
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        tags: p.tags,
        publishedAt: p.publishedAt
      }));
      return jsonResponse(200, mapped);
    }

    if (routeKey === "GET /posts/{slug}") {
      const slug = event.pathParameters?.slug;
      if (!slug) {
        return jsonResponse(400, { error: "MISSING_SLUG" });
      }

      const post = await data.getPostBySlug(slug);
      if (!post || post.status !== "published") {
        return jsonResponse(404, { error: "POST_NOT_FOUND" });
      }
      return jsonResponse(200, post);
    }

    // --------------- Public contact endpoint ---------------

      if (routeKey === "POST /contact") {
      let body;
      try {
        body = event.body ? JSON.parse(event.body) : {};
      } catch {
        return jsonResponse(400, { error: "INVALID_JSON" });
      }

      const { name, email, message, source } = body || {};
      if (!name || !email || !message) {
        return jsonResponse(400, {
          error: "NAME_EMAIL_MESSAGE_REQUIRED"
        });
      }

      const lead = await data.createLead({
        name,
        email,
        message,
        source
      });

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

      return jsonResponse(201, { ok: true, leadId: lead.id });
    }


    // --------------- Admin endpoints (no auth yet) ---------------

    if (routeKey === "GET /admin/posts") {
      const posts = await data.listAllPosts();
      return jsonResponse(200, posts);
    }


    if (routeKey === "POST /admin/posts") {
      let body;
      try {
        body = event.body ? JSON.parse(event.body) : {};
      } catch {
        return jsonResponse(400, { error: "INVALID_JSON" });
      }

      const { title, slug, content, tags, status } = body || {};

      if (!title || !slug) {
        return jsonResponse(400, { error: "TITLE_AND_SLUG_REQUIRED" });
      }

      try {
        const item = await data.createPost({
          title,
          slug,
          content,
          tags,
          status
        });
        return jsonResponse(201, item);
      } catch (err) {
        if (err.name === "ConditionalCheckFailedException") {
          return jsonResponse(409, { error: "SLUG_ALREADY_EXISTS" });
        }
        console.error("Error creating post:", err);
        return jsonResponse(500, { error: "FAILED_TO_CREATE_POST" });
      }
    }

    if (routeKey === "GET /admin/leads") {
      const leads = await data.listLeads();
      leads.sort((a, b) =>
        a.createdAt < b.createdAt ? 1 : -1
      );
      return jsonResponse(200, leads);
    }

    // --------------- Fallback ---------------

    return jsonResponse(404, { error: "NOT_FOUND", routeKey });
  } catch (err) {
    console.error("Lambda handler error:", err);
    return jsonResponse(500, { error: "INTERNAL_ERROR" });
  }
};
