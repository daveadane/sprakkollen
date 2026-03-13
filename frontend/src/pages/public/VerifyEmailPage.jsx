import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiFetch } from "../../utils/api";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found in the URL.");
      return;
    }
    apiFetch(`/auth/verify-email?token=${token}`)
      .then(() => setStatus("success"))
      .catch((e) => {
        setStatus("error");
        setMessage(e.message || "Verification failed.");
      });
  }, [token]);

  if (status === "loading") {
    return (
      <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        <p className="text-slate-500 text-sm">Verifying your email…</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="mx-auto w-full max-w-md rounded-2xl border border-green-200 bg-green-50 p-8 shadow-sm text-center space-y-4">
        <p className="text-4xl">✅</p>
        <h1 className="text-2xl font-black text-green-800">Email verified!</h1>
        <p className="text-sm text-green-700">Your account is now active. You can log in.</p>
        <Link
          to="/login"
          className="inline-block mt-2 rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700 transition"
        >
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-red-200 bg-red-50 p-8 shadow-sm text-center space-y-4">
      <p className="text-4xl">❌</p>
      <h1 className="text-2xl font-black text-red-800">Verification failed</h1>
      <p className="text-sm text-red-700">{message}</p>
      <Link
        to="/register"
        className="inline-block mt-2 rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700 transition"
      >
        Register again
      </Link>
    </div>
  );
}
