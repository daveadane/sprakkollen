import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../../utils/api";

// Phase: loading | listen | generating | quiz | result
export default function PodcastEpisodePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const episode = state?.episode || null;

  const [phase, setPhase] = useState(episode ? "listen" : "loading");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [audioStarted, setAudioStarted] = useState(false);
  const audioRef = useRef(null);

  // If navigated directly without state, redirect back
  useEffect(() => {
    if (!episode && phase === "loading") {
      navigate("/podcasts");
    }
  }, [episode, phase, navigate]);

  function handleAudioPlay() {
    setAudioStarted(true);
  }

  async function handleGetQuestions() {
    if (!episode) return;
    setPhase("generating");
    try {
      const params = new URLSearchParams({
        title: episode.title,
        description: episode.description || "",
      });
      const data = await apiFetch(`/podcasts/questions/${id}?${params}`);
      setQuestions(data.questions || []);
      setAnswers(new Array(data.questions.length).fill(""));
      setPhase("quiz");
    } catch (err) {
      setError(err?.message || "Could not generate questions.");
      setPhase("listen");
    }
  }

  async function handleSubmit() {
    if (answers.some((a) => !a)) {
      setError("Please answer all questions before submitting.");
      return;
    }
    setError("");
    try {
      const correctAnswers = questions.map((q) => q.correct_answer);
      const data = await apiFetch("/podcasts/submit", {
        method: "POST",
        body: {
          episode_id: id,
          episode_title: episode.title,
          answers,
          correct_answers: correctAnswers,
        },
      });
      setResult(data);
      setPhase("result");
    } catch (err) {
      setError(err?.message || "Could not submit quiz.");
    }
  }

  if (phase === "loading") {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        Loading episode…
      </div>
    );
  }

  if (phase === "generating") {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-500" />
        <p className="text-sm text-slate-500">Generating comprehension questions…</p>
      </div>
    );
  }

  // ── Listening phase ────────────────────────────────────────────────────
  if (phase === "listen") {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        {/* Back */}
        <button
          onClick={() => navigate("/podcasts")}
          className="text-slate-400 hover:text-slate-600 text-sm"
        >
          ← Back to Episodes
        </button>

        {/* Episode card */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 space-y-3">
          <div className="flex items-start gap-4">
            {episode.image_url ? (
              <img src={episode.image_url} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-blue-200 flex items-center justify-center text-2xl shrink-0">
                🎙️
              </div>
            )}
            <div>
              <p className="text-xs font-black text-blue-400 uppercase tracking-wide">Now Playing</p>
              <p className="font-bold text-slate-800 leading-snug">{episode.title}</p>
              <p className="text-xs text-slate-500 mt-1">Klartext — Sveriges Radio</p>
            </div>
          </div>

          {episode.description && (
            <p className="text-sm text-slate-600 leading-relaxed">{episode.description}</p>
          )}
        </div>

        {/* Audio player */}
        {episode.audio_url ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
            <p className="text-xs font-black text-slate-400 uppercase tracking-wide">Listen</p>
            <audio
              ref={audioRef}
              src={episode.audio_url}
              controls
              onPlay={handleAudioPlay}
              className="w-full"
              style={{ borderRadius: "0.75rem" }}
            />
            <p className="text-xs text-slate-400">
              🇸🇪 This episode is in Swedish. Listen as much as you need before taking the quiz.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center">
            <p className="text-amber-700 text-sm">
              No audio available for this episode. You can still take the comprehension quiz based on the description.
            </p>
          </div>
        )}

        {error && (
          <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-600 text-sm">
            {error}
          </p>
        )}

        {/* CTA */}
        <div className="space-y-2">
          <button
            onClick={handleGetQuestions}
            className="w-full rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 py-4 text-white font-black text-lg shadow hover:from-blue-600 hover:to-indigo-600 transition"
          >
            {audioStarted ? "Take the Comprehension Quiz →" : "Skip to Quiz →"}
          </button>
          {!audioStarted && (
            <p className="text-center text-xs text-slate-400">
              Listen first for best results, but you can go straight to the quiz.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Quiz phase ─────────────────────────────────────────────────────────
  if (phase === "quiz") {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPhase("listen")}
            className="text-slate-400 hover:text-slate-600 text-sm"
          >
            ← Back
          </button>
          <span className="text-sm font-bold text-blue-500 uppercase tracking-wide">
            Comprehension Quiz
          </span>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs font-black text-blue-400 uppercase tracking-wide mb-1">Episode</p>
          <p className="font-bold text-slate-700 text-sm">{episode.title}</p>
        </div>

        {questions.map((q, qi) => (
          <div key={qi} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
            <p className="font-bold text-slate-800 text-sm">
              {qi + 1}. {q.question}
            </p>
            <div className="space-y-2">
              {q.choices.map((choice) => (
                <button
                  key={choice}
                  onClick={() => {
                    const next = [...answers];
                    next[qi] = choice;
                    setAnswers(next);
                  }}
                  className={[
                    "w-full text-left rounded-xl px-4 py-2.5 text-sm font-semibold border transition",
                    answers[qi] === choice
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50",
                  ].join(" ")}
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>
        ))}

        {error && (
          <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-600 text-sm">
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={answers.some((a) => !a)}
          className={[
            "w-full rounded-2xl py-4 font-black text-white transition",
            answers.some((a) => !a)
              ? "bg-slate-300 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-500 to-indigo-500 shadow hover:from-blue-600 hover:to-indigo-600",
          ].join(" ")}
        >
          {answers.some((a) => !a)
            ? `Answer all ${questions.length} questions`
            : "Submit Answers"}
        </button>
      </div>
    );
  }

  // ── Result phase ───────────────────────────────────────────────────────
  if (phase === "result" && result) {
    const pct = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
    const star = pct === 100 ? "🏆" : pct >= 75 ? "🎉" : pct >= 50 ? "👍" : "📖";

    return (
      <div className="mx-auto max-w-xl space-y-6">
        {/* Score header */}
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
          <p className="text-4xl mb-2">{star}</p>
          <p className="font-black text-green-800 text-xl">
            {result.score} / {result.total} correct
          </p>
          <p className="text-green-600 text-sm mt-1">{result.message}</p>

          {/* Score bar */}
          <div className="mt-4 h-3 w-full rounded-full bg-green-200">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-green-600 mt-1">{pct}%</p>
        </div>

        {/* Question review */}
        <div className="space-y-3">
          <h2 className="text-sm font-black text-slate-500 uppercase tracking-wide">Review</h2>
          {questions.map((q, qi) => {
            const correct = result.correct_flags[qi];
            return (
              <div
                key={qi}
                className={[
                  "rounded-xl border p-4 space-y-1",
                  correct ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50",
                ].join(" ")}
              >
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                  Question {qi + 1} — {correct ? "✓ Correct" : "✗ Incorrect"}
                </p>
                <p className="font-semibold text-slate-800 text-sm">{q.question}</p>
                {!correct && (
                  <p className="text-xs text-red-600">
                    Your answer: <span className="font-semibold">{answers[qi]}</span>
                  </p>
                )}
                <p className={`text-xs font-semibold ${correct ? "text-green-700" : "text-slate-700"}`}>
                  {correct ? "Your answer: " : "Correct answer: "}
                  <span>{correct ? answers[qi] : q.correct_answer}</span>
                </p>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/podcasts")}
            className="flex-1 rounded-2xl bg-slate-800 py-3 text-white font-black hover:bg-slate-700 transition"
          >
            More Episodes
          </button>
          <button
            onClick={() => {
              setPhase("listen");
              setAnswers([]);
              setResult(null);
            }}
            className="flex-1 rounded-2xl border border-slate-300 py-3 text-slate-700 font-black hover:bg-slate-50 transition"
          >
            Listen Again
          </button>
        </div>
      </div>
    );
  }

  return null;
}
