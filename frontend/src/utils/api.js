// src/utils/api.js

import { getAccessToken, clearAccessToken } from "../state/auth_store";

// If you use Vite env: VITE_API_BASE_URL=http://localhost:8000
// We append /api here to match your FastAPI prefix.
const API_ROOT =
  (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000") + "/api";

async function parseBody(res) {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return await res.json();
  }
  // fallback for plain text / html errors
  const text = await res.text();
  return text ? { detail: text } : null;
}

/**
 * apiFetch(path, options)
 * - path: "/auth/me" (will become `${API_ROOT}/auth/me`)
 * - options: fetch options
 *
 * Extras:
 * - auto adds Authorization header if token exists (unless you pass your own)
 * - handles errors and throws an Error with .status and .data
 */
export async function apiFetch(path, options = {}) {
  const url = path.startsWith("http") ? path : `${API_ROOT}${path}`;

  const token = getAccessToken();

  // Build headers safely (don’t override FormData content-type)
  const headers = new Headers(options.headers || {});
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // If body is plain object => send JSON
  let body = options.body;
  const isFormData = body instanceof FormData;
  const isBlob = body instanceof Blob;
  const isURLSearchParams = body instanceof URLSearchParams;

  if (
    body &&
    !isFormData &&
    !isBlob &&
    !isURLSearchParams &&
    typeof body === "object"
  ) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(body);
  }

  const res = await fetch(url, {
    ...options,
    headers,
    body,
    // keep include; it won't hurt if you later remove refresh cookies
    credentials: "include",
  });

  const data = await parseBody(res);

  if (!res.ok) {
    // If backend returns 401, clear token (simple & practical)
    if (res.status === 401) {
      clearAccessToken();
    }

    const err = new Error(data?.detail || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}
