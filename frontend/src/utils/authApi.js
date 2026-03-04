import { apiFetch } from "./api";
import { setAccessToken, clearAccessToken } from "../state/auth_store";

export async function login(email, password) {
  const body = new URLSearchParams();
  body.set("username", email);
  body.set("password", password);

  const data = await apiFetch("/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  setAccessToken(data.access_token);
  return data;
}

// ✅ NO refresh() (teacher wants it removed)

export async function me() {
  // api.js already injects Authorization if token exists
  return apiFetch("/auth/me", { method: "GET" });
}

export async function logout() {
  // api.js already injects Authorization if token exists
  await apiFetch("/auth/logout", { method: "DELETE" }).catch(() => {});
  clearAccessToken();
}

export async function register({ email, password, first_name, last_name }) {
  // apiFetch will JSON stringify objects automatically (your api.js does that)
  return apiFetch("/auth/register", {
    method: "POST",
    body: { email, password, first_name, last_name },
  });
}
