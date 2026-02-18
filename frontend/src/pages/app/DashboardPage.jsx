import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadProgress } from "../../utils/progressStorage";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [p, setP] = useState(() => loadProgress());

  useEffect(() => {
    const refresh = () => setP(loadProgress());
    window.addEventListener("sprakkollen:progress-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("sprakkollen:progress-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const {
    xp = 0,
    streakDays = 0,
    lastStreakDay = null,
    sessions = 0,
    accuracy = 0,
    lastPractice,
    grammar,
  } = p;

  const practiceScoreText = lastPractice
    ? `${lastPractice.score} / ${lastPractice.total}`
    : "—";

  const grammarSessionsText = grammar?.sessions ?? 0;

  const grammarAccuracyText =
    grammarSessionsText > 0 && (grammar?.total ?? 0) > 0
      ? `${grammar.accuracy}%`
      : "—";


  // Duolingo-ish leveling: every 200 XP = next level
  const { level, xpIntoLevel, xpToNext, pct } = useMemo(() => {
    const levelSize = 200;
    const level = Math.floor(xp / levelSize) + 1;
    const xpIntoLevel = xp % levelSize;
    const xpToNext = levelSize - xpIntoLevel;
    const pct = Math.round((xpIntoLevel / levelSize) * 100);
    return { level, xpIntoLevel, xpToNext, pct };
  }, [xp]);

  function startPractice() {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now());
    navigate(`/practice/session/${id}`);
  }

  function startGrammar() {
    navigate("/grammar");
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-black tracking-tight">Dashboard</h1>
        <p className="text-slate-600">
          Keep your streak alive. Practice a little every day.
        </p>
      </header>

      {/* Top action row */}
      <section className="grid gap-4 md:grid-cols-3">
        <ActionCard
          title="Continue Practice"
          desc="Train EN vs ETT with instant feedback."
          button="Start"
          onClick={startPractice}
        />
        <ActionCard
          title="Continue Grammar"
          desc="Quick quiz: rules + examples."
          button="Open"
          onClick={startGrammar}
        />
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm font-semibold text-slate-500">Daily streak</p>
          <p className="mt-2 text-4xl font-black">{streakDays} 🔥</p>
          <p className="mt-2 text-sm text-slate-600">
            Last active: <span className="font-semibold">{lastStreakDay ?? "—"}</span>
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Tip: complete 1 session/day to grow streak.
          </p>
        </div>
      </section>

      {/* XP Progress */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-500">Level</p>
            <p className="mt-1 text-3xl font-black">Level {level}</p>
          </div>

          <div className="text-right">
            <p className="text-sm text-slate-600">
              {xpIntoLevel} / 200 XP
            </p>
            <p className="text-xs text-slate-400">
              {xpToNext} XP to next level
            </p>
          </div>
        </div>

        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </section>

      {/* Stats grid */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <StatCard label="XP" value={xp} />
        <StatCard label="Practice Sessions" value={sessions} />
        <StatCard label="Practice Accuracy" value={`${accuracy}%`} />
        <StatCard label="Last Practice" value={practiceScoreText} />
        <StatCard label="Grammar" value={`${grammarSessionsText} sessions • ${grammarAccuracyText}`} />

      </section>
    </div>
  );
}

function ActionCard({ title, desc, button, onClick }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-black">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{desc}</p>
      <button
        onClick={onClick}
        className="mt-4 w-full rounded-2xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700"
      >
        {button}
      </button>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

import { resetGrammarStats } from "../../utils/progressStorage";

<button
  onClick={resetGrammarStats}
  className="rounded-xl border px-4 py-2"
>
  Reset Grammar Stats
</button>
