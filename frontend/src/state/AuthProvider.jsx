import { useEffect, useMemo, useState } from "react";
import { login as apiLogin, logout as apiLogout, me } from "../utils/authApi";
import { getAccessToken, clearAccessToken } from "./auth_store";
import { AuthContext } from "./authContext";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // ✅ Run once on app start:
  // If access token exists -> call /me
  // Otherwise user stays logged out
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const token = getAccessToken();
        if (!token) {
          if (alive) setUser(null);
          return;
        }

        const u = await me();
        if (alive) setUser(u);
      } catch {
        clearAccessToken();
        if (alive) setUser(null);
      } finally {
        if (alive) setReady(true);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  async function login(email, password) {
    await apiLogin(email, password);
    const u = await me();
    setUser(u);
    return u;
  }

  async function logout() {
    await apiLogout().catch(() => {});
    clearAccessToken();
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      ready,
      isAuthed: !!user,
      login,
      logout,
    }),
    [user, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
