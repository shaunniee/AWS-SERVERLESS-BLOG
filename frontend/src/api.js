import { getStoredAccessToken ,clearStoredSession} from "./auth/cognito";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

function authHeaders() {
  const token = getStoredAccessToken();
  console.log("authHeaders token", token); // 👈 add this
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchPosts() {
  const res = await fetch(`${API_BASE}/posts`);
  if (!res.ok) throw new Error("Failed to fetch posts");
  return res.json();
}

export async function fetchPost(slug) {
  const res = await fetch(`${API_BASE}/posts/${slug}`);
  if (!res.ok) throw new Error("Failed to fetch post");
  return res.json();
}

export async function sendContact(form) {
  const res = await fetch(`${API_BASE}/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });
  if (!res.ok) throw new Error("Failed to send contact");
  return res.json();
}

// ---------- admin ----------

export async function fetchAdminPosts() {
  const res = await fetch(`${API_BASE}/admin/posts`, {
    headers: {
      ...authHeaders(),
    },
  });
  if (!res.ok) throw new Error("Failed to fetch admin posts");
  return res.json();
}

export async function createAdminPost(post) {
  const res = await fetch(`${API_BASE}/admin/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(post),
  });
  if (!res.ok) throw new Error("Failed to create post");
  return res.json();
}

export async function fetchLeads() {
  const res = await fetch(`${API_BASE}/admin/leads`, {
    headers: {
      ...authHeaders(),
    },
  });
  if (!res.ok) throw new Error("Failed to fetch leads");
  return res.json();
}
