import { Link } from "react-router-dom";

export default function DashboardPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black tracking-tight">
          Dashboard
        </h1>
        <p className="mt-2 text-slate-600">
          Track your learning and continue practicing Swedish noun gender.
        </p>
      </div>

      {/* Stats Section */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">XP</p>
          <p className="mt-2 text-3xl font-bold">120</p>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Streak</p>
          <p className="mt-2 text-3xl font-bold">5 days</p>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Last Practice Score</p>
          <p className="mt-2 text-3xl font-bold">4 / 5</p>
        </div>
      </div>

      {/* Modules */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Continue Learning</h2>

        <div className="grid gap-6 md:grid-cols-2">
          <ModuleCard
            title="Checker"
            description="Check Swedish noun gender (ett/en)."
            to="/checker"
          />

          <ModuleCard
            title="Practice"
            description="Duolingo-style EN/ETT training session."
            to="/practice"
          />

          <ModuleCard
            title="Vocabulary"
            description="Manage and review your saved words."
            to="/vocabulary"
          />

          <ModuleCard
            title="Progress"
            description="See statistics and weak words."
            to="/progress"
          />
        </div>
      </div>
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

