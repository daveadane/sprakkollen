import { apiFetch } from "./api";
import { setAccessToken, getAccessToken, clearAccessToken } from "../state/auth_store";

export async function login(email, password) {
  const body = new URLSearchParams();
  body.set("username", email);
  body.set("password", password);

  const data = await apiFetch("/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  // backend returns { access_token, token_type }
  setAccessToken(data.access_token);
  return data;
}

export async function refresh() {
  try {
    const data = await apiFetch("/auth/refresh", { method: "POST" });
    setAccessToken(data.access_token);
    return data;
  } catch (e) {
    if (e.status === 401) return null; // silently ignore
    throw e;
  }
}

export async function me() {
  const token = getAccessToken();
  if (!token) throw new Error("No access token");

  return apiFetch("/auth/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function logout() {
  const token = getAccessToken();
  if (token) {
    await apiFetch("/auth/logout", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }
  clearAccessToken();
}

export async function register({ email, password, first_name, last_name }) {
  return apiFetch("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, first_name, last_name }),
  });
}