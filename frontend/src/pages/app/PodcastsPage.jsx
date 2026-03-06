import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api";

function formatDate(raw) {
  if (!raw) return "";
  // SR dates look like "/Date(1234567890000)/"
  const match = raw.match(/\d+/);
  if (match) {
    const d = new Date(parseInt(match[0]));
    return d.toLocaleDateString("sv-SE", { year: "numeric", month: "short", day: "numeric" });
  }
  return raw;
}

function formatDuration(seconds) {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function PodcastsPage() {
  const navigate = useNavigate();
  const [episodes, setEpisodes] = useState([]);
  const [programName, setProgramName] = useState("Klartext");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    Promise.all([
      apiFetch("/podcasts/episodes?program=klartext&size=12"),
      apiFetch("/podcasts/history"),
    ])
      .then(([epData, histData]) => {
        setEpisodes(epData.episodes || []);
        setProgramName(epData.program_name || "Klartext");
        setHistory(histData || []);
      })
      .catch((err) => setError(err?.message || "Could not load episodes."))
      .finally(() => setLoading(false));
  }, []);

  const listenedIds = new Set(history.map((h) => h.episode_id));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        Loading episodes from Sveriges Radio…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-4xl mb-2">⚠️</p>
        <p className="font-black text-red-800">Could not load episodes</p>
        <p className="text-red-600 text-sm mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🎙️</span>
          <div>
            <h1 className="text-2xl font-black text-slate-800">Swedish Podcast</h1>
            <p className="text-sm text-blue-600 font-semibold">{programName} — Sveriges Radio</p>
          </div>
        </div>
        <p className="text-slate-600 text-sm leading-relaxed">
          Listen to simplified Swedish news from Sveriges Radio, then answer comprehension questions
          to test your understanding. Free, authentic Swedish content — updated daily.
        </p>
      </div>

      {/* Listening history summary */}
      {history.length > 0 && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 flex items-center gap-4">
          <span className="text-2xl">📊</span>
          <div>
            <p className="font-black text-green-800 text-sm">
              You've listened to {history.length} episode{history.length !== 1 ? "s" : ""}!
            </p>
            <p className="text-green-700 text-xs">
              Average score:{" "}
              {Math.round(
                (history.reduce((sum, h) => sum + (h.total_questions > 0 ? h.score / h.total_questions : 0), 0) /
                  history.length) *
                  100
              )}
              %
            </p>
          </div>
        </div>
      )}

      {/* Episode list */}
      <div className="space-y-3">
        <h2 className="text-sm font-black text-slate-500 uppercase tracking-wide">Latest Episodes</h2>
        {episodes.map((ep) => {
          const listened = listenedIds.has(ep.id);
          const histEntry = history.find((h) => h.episode_id === ep.id);
          return (
            <button
              key={ep.id}
              onClick={() =>
                navigate(`/podcasts/${ep.id}`, {
                  state: {
                    episode: ep,
                  },
                })
              }
              className="w-full text-left rounded-2xl border border-slate-200 bg-white p-4 hover:border-blue-300 hover:shadow-md transition flex gap-4 items-start"
            >
              {/* Thumbnail */}
              <div className="shrink-0">
                {ep.image_url ? (
                  <img
                    src={ep.image_url}
                    alt=""
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center text-2xl">
                    🎙️
                  </div>
                )}
              </div>

              {/* Episode info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-slate-800 text-sm leading-snug line-clamp-2">
                    {ep.title}
                  </p>
                  {listened && (
                    <span className="shrink-0 rounded-full bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5">
                      ✓ Done
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{ep.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                  <span>{formatDate(ep.publish_date)}</span>
                  {ep.duration_seconds && <span>⏱ {formatDuration(ep.duration_seconds)}</span>}
                  {histEntry && (
                    <span className="text-green-600 font-semibold">
                      {histEntry.score}/{histEntry.total_questions} correct
                    </span>
                  )}
                </div>
              </div>

              {/* Arrow */}
              <span className="shrink-0 text-slate-300 mt-1">›</span>
            </button>
          );
        })}
      </div>

      {/* SR attribution */}
      <p className="text-center text-xs text-slate-400 pb-4">
        Episodes from{" "}
        <span className="font-semibold">Sveriges Radio</span> — free to use for personal learning.
      </p>
    </div>
  );
}
