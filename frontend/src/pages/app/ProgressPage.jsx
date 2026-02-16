import { useEffect, useState } from "react";
import { loadProgress } from "../../utils/progressStorage";

export default function ProgressPage() {
  const [progress, setProgress] = useState(() => loadProgress());

  useEffect(() => {
    const refresh = () => setProgress(loadProgress());
    window.addEventListener("sprakkollen:progress-updated", refresh);
    return () => window.removeEventListener("sprakkollen:progress-updated", refresh);
  }, []);

  const { streakDays, xp, sessions, accuracy, weakWords } = progress;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black tracking-tight">Progress</h1>
        <p className="mt-2 text-slate-600">Track your learning over time.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <StatCard label="Streak" value={`${streakDays} days`} />
        <StatCard label="XP" value={xp} />
        <StatCard label="Sessions" value={sessions} />
        <StatCard label="Accuracy" value={`${accuracy}%`} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-black">Weak words</h2>
        <p className="mt-1 text-sm text-slate-600">Words you often miss (mock for now).</p>
        <ul className="mt-4 list-disc pl-6 text-slate-700">
          {weakWords.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
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
