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
      {/* Header */}
      <div className="rounded-2xl p-6 text-white" style={{ background: "linear-gradient(135deg,#006AA7,#004f80)" }}>
        <h1 className="text-3xl font-black tracking-tight">✏️ Practice</h1>
        <p className="mt-2 text-blue-100">
          Quick session: choose EN or ETT. Instant feedback. Track your score.
        </p>
        {err ? <p className="mt-3 text-sm font-semibold text-red-300">{err}</p> : null}
      </div>

      {/* Session info card */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-xl">🎯</div>
          <div>
            <p className="font-bold text-slate-800">5 Questions per session</p>
            <p className="text-sm text-slate-500">Randomly drawn from the full vocabulary database</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-xl">⚡</div>
          <div>
            <p className="font-bold text-slate-800">Instant feedback</p>
            <p className="text-sm text-slate-500">See if each answer is correct right away</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-xl">📈</div>
          <div>
            <p className="font-bold text-slate-800">Track your progress</p>
            <p className="text-sm text-slate-500">Every session is saved to your Progress page</p>
          </div>
        </div>
      </div>

      <button
        onClick={startSession}
        disabled={loading}
        className="w-full rounded-2xl py-4 font-bold text-white text-lg transition hover:opacity-90 disabled:opacity-60"
        style={{ background: "linear-gradient(135deg,#006AA7,#004f80)" }}
      >
        {loading ? "Creating session..." : "Start Practice →"}
      </button>
    </div>
  );
}

