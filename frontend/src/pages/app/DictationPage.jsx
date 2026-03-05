import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api";

function speak(word) {
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(word);
  utter.lang = "sv-SE";
  utter.rate = 0.8;
  window.speechSynthesis.speak(utter);
}

export default function DictationPage() {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [phase, setPhase] = useState("start"); // start | loading | quiz | result
  const [sessionId, setSessionId] = useState(null);
  const [words, setWords] = useState([]);
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");
  const [played, setPlayed] = useState(false);

  const word = words[i];
  const total = words.length;
  const isLast = i + 1 === total;

  async function startSession() {
    setPhase("loading");
    setErr("");
    try {
      const data = await apiFetch("/dictation/sessions", { method: "POST" });
      setSessionId(data.id);
      setWords(data.words);
      setI(0);
      setAnswers([]);
      setTyped("");
      setShowFeedback(false);
      setPlayed(false);
      setPhase("quiz");
    } catch (e) {
      setErr(typeof e?.message === "string" ? e.message : "Failed to start");
      setPhase("start");
    }
  }

  function handlePlay() {
    speak(word);
    setPlayed(true);
    setTimeout(() => inputRef.current?.focus(), 300);
  }

  function handleCheck() {
    if (!typed.trim()) return;
    setShowFeedback(true);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      if (!showFeedback) handleCheck();
      else handleNext();
    }
  }

  async function handleNext() {
    const newAnswers = [...answers, typed.trim()];
    setAnswers(newAnswers);

    if (!isLast) {
      setI(i + 1);
      setTyped("");
      setShowFeedback(false);
      setPlayed(false);
    } else {
      // submit
      try {
        const data = await apiFetch(`/dictation/sessions/${sessionId}/submit`, {
          method: "POST",
          body: { answers: newAnswers },
        });
        setResult(data);
        setPhase("result");
      } catch (e) {
        setErr(typeof e?.message === "string" ? e.message : "Failed to submit");
      }
    }
  }

  const isCorrect = showFeedback && typed.trim().toLowerCase() === word?.toLowerCase();

  if (phase === "start") {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Dictation</h1>
          <p className="mt-2 text-slate-600">
            Listen to a Swedish word and type what you hear. Words are pulled from
            the Swedish word database. Press <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-xs">Enter</kbd> to check and advance.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔊</span>
            <p className="text-slate-700">Click the speaker to hear the word</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">⌨️</span>
            <p className="text-slate-700">Type what you hear and press Check</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <p className="text-slate-700">8 words per session, results saved to your progress</p>
          </div>
        </div>

        {err && <p className="text-sm font-semibold text-red-600">{err}</p>}

        <button
          onClick={startSession}
          className="w-full rounded-2xl bg-slate-900 py-4 text-lg font-black text-white hover:bg-slate-700"
        >
          Start Dictation →
        </button>
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-slate-500">Loading words…</p>
      </div>
    );
  }

  if (phase === "quiz") {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        {/* Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-slate-500">
            <span>Word {i + 1} of {total}</span>
            <span className="font-semibold text-indigo-600">Dictation</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all"
              style={{ width: `${((i + 1) / total) * 100}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 space-y-6">
          {/* Play button */}
          <div className="text-center">
            <button
              onClick={handlePlay}
              className="rounded-2xl bg-indigo-600 px-10 py-5 text-2xl font-black text-white hover:bg-indigo-700 transition active:scale-95"
            >
              🔊 Listen
            </button>
            {!played && (
              <p className="mt-2 text-xs text-slate-400">Click to hear the word</p>
            )}
            {played && !showFeedback && (
              <p className="mt-2 text-xs text-slate-400">Click again to replay</p>
            )}
          </div>

          {/* Input */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-600 text-center">
              Type the word you heard
            </label>
            <input
              ref={inputRef}
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={showFeedback}
              placeholder="Type here…"
              className={`w-full rounded-xl border-2 px-4 py-3 text-center text-lg font-semibold outline-none transition
                ${showFeedback
                  ? isCorrect
                    ? "border-green-400 bg-green-50 text-green-800"
                    : "border-red-400 bg-red-50 text-red-700"
                  : "border-slate-200 bg-white focus:border-indigo-400"
                }`}
            />
          </div>

          {/* Feedback */}
          {showFeedback && (
            <div className={`rounded-xl px-5 py-3 text-center font-semibold ${isCorrect ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>
              {isCorrect ? "✓ Correct!" : `✗ The word was "${word}"`}
            </div>
          )}
        </div>

        {/* Action button */}
        {!showFeedback ? (
          <button
            onClick={handleCheck}
            disabled={!typed.trim() || !played}
            className="w-full rounded-2xl bg-indigo-600 py-3 font-black text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Check
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="w-full rounded-2xl bg-slate-900 py-3 font-black text-white hover:bg-slate-700"
          >
            {isLast ? "Finish →" : "Next →"}
          </button>
        )}

        {err && <p className="text-sm text-red-600 font-semibold">{err}</p>}
      </div>
    );
  }

  if (phase === "result" && result) {
    const pct = result.accuracy;
    const medal = pct >= 90 ? "🏆" : pct >= 70 ? "⭐" : pct >= 50 ? "👍" : "📚";

    return (
      <div className="mx-auto max-w-xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-3">
          <p className="text-6xl">{medal}</p>
          <h2 className="text-3xl font-black">{result.score} / {result.total}</h2>
          <p className="text-xl font-bold text-slate-600">{pct}% correct</p>
        </div>

        <div className="space-y-2">
          <h3 className="font-black text-slate-700">Breakdown</h3>
          {result.feedback.map((f, idx) => (
            <div
              key={idx}
              className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${f.correct ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
            >
              <span className="text-lg">{f.correct ? "✓" : "✗"}</span>
              <div className="flex-1">
                <p className="font-semibold text-slate-800">{f.word}</p>
                {!f.correct && (
                  <p className="text-xs text-red-700">You typed: <strong>{f.typed || "—"}</strong></p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => { setPhase("start"); setResult(null); }}
            className="rounded-2xl border border-slate-300 py-3 font-bold text-slate-700 hover:bg-slate-50"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-2xl bg-slate-900 py-3 font-bold text-white hover:bg-slate-700"
          >
            Dashboard
          </button>
        </div>
      </div>
    );
  }

  return null;
}
