import { createContext, useEffect, useState } from "react";
import { login as apiLogin, logout as apiLogout, me, refresh } from "../utils/authApi";

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // refresh() may throw 401 when:
        // - no cookie yet
        // - cookie revoked/rotated
        // That's expected → we should not treat it like a crash.
        const refreshed = await refresh().catch((err) => {
          if (err?.status === 401) return null; // silently ignore expected auth miss
          throw err; // other errors are real problems
        });

        if (!alive) return;

        if (refreshed) {
          const u = await me();
          if (!alive) return;
          setUser(u);
        } else {
          setUser(null);
        }
      } catch (err) {
        // optional: keep a console for unexpected errors
        console.error("Auth init failed:", err);
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
    const data = await apiLogin(email, password);
    // After login, access token is in memory, so /me should work
    setUser(await me());
    return data;
  }

  async function logout() {
    await apiLogout().catch(() => {}); // don't block logout UI on backend errors
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}