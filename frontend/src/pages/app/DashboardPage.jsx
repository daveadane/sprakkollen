import { useEffect, useState } from "react";
import { loadProgress } from "../../utils/progressStorage";

export default function DashboardPage() {
  const [progress, setProgress] = useState(() => loadProgress());

  useEffect(() => {
    const refresh = () => setProgress(loadProgress());
    window.addEventListener("sprakkollen:progress-updated", refresh);
    return () => window.removeEventListener("sprakkollen:progress-updated", refresh);
  }, []);

  const { xp, streakDays, lastPractice } = progress;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black tracking-tight">Dashboard</h1>
        <p className="mt-2 text-slate-600">
          Track your learning and continue practicing Swedish noun gender.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="XP" value={xp} />
        <StatCard label="Streak" value={`${streakDays} days`} />
        <StatCard label="Last Practice Score" value={`${lastPractice.score} / ${lastPractice.total}`} />
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

