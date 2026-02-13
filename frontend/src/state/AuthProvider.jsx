import { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() =>
    localStorage.getItem("sprakkollen_token")
  );

  const value = useMemo(() => {
    return {
      token,
      isAuthed: Boolean(token),
      login: (newToken) => {
        localStorage.setItem("sprakkollen_token", newToken);
        setToken(newToken);
      },
      logout: () => {
        localStorage.removeItem("sprakkollen_token");
        setToken(null);
      },
    };
  }, [token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// hook in same file is OK, but ESLint may still complain.
// so we move it to a separate file:
export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used inside <AuthProvider>");
  return ctx;
}

export { AuthContext };
