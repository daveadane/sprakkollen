// src/pages/app/DashboardPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProgress, normalizeProgress } from "../../utils/progressApi";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [p, setP] = useState(() => normalizeProgress(null));
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setErr("");
      try {
        const data = await getProgress();
        if (alive) setP(normalizeProgress(data));
      } catch (e) {
        if (alive) setErr(e?.message || "Failed to load progress");
      }
    })();
    return () => { alive = false; };
  }, []);

  const xp = p.xp;
  const streakDays = p.streakDays;
  const lastStreakDay = p.lastStreakDay ?? "—";

  const practice = p.practice;
  const grammar = p.grammar;

  const practiceAccuracy = practice.total > 0 ? `${practice.accuracy}%` : "—";
  const grammarAccuracy = grammar.total > 0 ? `${grammar.accuracy}%` : "—";

  const lastPracticeText =
    practice.lastPractice?.total > 0 ? `${practice.lastPractice.score} / ${practice.lastPractice.total}` : "—";

  const lastGrammarText =
    grammar.lastQuiz?.total > 0 ? `${grammar.lastQuiz.score} / ${grammar.lastQuiz.total}` : "—";

  const { level, xpIntoLevel, xpToNext, pct } = useMemo(() => {
    const levelSize = 200;
    const level = Math.floor(xp / levelSize) + 1;
    const xpIntoLevel = xp % levelSize;
    const xpToNext = levelSize - xpIntoLevel;
    const pct = Math.round((xpIntoLevel / levelSize) * 100);
    return { level, xpIntoLevel, xpToNext, pct };
  }, [xp]);

  function startPractice() {
    navigate("/practice");
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-black tracking-tight">Dashboard</h1>
        <p className="text-slate-600">Keep your streak alive. Practice a little every day.</p>
        {err ? <p className="text-sm font-semibold text-red-600">{err}</p> : null}
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <ActionCard title="Continue Practice" desc="Train EN vs ETT with instant feedback." button="Start" onClick={startPractice} />
        <ActionCard title="Continue Grammar" desc="Quick quiz: rules + examples." button="Open" onClick={() => navigate("/grammar")} />
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm font-semibold text-slate-500">Daily streak</p>
          <p className="mt-2 text-4xl font-black">{streakDays} 🔥</p>
          <p className="mt-2 text-sm text-slate-600">
            Last active: <span className="font-semibold">{lastStreakDay}</span>
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-500">Level</p>
            <p className="mt-1 text-3xl font-black">Level {level}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-600">{xpIntoLevel} / 200 XP</p>
            <p className="text-xs text-slate-400">{xpToNext} XP to next level</p>
          </div>
        </div>

        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <StatCard label="XP" value={xp} />
        <StatCard label="Practice Sessions" value={practice.sessions} />
        <StatCard label="Practice Accuracy" value={practiceAccuracy} />
        <StatCard label="Last Practice" value={lastPracticeText} />
        <StatCard
          label="Grammar"
          value={
            <div className="space-y-1">
              <div className="text-3xl font-black">{grammar.sessions} sessions</div>
              <div className="text-sm text-slate-600">Accuracy: {grammarAccuracy}</div>
              <div className="text-sm text-slate-600">Last: {lastGrammarText}</div>
            </div>
          }
        />
      </section>
    </div>
  );
}

function ActionCard({ title, desc, button, onClick }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-black">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{desc}</p>
      <button onClick={onClick} className="mt-4 w-full rounded-2xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700">
        {button}
      </button>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <p className="text-sm text-slate-500">{label}</p>
      <div className="mt-2">{typeof value === "string" || typeof value === "number" ? <p className="text-3xl font-black">{value}</p> : value}</div>
    </div>
  );
}

