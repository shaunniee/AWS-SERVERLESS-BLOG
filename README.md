
# AWS Serverless Blog & CRM

**LINK: https://d1cuwyawn63jd9.cloudfront.net**

A **serverless blog + lightweight CRM** built to showcase real-world AWS architecture:

- Public **blog** with markdown posts and rich media (images in S3)
- **Admin dashboard (CRM)** for managing posts + viewing inbound leads
- **React + Vite + Tailwind** frontend hosted on **S3 + CloudFront**
- **API Gateway HTTP API + Lambda (Node.js)** backend
- **DynamoDB single-table** design for posts and leads
- **Cognito User Pool** for admin login
- **SSM Parameter Store** + environment variables (no hardcoded config)
- **CodePipeline + CodeBuild** for frontend and backend CI/CD

---

## 1. High-level architecture

**Region:** `eu-west-1`

<img width="2589" height="2580" alt="Blank diagram" src="https://github.com/user-attachments/assets/4ab843e5-5d58-4a25-8ee5-f4949dfa92ec" />

---

## 2. Tech stack

**Frontend**

- React + Vite
- React Router
- Tailwind CSS
- React Markdown + remark-gfm (GitHub-style markdown preview)
- Cognito login (amazon-cognito-identity-js)

**Backend**

- Node.js Lambda (single handler)
- API Gateway HTTP API
- DynamoDB (single table for posts + leads)
- S3 media bucket for images (uploaded from editor)
- SNS topic for “new lead” notifications (optional)

**DevOps / Infra**

- S3 static hosting + CloudFront
- CodePipeline + CodeBuild (frontend + backend)
- SSM Parameter Store for all config values used by buildspec / app

---

## 3. Repository layout

```bash
AWS-SERVERLESS-BLOG/
├─ frontend/
│  ├─ src/
│  │  ├─ pages/
│  │  │  ├─ Home.jsx
│  │  │  ├─ BlogList.jsx
│  │  │  ├─ BlogPost.jsx
│  │  │  ├─ Contact.jsx
│  │  │  ├─ LoginPage.jsx
│  │  │  ├─ AdminPosts.jsx
│  │  │  ├─ AdminLeads.jsx
│  │  │  └─ AdminPostEditor.jsx
│  │  ├─ admin/AdminLayout.jsx
│  │  ├─ auth/
│  │  │  ├─ AuthContext.jsx
│  │  │  ├─ ProtectedRoute.jsx
│  │  │  └─ cognito.js
│  │  ├─ api.js
│  │  ├─ App.jsx
│  │  └─ main.jsx
│  ├─ tailwind.config.js
│  ├─ postcss.config.js
│  ├─ vite.config.js
│  ├─ package.json
│  └─ buildspec-frontend.yml
│
├─ backend/
│  ├─ src/
│  │  ├─ lambda-handler.js   # API Gateway entrypoint
│  │  └─ storage.js          # DynamoDB + S3 abstractions
│  ├─ package.json
│  └─ buildspec-backend.yml
│
├─ diagrams/
│  └─ architecture-high-level.drawio
│
└─ README.md
```

---

## 4. Configuration via SSM Parameter Store

You’re using **SSM Parameter Store** as the central source of truth for config.

### 4.1 Frontend parameters

Example Parameter Store paths:

```text
/blog-app/frontend/api-base-url
/blog-app/frontend/cognito-region
/blog-app/frontend/user-pool-id
/blog-app/frontend/user-pool-client-id
/blog-app/frontend/frontend-origin
```

In **CodeBuild** (`buildspec-frontend.yml`), you map them into Vite env vars:

```yaml
env:
  parameter-store:
    VITE_API_BASE_URL: "/blog-app/frontend/api-base-url"
    VITE_COGNITO_REGION: "/blog-app/frontend/cognito-region"
    VITE_COGNITO_USER_POOL_ID: "/blog-app/frontend/user-pool-id"
    VITE_COGNITO_CLIENT_ID: "/blog-app/frontend/user-pool-client-id"
```

Vite automatically exposes any `VITE_*` variable to the frontend.  
The React app reads them via `import.meta.env.VITE_API_BASE_URL`, etc.

### 4.2 Backend parameters

Example backend Parameter Store keys:

```text
/blog-app/backend/blog-table-name
/blog-app/backend/media-bucket
/blog-app/backend/media-prefix
/blog-app/backend/media-base-url
/blog-app/backend/leads-topic-arn
/blog-app/backend/frontend-origin
```

You have two options:

1. **Simpler (current setup):**  
   Use Parameter Store in CodeBuild to set **Lambda environment variables**:

   ```yaml
   env:
     parameter-store:
       BLOG_TABLE_NAME: "/blog-app/backend/blog-table-name"
       MEDIA_BUCKET: "/blog-app/backend/media-bucket"
       MEDIA_PREFIX: "/blog-app/backend/media-prefix"
       MEDIA_BASE_URL: "/blog-app/backend/media-base-url"
       LEADS_TOPIC_ARN: "/blog-app/backend/leads-topic-arn"
       FRONTEND_ORIGIN: "/blog-app/backend/frontend-origin"
   ```

   Then in `lambda-handler.js` / `storage.js` you read:

   ```js
   const tableName = process.env.BLOG_TABLE_NAME;
   const MEDIA_BUCKET = process.env.MEDIA_BUCKET;
   const MEDIA_BASE_URL = process.env.MEDIA_BASE_URL;
   const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN;
   ```



---

## 5. DynamoDB model

Single table (e.g. `blog-app-table`):

**Partition key:** `pk`  
**Sort key:** `sk`

### Blog posts

- `pk = POST#<slug>`
- `sk = METADATA`
- Attributes:
  - `type = "POST"`
  - `slug`
  - `title`
  - `excerpt`
  - `content` (markdown)
  - `tags` (list of strings)
  - `status` (`draft` or `published`)
  - `createdAt`, `updatedAt`, `publishedAt` (ISO strings)

### Leads

- `pk = LEAD#<id>`
- `sk = METADATA`
- Attributes:
  - `type = "LEAD"`
  - `id`
  - `name`
  - `email`
  - `message`
  - `source` (page or context)
  - `status` (e.g. `"new"`)
  - `createdAt`

The `storage.js` module hides all of this behind functions:

- `listPublishedPosts()`
- `listAllPosts()`
- `listLeads()`
- `getPostBySlug(slug)`
- `createPost({ title, slug, content, tags, status })`
- `updatePostBySlug(slug, updates)`
- `createLead({ name, email, message, source })`
- `uploadMediaFromBase64({ base64Data, contentType, originalName })`

---

## 6. Backend: Lambda handler

`backend/src/lambda-handler.js` is a **single Lambda** that handles all routes behind API Gateway.

### Routing helper

- `normalizePath(event)` handles `rawPath` / `path` and strips the stage.
- `getMethod(event)` normalizes HTTP method.
- `jsonResponse(statusCode, body, origin)` wraps responses and sets all CORS headers.
- `parseBody(event)` safely parses JSON, including base64-encoded bodies.

### Public endpoints

- `GET /health`  
  Returns `{ status: "ok", service: "blog-crm-backend", region }`.

- `GET /posts`  
  Returns a list of published posts (title, slug, excerpt, tags, publishedAt).

- `GET /posts/{slug}`  
  Returns full post content if `status === "published"`, else 404.

- `POST /contact`  
  Validates name/email/message, creates a `LEAD` item in DynamoDB, and (if `LEADS_TOPIC_ARN` is set) sends a JSON payload to SNS. Returns `{ ok: true, leadId }`.

### Admin endpoints (protected by Cognito JWT)

Auth is enforced in **API Gateway** via a Cognito authorizer (User Pool). Lambda assumes `/admin/*` is only called with a valid JWT.

- `GET /admin/posts`  
  List all posts (draft + published) for the admin dashboard.

- `POST /admin/posts`  
  Creates a new post. Slug uniqueness enforced with a conditional write.

- `GET /admin/leads`  
  Reads all `LEAD#` items, sorts by `createdAt` desc.

- `POST /admin/media`  
  Accepts `{ base64Data, contentType, filename }`, writes to `MEDIA_BUCKET` under `MEDIA_PREFIX`, and returns `{ ok, url, key }`.

- `GET /admin/posts/{slug}`  
  Returns full post (draft or published) for editing.

- `PUT /admin/posts/{slug}`  
  Merges updates into an existing post; if status becomes `published` and there was no `publishedAt`, sets `publishedAt = now`.

Anything not matched returns a `404` with `{ error: "NOT_FOUND", method, path }`.

---

## 7. Frontend: routes, editor, media

### Routing

In `App.jsx` (simplified):

- `/` → `Home`
- `/blog` → `BlogList`
- `/blog/:slug` → `BlogPost`
- `/contact` → `Contact`
- `/login` → `LoginPage`
- `/admin/*` → `ProtectedRoute` → `AdminLayout`
  - `/admin` → `AdminPosts`
  - `/admin/posts` → `AdminPosts`
  - `/admin/posts/new` → `AdminPostEditor` (create mode)
  - `/admin/posts/:slug/edit` → `AdminPostEditor` (edit mode)
  - `/admin/leads` → `AdminLeads`

### Auth

`auth/cognito.js` wraps Cognito:

- `signIn(username, password)` handles:
  - Normal auth
  - Force-change-password flow (`NEW_PASSWORD_REQUIRED`)
- Returns access/id tokens + expiry.

`AuthContext.jsx`:

- Stores tokens in memory + localStorage
- Checks expiry, auto logs out if expired
- Provides `user`, `login`, `logout`, `isAuthenticated`

`ProtectedRoute.jsx`:

- If not authenticated → redirect to `/login`
- If authenticated → render children (e.g. `AdminLayout`)

### Admin UI

`AdminLayout.jsx`:

- Sidebar nav: Posts / Leads
- Top bar: current username + sign out
- `<Outlet />` renders the active admin page

`AdminPosts.jsx`:

- Fetches `/admin/posts`
- Shows table of posts:
  - Title, status, tags, created/published dates
- Actions:
  - View:
    - If post is `published` → `/blog/:slug`
    - If `draft` → `/admin/posts/:slug/edit`
  - Edit:
    - `/admin/posts/:slug/edit`
  - New post:
    - `/admin/posts/new`

`AdminPostEditor.jsx`:

- Detects **create vs edit** mode using route param
- Handles:
  - Title
  - Slug (auto from title, can unlock to edit)
  - Status (draft/published)
  - Tags (comma-separated)
  - Markdown content
- Markdown editor:
  - Left: textarea
  - Right: live preview with `react-markdown` + `remark-gfm`
- Media upload:
  - File input (“Upload image”)
  - Converts selected file to base64
  - Calls `POST /admin/media`
  - Inserts `![filename](https://media-url)` at cursor position

`BlogPost.jsx`:

- Uses `ReactMarkdown` to render the post content exactly as stored (including uploaded image URLs).

---

## 8. CI/CD

### 8.1 Frontend pipeline

- **Source:** GitHub repo
- **Stages:**
  1. **Source** → pulls from main branch
  2. **Build (CodeBuild)**:
     - Reads SSM parameters into Vite env vars
     - `npm ci`
     - `npm run build`
  3. **Deploy:**  
     - `aws s3 sync frontend/dist s3://<frontend-bucket> --delete`
     - `aws cloudfront create-invalidation --paths "/*"`

`frontend/buildspec-frontend.yml` already uses **Parameter Store** for Vite config.

### 8.2 Backend build

- **Source:** Same repo
- **Build (CodeBuild):**
  - `cd backend && npm ci`
  - `zip -r ../backend-lambda.zip .`
  - `aws lambda update-function-code --function-name blog-lambda-posts --zip-file fileb://backend-lambda.zip`
- **Env:** uses SSM Parameter Store for backend config variables if needed, and plain env vars for `LAMBDA_FUNCTION_NAME` / `AWS_REGION`.

You’re *not* using CloudFormation for backend deployment – CodeBuild directly updates the Lambda function code.

---

## 9. Security & best practices

- **No hardcoded secrets**
  - All configuration via:
    - **SSM Parameter Store** → CodeBuild env → Vite / Lambda env vars
  - No access keys or secret IDs in code

- **IAM least privilege**
  - Lambda role:
    - `dynamodb:GetItem`, `PutItem`, `Scan` on the **blog table** only
    - `s3:PutObject` (and optionally `GetObject`) on the **media bucket** only
    - `sns:Publish` only on the **leads topic** ARN
  - CodeBuild roles:
    - Frontend project: S3 + CloudFront + SSM GetParameter
    - Backend project: `lambda:UpdateFunctionCode` on the specific Lambda + SSM GetParameter

- **Auth**
  - Cognito User Pool for admin users
  - JWT authorizer in API Gateway for `/admin/*`
  - Frontend checks token expiry and auto-signs out

- **CORS**
  - Responses include:
    - `Access-Control-Allow-Origin` set to:
      - CloudFront domain in prod (`FRONTEND_ORIGIN`)
      - `http://localhost:5173` in dev
  - `OPTIONS` handled centrally in Lambda

- **Transport security**
  - CloudFront + API Gateway endpoints are HTTPS
  - No direct public access to DynamoDB or Lambda

- **Error handling**
  - Clear 4xx responses for validation errors
  - 5xx responses log full error details to CloudWatch
  - No sensitive data logged

---

