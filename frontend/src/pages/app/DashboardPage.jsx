import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { loadProgress } from "../../utils/progressStorage";

export default function DashboardPage() {
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  if (!progress) return null;

  const { xp, streakDays, lastPractice } = progress;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-black tracking-tight">Dashboard</h1>
        <p className="mt-2 text-slate-600">
          Track your learning and continue practicing Swedish noun gender.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard label="XP" value={xp} />
        <StatCard label="Streak" value={`${streakDays} days`} />
        <StatCard
          label="Last Practice Score"
          value={`${lastPractice.score} / ${lastPractice.total}`}
        />
      </div>

      {/* Modules */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Continue Learning</h2>

        <div className="grid gap-6 md:grid-cols-2">
          <ModuleCard title="Checker" description="Check Swedish noun gender (ett/en)." to="/checker" />
          <ModuleCard title="Practice" description="Duolingo-style EN/ETT training session." to="/practice" />
          <ModuleCard title="Vocabulary" description="Manage and review your saved words." to="/vocabulary" />
          <ModuleCard title="Progress" description="See statistics and weak words." to="/progress" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

function ModuleCard({ title, description, to }) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition">
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="mt-2 text-slate-600">{description}</p>

      <Link
        to={to}
        className="mt-4 inline-block text-blue-600 font-semibold hover:underline"
      >
        Open →
      </Link>
    </div>
  );
}

