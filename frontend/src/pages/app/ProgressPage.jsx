// src/pages/app/ProgressPage.jsx
import { useEffect, useState } from "react";
import { getProgress, normalizeProgress } from "../../utils/progressApi";
import { apiFetch } from "../../utils/api";

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function ProgressPage() {
  const [p, setP] = useState(() => normalizeProgress(null));
  const [history, setHistory] = useState({ practice: [], grammar: [] });
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setErr("");
      try {
        const [prog, hist] = await Promise.allSettled([
          getProgress(),
          apiFetch("/progress/history"),
        ]);
        if (!alive) return;
        if (prog.status === "fulfilled") setP(normalizeProgress(prog.value));
        else setErr(prog.reason?.message || "Failed to load progress");
        if (hist.status === "fulfilled") setHistory(hist.value);
      } catch (e) {
        if (alive) setErr(e?.message || "Failed to load");
      }
    })();
    return () => { alive = false; };
  }, []);

  const streakDays = p.streakDays;
  const xp = p.xp;
  const practice = p.practice;
  const grammar = p.grammar;
  const weakWords = p.weakWords;

  const levelSize = 200;
  const level = Math.floor(xp / levelSize) + 1;
  const xpIntoLevel = xp % levelSize;
  const pct = Math.round((xpIntoLevel / levelSize) * 100);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black tracking-tight">Progress</h1>
        <p className="mt-2 text-slate-600">Track your learning over time.</p>
        {err && <p className="mt-2 text-sm font-semibold text-red-600">{err}</p>}
      </div>

      {/* Top stats */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Streak 🔥" value={`${streakDays} days`} color="text-orange-500" />
        <StatCard label="XP" value={xp} color="text-blue-600" />
        <StatCard label="Level" value={level} color="text-violet-600" />
        <StatCard label="Practice sessions" value={practice.sessions} />
      </section>

      {/* XP bar */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-700">Level {level}</span>
          <span className="text-slate-500">{xpIntoLevel} / 200 XP</span>
        </div>
        <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </section>

      {/* Practice + Grammar stats side by side */}
      <section className="grid gap-4 sm:grid-cols-2">
        <StatBlock
          title="Practice"
          color="border-blue-200 bg-blue-50"
          titleColor="text-blue-800"
          sessions={practice.sessions}
          accuracy={practice.accuracy}
          correct={practice.correct}
          total={practice.total}
        />
        <StatBlock
          title="Grammar"
          color="border-violet-200 bg-violet-50"
          titleColor="text-violet-800"
          sessions={grammar.sessions}
          accuracy={grammar.accuracy}
          correct={grammar.correct}
          total={grammar.total}
        />
      </section>

      {/* Practice history chart */}
      <HistoryChart
        title="Practice score history"
        data={history.practice}
        color="bg-blue-500"
        emptyMsg="No practice sessions yet."
      />

      {/* Grammar history chart */}
      <HistoryChart
        title="Grammar score history"
        data={history.grammar}
        color="bg-violet-500"
        emptyMsg="No grammar sessions yet."
      />

      {/* Weak words */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="font-black text-amber-800">Weak words 🎯</h2>
        <p className="mt-1 text-sm text-amber-700">Words you often get wrong in practice.</p>
        {weakWords.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No weak words yet — great job!</p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {weakWords.map((w) => (
              <span
                key={w}
                className="rounded-full border border-amber-300 bg-white px-3 py-1 text-sm font-semibold text-amber-800"
              >
                {w}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color = "text-slate-900" }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className={`mt-1 text-3xl font-black ${color}`}>{value}</p>
    </div>
  );
}

function StatBlock({ title, color, titleColor, sessions, accuracy, correct, total }) {
  return (
    <div className={`rounded-2xl border p-6 ${color}`}>
      <h2 className={`text-xl font-black ${titleColor}`}>{title}</h2>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <MiniStat label="Sessions" value={sessions} />
        <MiniStat label="Accuracy" value={total > 0 ? `${accuracy}%` : "—"} />
        <MiniStat label="Correct" value={correct} />
        <MiniStat label="Total answers" value={total} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl border border-white/60 bg-white/70 p-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function HistoryChart({ title, data, color, emptyMsg }) {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-black text-slate-800">{title}</h2>
        <p className="mt-4 text-sm text-slate-400">{emptyMsg}</p>
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.pct), 1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="font-black text-slate-800">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">Last {data.length} sessions — % correct</p>

      <div className="mt-5 flex items-end gap-1.5" style={{ height: "120px" }}>
        {data.map((d, i) => (
          <div key={i} className="group relative flex flex-1 flex-col items-center justify-end h-full">
            {/* Tooltip on hover */}
            <div className="absolute bottom-full mb-1 hidden group-hover:block z-10 whitespace-nowrap rounded-lg bg-slate-800 px-2 py-1 text-xs text-white">
              {d.score}/{d.total} ({d.pct}%) — {fmtDate(d.date)}
            </div>
            {/* Bar */}
            <div
              className={`w-full rounded-t-lg ${color} opacity-90 transition-all`}
              style={{ height: `${(d.pct / max) * 100}%`, minHeight: "4px" }}
            />
          </div>
        ))}
      </div>

      {/* X-axis labels */}
      <div className="mt-2 flex gap-1.5">
        {data.map((d, i) => (
          <p key={i} className="flex-1 truncate text-center text-xs text-slate-400">
            {fmtDate(d.date)}
          </p>
        ))}
      </div>
    </div>
  );
}
