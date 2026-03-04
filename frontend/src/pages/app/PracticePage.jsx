// src/pages/app/PracticePage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api";

export default function PracticePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function startSession() {
    setErr("");
    setLoading(true);

    try {
      // Create practice session in backend
      const data = await apiFetch("/practice/sessions", { method: "POST" });

      const id = data?.id;
      if (!id) throw new Error("Backend did not return session id");

      // Go to session page where questions are displayed/answered
      navigate(`/practice/session/${id}`);
    } catch (e) {
      setErr(e?.message || "Failed to start practice session");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Practice</h1>
        <p className="mt-2 text-slate-600">
          Quick session: choose EN or ETT. Instant feedback. Track your score.
        </p>
        {err ? <p className="mt-2 text-sm font-semibold text-red-600">{err}</p> : null}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
        <p className="font-semibold">Session length: 5 questions</p>
        <p className="text-sm text-slate-600">
          Questions come from backend (practice_questions for this session).
        </p>
      </div>

      <button
        onClick={startSession}
        disabled={loading}
        className="w-full rounded-2xl bg-blue-600 py-4 font-bold text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {loading ? "Creating session..." : "Start Practice"}
      </button>
    </div>
  );
}

