export default function ProgressPage() {
  const data = {
    streak: 3,
    xp: 120,
    sessions: 8,
    accuracy: 74,
    weakWords: ["bord", "fönster", "äpple"],
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Progress</h1>
        <p className="mt-2 text-slate-600">
          Track your learning over time.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Streak</p>
          <p className="text-3xl font-black">{data.streak} days</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">XP</p>
          <p className="text-3xl font-black">{data.xp}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Sessions</p>
          <p className="text-3xl font-black">{data.sessions}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Accuracy</p>
          <p className="text-3xl font-black">{data.accuracy}%</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-black">Weak words</h2>
        <p className="mt-1 text-sm text-slate-600">
          Words you often miss (mock for now).
        </p>

        <ul className="mt-4 list-disc pl-6 text-slate-800">
          {data.weakWords.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
