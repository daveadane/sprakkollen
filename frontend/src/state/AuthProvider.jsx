import { createContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() =>
    localStorage.getItem("sprakkollen_token")
  );

  const value = useMemo(() => ({
    token,
    isAuthed: Boolean(token),
    login: (newToken) => {
      localStorage.setItem("sprakkollen_token", newToken);
      setToken(newToken);
    },
    logout: () => {
      localStorage.removeItem("sprakkollen_token");
      setToken(null);
    }
  }), [token]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };

