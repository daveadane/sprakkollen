import { useEffect, useState } from "react";
import { loadProgress } from "../../utils/progressStorage";

export default function ProgressPage() {
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

  const streakDays = p.streakDays ?? 0;
  const xp = p.xp ?? 0;

  const practice = p.practice ?? { sessions: 0, correct: 0, total: 0, accuracy: 0, lastPractice: { score: 0, total: 0 } };
  const grammar = p.grammar ?? { sessions: 0, correct: 0, total: 0, accuracy: 0, lastQuiz: { score: 0, total: 0 } };

  const weakWords = p.weakWords ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black tracking-tight">Progress</h1>
        <p className="mt-2 text-slate-600">Track your learning over time.</p>
      </div>

      {/* Overall */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <StatCard label="Streak" value={`${streakDays} days`} />
        <StatCard label="XP" value={xp} />
      </section>

      {/* Practice + Grammar */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-black">Practice</h2>
          <p className="mt-1 text-sm text-slate-600">EN/ETT sessions and accuracy.</p>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <MiniStat label="Sessions" value={practice.sessions ?? 0} />
            <MiniStat label="Accuracy" value={`${practice.accuracy ?? 0}%`} />
            <MiniStat label="Correct" value={practice.correct ?? 0} />
            <MiniStat label="Total" value={practice.total ?? 0} />
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Last practice:{" "}
            <span className="font-semibold text-slate-700">
              {practice.lastPractice?.total > 0
                ? `${practice.lastPractice.score} / ${practice.lastPractice.total}`
                : "—"}
            </span>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-black">Grammar</h2>
          <p className="mt-1 text-sm text-slate-600">Quiz sessions and accuracy.</p>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <MiniStat label="Sessions" value={grammar.sessions ?? 0} />
            <MiniStat label="Accuracy" value={`${grammar.accuracy ?? 0}%`} />
            <MiniStat label="Correct" value={grammar.correct ?? 0} />
            <MiniStat label="Total" value={grammar.total ?? 0} />
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Last quiz:{" "}
            <span className="font-semibold text-slate-700">
              {grammar.lastQuiz?.total > 0
                ? `${grammar.lastQuiz.score} / ${grammar.lastQuiz.total}`
                : "—"}
            </span>
          </p>
        </div>
      </section>

      {/* Weak words */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-black">Weak words</h2>
        <p className="mt-1 text-sm text-slate-600">Words you often miss (mock for now).</p>

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
