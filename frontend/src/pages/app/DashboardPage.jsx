// src/pages/app/DashboardPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProgress, normalizeProgress } from "../../utils/progressApi";
import { apiFetch } from "../../utils/api";
import useAuth from "../../state/useAuth";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const FEATURES = [
  { label: "Practice", desc: "Train EN vs ETT with instant feedback.", path: "/practice", color: "bg-blue-600 hover:bg-blue-700" },
  { label: "Grammar", desc: "Quick quizzes on Swedish grammar rules.", path: "/grammar", color: "bg-violet-600 hover:bg-violet-700" },
  { label: "Reading", desc: "Read Swedish texts and answer questions.", path: "/books", color: "bg-emerald-600 hover:bg-emerald-700" },
  { label: "Checker", desc: "Look up en/ett for any Swedish noun.", path: "/checker", color: "bg-orange-500 hover:bg-orange-600" },
  { label: "Audio", desc: "Listen and pick the right word.", path: "/audio", color: "bg-pink-600 hover:bg-pink-700" },
  { label: "Speech", desc: "Speak Swedish words aloud and get checked.", path: "/speech", color: "bg-teal-600 hover:bg-teal-700" },
  { label: "Mixed Test", desc: "10-question test: articles + grammar combined.", path: "/test", color: "bg-rose-600 hover:bg-rose-700" },
  { label: "Dictation", desc: "Listen to Swedish words and type what you hear.", path: "/dictation", color: "bg-indigo-600 hover:bg-indigo-700" },
  { label: "Image Quiz", desc: "See an image and type (or speak) the Swedish word.", path: "/image-quiz", color: "bg-violet-600 hover:bg-violet-700" },
];

function relativeDate(isoString) {
  const d = new Date(isoString);
  const today = new Date();
  const diffDays = Math.floor((today - d) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString("sv-SE");
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [p, setP] = useState(() => normalizeProgress(null));
  const [todayActive, setTodayActive] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);
  const [wod, setWod] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setErr("");
      try {
        const [data, wordOfDay, hist] = await Promise.allSettled([
          getProgress(),
          apiFetch("/word-of-day"),
          apiFetch("/progress/history"),
        ]);
        if (alive) {
          if (data.status === "fulfilled") {
            setP(normalizeProgress(data.value));
            setTodayActive(data.value?.today_active ?? false);
          } else {
            setErr(data.reason?.message || "Failed to load progress");
          }
          if (wordOfDay.status === "fulfilled") setWod(wordOfDay.value);
          if (hist.status === "fulfilled") {
            const practice = (hist.value?.practice ?? []).map((s) => ({ ...s, type: "practice" }));
            const grammar = (hist.value?.grammar ?? []).map((s) => ({ ...s, type: "grammar" }));
            const combined = [...practice, ...grammar]
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .slice(0, 2);
            setRecentActivity(combined);
          }
        }
      } catch (e) {
        if (alive) setErr(e?.message || "Failed to load");
      }
    })();
    return () => { alive = false; };
  }, []);

  const xp = p.xp;
  const streakDays = p.streakDays;
  const weakWords = p.weakWords ?? [];

  const { level, xpIntoLevel, xpToNext, pct } = useMemo(() => {
    const levelSize = 200;
    const level = Math.floor(xp / levelSize) + 1;
    const xpIntoLevel = xp % levelSize;
    const xpToNext = levelSize - xpIntoLevel;
    const pct = Math.round((xpIntoLevel / levelSize) * 100);
    return { level, xpIntoLevel, xpToNext, pct };
  }, [xp]);

  const firstName = user?.first_name || user?.email?.split("@")[0] || "";

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-4xl font-black tracking-tight">
          {greeting()}, {firstName}! 👋
        </h1>
        <p className="text-slate-600">Keep your streak alive. Practice a little every day.</p>
        {err && <p className="text-sm font-semibold text-red-600">{err}</p>}
      </header>

      {/* Top row: Streak + XP + Word of the Day */}
      <section className="grid gap-4 sm:grid-cols-3">
        {/* Streak */}
        <div className={`flex flex-col justify-between rounded-2xl border p-6 ${
          todayActive
            ? "border-green-200 bg-green-50"
            : "border-orange-200 bg-orange-50"
        }`}>
          <p className={`text-sm font-semibold ${todayActive ? "text-green-600" : "text-orange-600"}`}>
            Daily Streak
          </p>
          <p className={`mt-2 text-5xl font-black ${todayActive ? "text-green-500" : "text-orange-500"}`}>
            {streakDays} 🔥
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {todayActive
              ? "✓ Active today — keep it up!"
              : streakDays === 0
                ? "Start today to begin your streak!"
                : "Do one activity to keep your streak!"}
          </p>
        </div>

        {/* Level + XP */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
          <p className="text-sm font-semibold text-blue-600">Level {level}</p>
          <p className="mt-2 text-5xl font-black text-blue-700">{xp} XP</p>
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-blue-100">
            <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-xs text-blue-500">{xpIntoLevel} / 200 XP — {xpToNext} to next level</p>
        </div>

        {/* Word of the Day */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm font-semibold text-slate-500">Word of the Day</p>
          {wod ? (
            <>
              <p className="mt-2 text-4xl font-black text-slate-900">{wod.word}</p>
              <p className="mt-1 text-lg font-semibold text-blue-600">{wod.article}</p>
              <button
                onClick={() => navigate(`/checker?word=${wod.word}`)}
                className="mt-3 text-sm font-semibold text-blue-700 hover:underline"
              >
                Look it up →
              </button>
            </>
          ) : (
            <p className="mt-2 text-slate-400">Loading…</p>
          )}
        </div>
      </section>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-bold text-slate-800 mb-3">Continue Learning</h2>
          <div className="space-y-3">
            {recentActivity.map((s, idx) => (
              <div key={idx} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{s.type === "grammar" ? "📝" : "🎯"}</span>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">
                      {s.type === "grammar" ? "Grammar Quiz" : "Practice"}
                    </p>
                    <p className="text-xs text-slate-500">{relativeDate(s.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    s.pct >= 80 ? "bg-green-100 text-green-700" :
                    s.pct >= 50 ? "bg-amber-100 text-amber-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {s.score}/{s.total}
                  </span>
                  <button
                    onClick={() => navigate(s.type === "grammar" ? "/grammar" : "/practice")}
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    Try again →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Feature cards */}
      <section>
        <h2 className="mb-3 text-lg font-black text-slate-700">What do you want to do?</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <button
              key={f.path}
              onClick={() => navigate(f.path)}
              className={`rounded-2xl p-5 text-left text-white transition-transform hover:scale-[1.02] ${f.color}`}
            >
              <p className="text-lg font-black">{f.label}</p>
              <p className="mt-1 text-sm opacity-80">{f.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Progress link */}
      <div className="flex justify-end">
        <button
          onClick={() => navigate("/progress")}
          className="text-sm font-semibold text-blue-600 hover:underline"
        >
          See full progress →
        </button>
      </div>

      {/* Weak words */}
      {weakWords.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h3 className="font-black text-amber-800">Words to practice more 🎯</h3>
          <p className="mt-1 text-sm text-amber-700">You got these wrong most often:</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {weakWords.map((w) => (
              <button
                key={w}
                onClick={() => navigate(`/checker?word=${w}`)}
                className="rounded-full border border-amber-300 bg-white px-3 py-1 text-sm font-semibold text-amber-800 hover:bg-amber-100"
              >
                {w}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

