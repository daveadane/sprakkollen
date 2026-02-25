import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../state/useAuth";

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      await login(email, password);
      nav("/dashboard");
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md mx-auto p-4">
      <input className="border p-2 w-full" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
      <input className="border p-2 w-full mt-2" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" />
      {err && <div className="text-red-600 mt-2">{err}</div>}
      <button className="bg-black text-white px-4 py-2 mt-3">Login</button>
    </form>
  );
}

