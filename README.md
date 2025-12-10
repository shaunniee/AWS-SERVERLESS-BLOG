# AWS Serverless Blog & CRM

**LINK: https://d1cuwyawn63jd9.cloudfront.net**

Production-style serverless blog platform with a lightweight CRM for inbound leads – designed as a recruiter-facing portfolio project and a real tool you can actually use.

---

## 1. What this project is

**Goal:** A real-world, serverless web application that shows you can design, build and operate a modern AWS workload end‑to‑end:

- Public blog (Markdown + media uploads)
- Admin dashboard (posts + leads)
- Contact → lead capture
- Authenticated admin flows (Cognito + JWT → API Gateway authorizer)
- CI/CD for **frontend** (S3 + CloudFront) and **backend** (Lambda code updates)
- No hard-coded secrets – configuration via **SSM Parameter Store** / environment variables

Tech stack:

- **Frontend:** React (Vite), React Router, Tailwind CSS
- **Auth:** Amazon Cognito User Pool (email + password)
- **API:** Amazon API Gateway (HTTP API)
- **Compute:** AWS Lambda (single “blog-crm” function)
- **Data:** DynamoDB (single-table design: posts + leads)
- **Media:** S3 “media” bucket (blog images)
- **Delivery:** S3 static hosting + CloudFront (SPA)
- **Messaging:** SNS topic (optional) for new lead notifications
- **Config:** SSM Parameter Store for non-secret config (URLs, ARNs, table names)

---

## 2. High-level architecture

<img width="2589" height="2580" alt="Blank diagram" src="https://github.com/user-attachments/assets/4ab843e5-5d58-4a25-8ee5-f4949dfa92ec" />

### 2.1 Diagram (mental model)

**User flow**

1. Browser hits **CloudFront**.
2. CloudFront serves the React SPA from an **S3 website bucket**.
3. React SPA calls **API Gateway** for posts, contact and admin endpoints.
4. API Gateway:
   - Public routes → call Lambda directly.
   - `/admin/*` routes → validate Cognito JWT via authorizer, then call Lambda.
5. Lambda:
   - Uses **DynamoDB** for posts and leads.
   - Uses **S3 media bucket** for blog images.
   - Optionally publishes an SNS message when a new lead is created.

**Admin flow**

1. Admin goes to `/login` on the SPA.
2. SPA uses `amazon-cognito-identity-js` to authenticate against **Cognito**.
3. Cognito returns **ID / access tokens**.
4. Tokens are stored in localStorage and attached as `Authorization: Bearer <token>` to `/admin/*` API calls.
5. API Gateway authorizer checks the token, passes the request to Lambda.
6. Lambda performs DynamoDB operations (posts/leads) and returns JSON.


---

## 3. Data model (DynamoDB single-table)

Single table, for example:

```text
Table name: BLOG_TABLE_NAME

Partition key: pk (string)
Sort key:     sk (string)
```

### 3.1 Post items

- `pk = "POST#<slug>"`
- `sk = "METADATA"`
- Attributes:
  - `type = "POST"`
  - `slug` – URL slug (unique)
  - `title`
  - `content` – Markdown
  - `excerpt` – short preview (generated)
  - `tags` – string[]
  - `status` – `"draft"` or `"published"`
  - `createdAt`, `updatedAt`, `publishedAt`

### 3.2 Lead items

- `pk = "LEAD#<id>"`
- `sk = "METADATA"`
- Attributes:
  - `type = "LEAD"`
  - `id` – generated ID (timestamp + random bits)
  - `name`, `email`, `message`, `source`
  - `status` – `"new"`
  - `createdAt`

### 3.3 Access patterns

- **Public blog list** – `Scan` on `begins_with(pk, "POST#")` and `status = "published"` → sorted by `publishedAt` descending.
- **Public blog detail** – `Get` with `pk = POST#slug, sk = METADATA`.
- **Admin posts list** – `Scan` on `begins_with(pk, "POST#")` (draft + published).
- **Admin leads list** – `Scan` on `begins_with(pk, "LEAD#")` sorted by `createdAt`.

For a real production project you’d move to GSI-based queries and avoid Scan, but for a portfolio + small personal blog this is fine and keeps code readable.

---

## 4. S3 buckets and media strategy

### 4.1 Static website bucket

- Bucket: `aws-serverless-blog-frontend-<env>`
- CloudFront origin: this bucket (origin access control / OAI as needed).
- React app built with `npm run build` → `dist/` uploaded to this bucket by CodeBuild.

### 4.2 Media bucket

- Bucket: `aws-serverless-blog-media-<env>`
- Prefix: `media/`
- No public ACLs (bucket has **ACLs disabled**).
- Bucket policy allows **CloudFront origin access** or presigned URLs (in this project we link via `MEDIA_BASE_URL` which is the CloudFront domain pointing at this bucket or a public static website config).

Backend receives a base64 image from the admin editor, writes it to S3:

```js
// storage.js
export async function uploadMediaFromBase64({ base64Data, contentType, originalName }) {
  const buffer = Buffer.from(base64Data, "base64");
  const safeName = sanitizeFilename(originalName);
  const key = `${MEDIA_PREFIX}${Date.now()}-${crypto.randomUUID()}-${safeName}`;

  await s3.send(new PutObjectCommand({
    Bucket: MEDIA_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType || "application/octet-stream",
  }));

  return {
    key,
    url: `${MEDIA_BASE_URL}/${key}`, // resolved via CloudFront or direct bucket URL
  };
}
```

The React admin editor inserts a standard Markdown image:

```md
![screenshot](/media/...generated-key...)
```

so the same content works locally and in production.

---

## 5. Backend: Lambda handler

### 5.1 Responsibilities

- Handle **public** routes:
  - `GET /health`
  - `GET /posts`
  - `GET /posts/{slug}`
  - `POST /contact`
- Handle **admin** routes (API Gateway authorizer already validated Cognito JWT):
  - `GET /admin/posts`
  - `POST /admin/posts`
  - `GET /admin/posts/{slug}`
  - `PUT /admin/posts/{slug}`
  - `GET /admin/leads`
  - `POST /admin/media`
- Call SNS on new lead (optional)
- Handle CORS for both `OPTIONS` and real requests.

### 5.2 CORS and routing

Key helpers:

```js
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_ORIGIN,
].filter(Boolean);

function jsonResponse(statusCode, body, origin) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin || allowedOrigins[0] || "*",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers":
        "Content-Type,Authorization,X-Requested-With,Origin,Accept",
      "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

function normalizePath(event) {
  let path = event.rawPath || event.path || "/";
  const stage = event.requestContext?.stage;

  if (stage && path.startsWith(`/${stage}/`)) {
    path = path.slice(stage.length + 1);
  } else if (stage && path === `/${stage}`) {
    path = "/";
  }
  return path;
}
```

Routing is done with simple `if` chains inside `handler(event)` based on `method` and `path`.


---

## 6. Frontend (React + Vite + Tailwind)

### 6.1 Main structure

- `frontend/src/App.jsx` – shell layout + routing
- `frontend/src/pages/*`:
  - `Home.jsx` – explains the project, stack and links to blog + admin.
  - `BlogList.jsx` – fetches `GET /posts`.
  - `BlogPost.jsx` – fetches `GET /posts/:slug` and renders Markdown.
  - `Contact.jsx` – posts to `/contact`.
  - `LoginPage.jsx` – Cognito login, force-change-password flow, error handling.
  - `AdminPosts.jsx` – admin list of posts, with status, timestamps and view/edit actions.
  - `AdminLeads.jsx` – list of captured leads.
  - `AdminPostEditor.jsx` – full-page Markdown editor with media upload & live preview.
- `frontend/src/auth/*`:
  - `cognito.js` – sign-in / sign-out / token helpers.
  - `AuthContext.jsx` – stores user + tokens, provides `login` / `logout`.
  - `ProtectedRoute.jsx` – wraps admin routes.
- `frontend/src/api.js` – all API calls; builds URLs from `import.meta.env.VITE_API_BASE_URL` and attaches JWTs automatically.

### 6.2 Environment variables (no hard-coded values)

Vite reads variables prefixed with `VITE_`:

```bash
# .env.local (not committed)
VITE_API_BASE_URL=https://your-api-id.execute-api.eu-west-1.amazonaws.com
VITE_COGNITO_USER_POOL_ID=eu-west-1_XXXXXXX
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxx
VITE_COGNITO_REGION=eu-west-1
```

`api.js` and `cognito.js` read these values at build time; nothing is hard-coded into source.

### 6.3 Admin editor UX

- Full-width layout inside protected admin route.
- Left pane: Markdown text area + “Upload image” button.
- Right pane: live preview using `react-markdown` + `remark-gfm` with Tailwind typography-style classes.
- When you click **Upload image**:
  - File is read as base64 in the browser.
  - Frontend calls `POST /admin/media` with base64 payload.
  - Lambda uploads to S3 and returns a URL.
  - Editor inserts `![filename](url)` into the content.


---

## 7. Authentication (Cognito)

- **User Pool**:
  - One app client (no secret) used by the SPA.
  - Hosted in `eu-west-1` (same as the rest of the stack).
- **Admin users**:
  - Created via console or CLI.
  - Make sure the user is `CONFIRMED` (no lingering `FORCE_CHANGE_PASSWORD`).

Flow in the SPA:

1. User enters email + password.
2. `amazon-cognito-identity-js` calls Cognito:
   - Handles `NEW_PASSWORD_REQUIRED` challenge when user is in `FORCE_CHANGE_PASSWORD` state.
3. On success, store `idToken` + `accessToken` in localStorage.
4. `AuthContext` exposes `user`, `login`, `logout`, and a helper to retrieve the current access token.
5. `ProtectedRoute` checks that a non-expired token exists before rendering admin routes.
6. All `/admin/*` requests include `Authorization: Bearer <accessToken>`.

API Gateway authorizer validates the token against the same user pool and client.

---

## 8. CI/CD

### 8.1 Frontend pipeline

- **Source:** GitHub repo (or CodeCommit) – `main` branch.
- **CodeBuild project (frontend)**:
  - Buildspec stored in repo under `frontend/buildspec-frontend.yml`.
  - Runs `npm ci`, `npm run build`, uploads `dist/` to S3, triggers CloudFront invalidation.
- **CodePipeline**:
  - Stages:
    1. Source – pull from Git.
    2. Build – CodeBuild frontend project.

Example `buildspec-frontend.yml` (simplified):

```yaml
version: 0.2

phases:
  install:
    commands:
      - cd frontend
      - npm ci
  build:
    commands:
      - cd frontend
      - npm run build
  post_build:
    commands:
      - aws s3 sync frontend/dist "s3://$FRONTEND_BUCKET" --delete
      - aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" --paths "/*"
```

Environment variables like `FRONTEND_BUCKET` and `CLOUDFRONT_DISTRIBUTION_ID` are set in the CodeBuild project configuration (not hard-coded in the spec).

### 8.2 Backend pipeline

- **Source:** Same repo (`backend/` directory).
- **CodeBuild project (backend)**:
  - `buildspec-backend.yml` stored in `backend/` folder.
  - zips backend code and runs `aws lambda update-function-code`.
- **CodePipeline**:
  - Either a separate pipeline or an extra parallel build stage in the frontend pipeline.

Example `buildspec-backend.yml` (simplified):

```yaml
version: 0.2

phases:
  install:
    commands:
      - cd backend
      - npm ci
  build:
    commands:
      - cd backend
      - zip -r backend-lambda.zip .
  post_build:
    commands:
      - aws lambda update-function-code \
          --function-name "$LAMBDA_FUNCTION_NAME" \
          --zip-file fileb://backend/backend-lambda.zip \
          --region "$AWS_REGION"
```

Here again, `LAMBDA_FUNCTION_NAME` and `AWS_REGION` are configured on the CodeBuild project (or CodePipeline environment), not committed to source.


---

## 9. Configuration & security choices

Key security and robustness choices you can talk about in interviews:

1. **No hard‑coded secrets**
   - Cognito IDs, table names, bucket names, API URLs etc. pulled from:
     - **Vite env** variables on the frontend (`.env.local`, not committed).
     - **Lambda environment variables** (injected via console / IaC).
     - **SSM Parameter Store** holds values for reuse (e.g. API URL, CloudFront domains); pipeline reads them and passes into env variables.
2. **Least-privilege IAM**
   - Lambda role:
     - `dynamodb:GetItem/PutItem/Scan/Query` on the single table.
     - `s3:PutObject` only on the media bucket with `media/*` prefix.
     - `sns:Publish` only on the leads topic (if configured).
   - CodeBuild roles:
     - `s3:PutObject` on frontend bucket.
     - `cloudfront:CreateInvalidation` for the distribution.
     - `lambda:UpdateFunctionCode` for the backend function.
3. **Cognito-protected admin routes**
   - No open admin endpoints – everything under `/admin/*` requires a valid JWT.
4. **CORS locked down**
   - `Access-Control-Allow-Origin` limited to known origins (`localhost` + production CloudFront).
5. **No S3 ACLs**
   - Media bucket uses **ACLs disabled** + bucket policies / CloudFront to control access.
6. **SPA routing fixes**
   - CloudFront + S3 configured so that all unknown paths (e.g. `/blog/my-post`) return `index.html`, letting React Router handle routing.

---

## 10. Issues & troubleshooting (short summary)

A few real issues you hit and how they were fixed:

1. **Cognito “FORCE_CHANGE_PASSWORD” / NotAuthorized**
   - Symptom: `NotAuthorizedException: Incorrect username or password` or `NEW_PASSWORD_REQUIRED` behaviour.
   - Fix: In the Cognito console, either complete the new password challenge via the login flow in the app, or set/confirm the password manually so the user status becomes `CONFIRMED`.

2. **401/403 on `/admin/*` despite login**
   - Symptom: API returns 401, browser console shows missing or invalid token.
   - Fix:
     - Ensure frontend attaches `Authorization: Bearer <accessToken>`.
     - Check API Gateway authorizer is configured with the correct **user pool** and **audience (client ID)**.
     - Verify token hasn’t expired and is not a dummy.

3. **CORS errors in browser**
   - Symptom: `No 'Access-Control-Allow-Origin' header` or blocked by CORS.
   - Fix:
     - Add `OPTIONS` route in API Gateway and handle it in the Lambda handler.
     - Ensure `Access-Control-Allow-Origin` is set to your CloudFront domain and `localhost:5173` during dev.

4. **CloudFront “AccessDenied” or blank pages on deep links**
   - Symptom: Refresh on `/blog/<slug>` returns `AccessDenied`.
   - Fix: Configure CloudFront / S3 static website to return `index.html` as the 404 / error document so SPA routing works.

5. **CodeBuild YAML / path issues**
   - Symptom: `YAML_FILE_ERROR` or `cd frontend: No such file or directory`.
   - Fix:
     - Keep buildspec in the correct folder and adjust `cd` paths accordingly.
     - Use `buildspec-frontend.yml` under `frontend/` and reference that in the CodeBuild project.

6. **S3 ACL / media upload errors**
   - Symptom: `AccessControlListNotSupported: The bucket does not allow ACLs`.
   - Fix: Stop sending ACLs from the SDK (`PutObject` without ACL), or disable ACLs on the bucket and rely on bucket policy.

7. **DynamoDB ValidationException (`Type mismatch for key pk`)**
   - Symptom: Insert/update failing after refactors.
   - Fix: Ensure you pass a plain JS object (no nested `marshall` calls) shaped like:
     - `pk: "POST#slug", sk: "METADATA"` etc.
     - Removed extra `marshall()` calls and used `PutCommand` with an object.

You can keep this section short in the README but talk through the debugging in interviews.

---

## 11. How to run locally

### 11.1 Backend

```bash
cd backend
cp .env.example .env.local   # fill BLOG_TABLE_NAME, MEDIA_BUCKET, etc.
npm install
npm run dev                  # or node src/server.js for pure Express mode
```

- Use `aws-vault` or a profile with permissions to DynamoDB + S3 + SNS (for local dev).
- You can point `API_BASE_URL` in the frontend to `http://localhost:4000` during development.

### 11.2 Frontend

```bash
cd frontend
cp .env.example .env.local   # VITE_API_BASE_URL, Cognito IDs etc.
npm install
npm run dev                  # http://localhost:5173
```

Create a test Cognito user, confirm the password and then log in via `/login` to access `/admin`.

---

