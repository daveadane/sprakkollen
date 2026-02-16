import { useNavigate } from "react-router-dom";

export default function PracticePage() {
  const navigate = useNavigate();

  function startSession() {
    // Generate ONLY on user action (safe)
    const sessionId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now());

    navigate(`/practice/session/${sessionId}`);
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Practice</h1>
        <p className="mt-2 text-slate-600">
          Quick session: choose EN or ETT. Instant feedback. Track your score.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
        <p className="font-semibold">Session length: 5 questions</p>
        <p className="text-sm text-slate-600">
          Later: this will use your saved vocabulary + weak words.
        </p>
      </div>

      <button
        onClick={startSession}
        className="w-full rounded-2xl bg-blue-600 py-4 font-bold text-white hover:bg-blue-700"
      >
        Start Practice
      </button>
    </div>
  );
}
