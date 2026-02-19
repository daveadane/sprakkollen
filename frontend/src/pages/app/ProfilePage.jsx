import { useEffect, useState } from "react";
import { loadProgress, resetProgress } from "../../utils/progressStorage";

export default function ProfilePage() {
  const [p, setP] = useState(() => loadProgress());

  useEffect(() => {
    const sync = () => setP(loadProgress());

    window.addEventListener("sprakkollen:progress-updated", sync);
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
    setP(loadProgress()); // immediate UI refresh
  }

  // schema-safe reads
  const xp = p?.xp ?? 0;
  const streakDays = p?.streakDays ?? 0;
  const lastStreakDay = p?.lastStreakDay ?? null;

  const weakWords = p?.weakWords ?? [];

  const practice = p?.practice ?? {};
  const grammar = p?.grammar ?? {};

  const lp = practice?.lastPractice ?? { score: 0, total: 0 };
  const lq = grammar?.lastQuiz ?? { score: 0, total: 0 };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <header>
        <h1 className="text-4xl font-black tracking-tight">Profile</h1>
        <p className="mt-2 text-slate-600">
          Local profile (saved in this browser). Backend sync comes later.
        </p>
      </header>

      {/* Top stats */}
      <section className="grid gap-4 md:grid-cols-4">
        <Stat label="XP" value={xp} />
        <Stat label="Streak" value={`${streakDays} days`} />
        <Stat label="Practice sessions" value={practice?.sessions ?? 0} />
        <Stat label="Grammar sessions" value={grammar?.sessions ?? 0} />
      </section>

      {/* Practice + Grammar summary */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold">Practice summary</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Info
              label="Last practice"
              value={lp.total ? `${lp.score} / ${lp.total}` : "—"}
            />
            <Info label="Accuracy" value={`${practice?.accuracy ?? 0}%`} />
            <Info label="Correct" value={practice?.correct ?? 0} />
            <Info label="Total attempts" value={practice?.total ?? 0} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold">Grammar summary</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Info
              label="Last quiz"
              value={lq.total ? `${lq.score} / ${lq.total}` : "—"}
            />
            <Info label="Accuracy" value={`${grammar?.accuracy ?? 0}%`} />
            <Info label="Correct" value={grammar?.correct ?? 0} />
            <Info label="Total attempts" value={grammar?.total ?? 0} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold">Streak</h2>
        <p className="mt-2 text-sm text-slate-600">
          Last streak update: {lastStreakDay ?? "—"}
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold">Weak words</h2>
        <p className="mt-2 text-sm text-slate-600">
          Words you frequently miss during practice.
        </p>

        <ul className="mt-4 flex flex-wrap gap-2">
          {weakWords.length === 0 ? (
            <li className="text-sm text-slate-500">No weak words yet 🎉</li>
          ) : (
            weakWords.map((w) => (
              <li
                key={w}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-700"
              >
                {w}
              </li>
            ))
          )}
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
      <p className="mt-2 text-3xl font-black">{value}</p>
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

