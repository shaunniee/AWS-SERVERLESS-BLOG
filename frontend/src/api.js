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

export async function fetchAdminPost(slug) {
  const res = await fetch(`${API_BASE}/admin/posts/${slug}`);
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
export async function uploadMedia(file, token) {
  const base64Data = await fileToBase64(file);

  const res = await fetch(`${API_BASE}/admin/media`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({
      base64Data,
      contentType: file.type,
      filename: file.name,
    }),
  });

  if (!res.ok) {
    throw new Error("MEDIA_UPLOAD_FAILED");
  }
  return await res.json(); // { ok, url, key }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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


export async function updatePost(slug, payload, token) {
  const res = await fetch(`${API_BASE}/admin/posts/${slug}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("FAILED_TO_UPDATE_POST");
  return await res.json();
}