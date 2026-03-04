// src/pages/app/ProgressPage.jsx
import { useEffect, useState } from "react";
import { getProgress, normalizeProgress } from "../../utils/progressApi";

export default function ProgressPage() {
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

  const streakDays = p.streakDays;
  const xp = p.xp;
  const practice = p.practice;
  const grammar = p.grammar;
  const weakWords = p.weakWords;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black tracking-tight">Progress</h1>
        <p className="mt-2 text-slate-600">Track your learning over time.</p>
        {err ? <p className="mt-2 text-sm font-semibold text-red-600">{err}</p> : null}
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <StatCard label="Streak" value={`${streakDays} days`} />
        <StatCard label="XP" value={xp} />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-black">Practice</h2>
          <p className="mt-1 text-sm text-slate-600">EN/ETT sessions and accuracy.</p>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <MiniStat label="Sessions" value={practice.sessions} />
            <MiniStat label="Accuracy" value={`${practice.accuracy}%`} />
            <MiniStat label="Correct" value={practice.correct} />
            <MiniStat label="Total" value={practice.total} />
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Last practice:{" "}
            <span className="font-semibold text-slate-700">
              {practice.lastPractice?.total > 0 ? `${practice.lastPractice.score} / ${practice.lastPractice.total}` : "—"}
            </span>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-black">Grammar</h2>
          <p className="mt-1 text-sm text-slate-600">Quiz sessions and accuracy.</p>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <MiniStat label="Sessions" value={grammar.sessions} />
            <MiniStat label="Accuracy" value={`${grammar.accuracy}%`} />
            <MiniStat label="Correct" value={grammar.correct} />
            <MiniStat label="Total" value={grammar.total} />
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Last quiz:{" "}
            <span className="font-semibold text-slate-700">
              {grammar.lastQuiz?.total > 0 ? `${grammar.lastQuiz.score} / ${grammar.lastQuiz.total}` : "—"}
            </span>
          </p>
        </div>
      </section>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-black">Weak words</h2>
        <p className="mt-1 text-sm text-slate-600">Words you often miss.</p>

        {weakWords.length === 0 ? (
          <p className="mt-4 text-slate-500">No weak words yet.</p>
        ) : (
          <ul className="mt-4 list-disc pl-6 text-slate-700">
            {weakWords.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-4xl font-black">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}
