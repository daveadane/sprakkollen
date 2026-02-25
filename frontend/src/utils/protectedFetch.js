import { apiFetch } from "./api";
import { getAccessToken, setAccessToken, clearAccessToken } from "../state/auth_store";
import { refresh } from "./authApi";

export async function protectedFetch(path, options = {}) {
  const token = getAccessToken();

  try {
    return await apiFetch(path, {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch (err) {
    if (err.status === 401) {
      try {
        const r = await refresh();
        setAccessToken(r.access_token);

        return await apiFetch(path, {
          ...options,
          headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${r.access_token}`,
          },
        });
      } catch (e2) {
        clearAccessToken();
        throw e2;
      }
    }
    throw err;
  }
}