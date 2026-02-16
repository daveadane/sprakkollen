import { useEffect, useState } from "react";
import { loadProgress, resetProgress } from "../../utils/progressStorage";

export default function ProfilePage() {
  const [p, setP] = useState(loadProgress());

  useEffect(() => {
    const sync = () => setP(loadProgress());

    // refresh when practice saves
    window.addEventListener("sprakkollen:progress-updated", sync);

    // also refresh if another tab changes localStorage
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener("sprakkollen:progress-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  function onReset() {
    const ok = confirm("Reset all progress? This cannot be undone.");
    if (!ok) return;
    resetProgress();
  }

  const {
    xp,
    streakDays,
    sessions,
    accuracy,
    weakWords,
    lastPractice,
    lastStreakDay,
    correct,
    total,
  } = p;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <header>
        <h1 className="text-4xl font-black tracking-tight">Profile</h1>
        <p className="mt-2 text-slate-600">
          Local profile (saved in this browser). Backend sync comes later.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <Stat label="XP" value={xp} />
        <Stat label="Streak" value={`${streakDays} days`} />
        <Stat label="Sessions" value={sessions} />
        <Stat label="Accuracy" value={`${accuracy}%`} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold">Practice summary</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Info label="Last practice" value={`${lastPractice.score} / ${lastPractice.total}`} />
          <Info label="Total correct" value={correct} />
          <Info label="Total attempts" value={total} />
        </div>

        <p className="mt-4 text-sm text-slate-500">
          Last streak update: {lastStreakDay ?? "—"}
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold">Weak words</h2>
        <p className="mt-2 text-sm text-slate-600">
          Mock list for now (later calculated from mistakes).
        </p>

        <ul className="mt-4 flex flex-wrap gap-2">
          {(weakWords ?? []).map((w) => (
            <li
              key={w}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-700"
            >
              {w}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold">Actions</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={onReset}
            className="rounded-2xl border border-red-200 bg-white px-5 py-3 font-bold text-red-700 hover:bg-red-50"
          >
            Reset progress
          </button>

          <button
            disabled
            className="rounded-2xl border border-slate-200 bg-slate-100 px-5 py-3 font-bold text-slate-400"
            title="Enable when backend login is connected"
          >
            Logout (coming soon)
          </button>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-4xl font-black">{value}</p>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 font-bold text-slate-900">{value}</p>
    </div>
  );
}

