import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useAuth from "../../state/useAuth";

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  const mustLogin = location.state?.reason === "auth";
  const from = location.state?.from || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      await login(email, password);
      nav(from, { replace: true });
    } catch (e) {
      setErr(e.message || "Login failed");
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md mx-auto p-4">
      {mustLogin && (
        <div className="mb-3 rounded bg-red-50 p-2 text-sm text-red-600">
          Please login or register to continue.
        </div>
      )}

      <input
        className="border p-2 w-full"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />

      <input
        className="border p-2 w-full mt-2"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />

      {err && <div className="text-red-600 mt-2">{err}</div>}

      <button className="bg-black text-white px-4 py-2 mt-3">Login</button>
    </form>
  );
}