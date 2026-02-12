import { createContext, useContext, useMemo, useState } from "react";
/* eslint-disable react-refresh/only-export-components */

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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}

