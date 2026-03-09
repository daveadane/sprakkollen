import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    if (password !== confirm) {
      setErr("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setErr("Password must be at least 6 characters.");
      return;
    }
    setErr("");
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, new_password: password }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || "Failed to reset password.");
      setDone(true);
    } catch (e) {
      setErr(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="mx-auto w-full max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center space-y-4">
        <p className="font-bold text-red-700">Invalid reset link</p>
        <p className="text-sm text-red-600">No reset token found in the URL.</p>
        <Link to="/forgot-password" className="text-blue-600 font-semibold hover:underline text-sm">
          Request a new reset link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 text-center">
        <p className="text-3xl">✅</p>
        <h1 className="text-2xl font-black">Password updated!</h1>
        <p className="text-sm text-slate-500">Your password has been reset. You can now log in.</p>
        <button
          onClick={() => navigate("/login")}
          className="w-full rounded-2xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700 transition"
        >
          Go to login
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-black">Set new password</h1>
      <p className="mt-1 text-sm text-slate-500">Choose a strong password of at least 6 characters.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-700">New password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-700">Confirm password</label>
          <input
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}

        <button
          type="submit"
          disabled={loading || !password || !confirm}
          className="w-full rounded-2xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-60 transition"
        >
          {loading ? "Saving…" : "Set new password"}
        </button>

        <p className="text-center text-sm">
          <Link to="/login" className="text-blue-700 font-semibold hover:underline">
            ← Back to login
          </Link>
        </p>
      </form>
    </div>
  );
}
