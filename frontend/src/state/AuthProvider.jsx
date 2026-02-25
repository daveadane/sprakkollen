import { createContext, useEffect, useMemo, useState } from "react";
import {
  login as apiLogin,
  logout as apiLogout,
  me,
  refresh,
} from "../utils/authApi";
import { clearAccessToken } from "./auth_store";

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // Run once on app start:
  // 1) try refresh (cookie -> new access token)
  // 2) if success, fetch /me and set user
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        await refresh();        // expects cookie, sets access token in memory
        const u = await me();   // uses access token
        if (alive) setUser(u);
      } catch (err) {
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
    await apiLogin(email, password); // sets access token
    const u = await me();
    setUser(u);
    return u;
  }

  async function logout() {
    // best effort: logout access token on backend
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