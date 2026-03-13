import { useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../utils/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: { email: email.trim().toLowerCase() },
      });
      setDone(true);
    } catch (e) {
      setErr(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-center space-y-2">
          <p className="text-2xl">📧</p>
          <p className="font-bold text-green-800">Check your email</p>
          <p className="text-sm text-green-700">
            If <strong>{email}</strong> is registered, we sent a password reset link. Check your inbox (and spam folder).
          </p>
        </div>
        <p className="text-center text-sm text-slate-500">
          The link expires in 1 hour.{" "}
          <button onClick={() => setDone(false)} className="text-blue-600 hover:underline font-medium">
            Resend
          </button>
        </p>
        <p className="text-center text-sm">
          <Link to="/login" className="text-blue-700 font-semibold hover:underline">
            ← Back to login
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-black">Forgot password?</h1>
      <p className="mt-1 text-sm text-slate-500">
        Enter your email and we'll send you a reset link.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-700">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}

        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="w-full rounded-2xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-60 transition"
        >
          {loading ? "Sending…" : "Send reset link"}
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
