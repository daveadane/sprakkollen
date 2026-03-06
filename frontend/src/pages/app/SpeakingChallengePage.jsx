import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api";

export default function SpeakingChallengePage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/speaking-challenge/status")
      .then(setStatus)
      .catch(() => setStatus({ completed_days: [], next_day: 1, total_completed: 0 }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        Loading your challenge progress…
      </div>
    );
  }

  const completedSet = new Set(status.completed_days);
  const pct = Math.round((status.total_completed / 30) * 100);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50 p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🎤</span>
          <h1 className="text-2xl font-black text-slate-800">30-Day Speaking Challenge</h1>
        </div>
        <p className="text-slate-600 text-sm leading-relaxed">
          Speak Swedish for one minute every day. No audience, no judgement — just you and your tutor AI.
          Complete a daily prompt, get instant feedback, and build real speaking confidence.
        </p>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm font-semibold text-slate-600">
          <span>{status.total_completed} / 30 days completed</span>
          <span>{pct}%</span>
        </div>
        <div className="h-3 w-full rounded-full bg-slate-100">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Next day CTA */}
      {status.total_completed < 30 && (
        <button
          onClick={() => navigate(`/speaking-challenge/${status.next_day}`)}
          className="w-full rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 py-4 text-white font-black text-lg shadow hover:from-rose-600 hover:to-pink-600 transition"
        >
          Start Day {status.next_day} →
        </button>
      )}

      {status.total_completed === 30 && (
        <div className="rounded-2xl border border-yellow-300 bg-yellow-50 p-6 text-center">
          <p className="text-4xl mb-2">🏆</p>
          <p className="font-black text-yellow-800 text-xl">Challenge Complete!</p>
          <p className="text-yellow-700 text-sm mt-1">You completed all 30 days. Fantastic work!</p>
        </div>
      )}

      {/* 30-day grid */}
      <div>
        <h2 className="text-sm font-black text-slate-500 uppercase tracking-wide mb-3">Your Progress</h2>
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: 30 }, (_, i) => {
            const day = i + 1;
            const done = completedSet.has(day);
            const isNext = day === status.next_day && status.total_completed < 30;

            return (
              <button
                key={day}
                onClick={() => navigate(`/speaking-challenge/${day}`)}
                className={[
                  "flex flex-col items-center justify-center rounded-xl aspect-square text-sm font-bold transition",
                  done
                    ? "bg-green-100 text-green-700 border border-green-300"
                    : isNext
                    ? "bg-rose-500 text-white shadow-md animate-pulse"
                    : "bg-slate-100 text-slate-400 cursor-default",
                ].join(" ")}
              >
                {done ? "✓" : day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tips */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-800 space-y-1">
        <p className="font-black">Tips for success</p>
        <ul className="list-disc list-inside space-y-1 text-blue-700">
          <li>Use Chrome or Edge — speech recognition works best there</li>
          <li>Find a quiet room and speak clearly</li>
          <li>Don't worry about mistakes — the AI tutor is here to help</li>
          <li>Try to do one day every day to build the habit</li>
        </ul>
      </div>
    </div>
  );
}
