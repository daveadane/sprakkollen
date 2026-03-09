import { useState, useEffect } from "react";
import { apiFetch } from "../../utils/api";
import AIFeedback from "../../components/AIFeedback";

function speak(text) {
  window.speechSynthesis.cancel();
  // Replace fill-in-the-blank markers so TTS sounds natural
  const cleaned = text.replace(/_{2,}/g, "blank").replace(/_/g, "blank");
  const utter = new SpeechSynthesisUtterance(cleaned);
  utter.lang = "sv-SE";
  utter.rate = 0.8;
  window.speechSynthesis.speak(utter);
}

export default function AudioPage() {
  const [phase, setPhase] = useState("start"); // start | loading | quiz | result
  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [i, setI] = useState(0);
  const [chosen, setChosen] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");
  const [played, setPlayed] = useState(false);

  const q = questions[i];
  const total = questions.length;
  const isLast = i + 1 === total;

  // Auto-play question audio whenever a new question loads
  useEffect(() => {
    if (phase === "quiz" && q) {
      setPlayed(false);
      const timer = setTimeout(() => {
        speak(q.question);
        setPlayed(true);
      }, 400);
      return () => {
        clearTimeout(timer);
        window.speechSynthesis.cancel();
      };
    }
  }, [phase, i]); // eslint-disable-line react-hooks/exhaustive-deps

  async function startSession() {
    setPhase("loading");
    setErr("");
    try {
      const { id } = await apiFetch("/grammar/sessions", { method: "POST" });
      const data = await apiFetch(`/grammar/sessions/${id}`);
      setSessionId(id);
      setQuestions(data.questions);
      setI(0);
      setAnswers([]);
      setChosen(null);
      setRevealed(false);
      setPlayed(false);
      setPhase("quiz");
    } catch (e) {
      setErr(typeof e?.message === "string" ? e.message : "Failed to start");
      setPhase("start");
    }
  }

  function handlePlay() {
    speak(q.question);
    setPlayed(true);
  }

  function handleChoice(c) {
    if (revealed) return;
    setChosen(c);
    setRevealed(true);
  }

  async function handleNext() {
    const newAnswers = [...answers, { question_id: q.question_id, chosen: chosen ?? "" }];
    setAnswers(newAnswers);

    if (!isLast) {
      setI(i + 1);
      setChosen(null);
      setRevealed(false);
      setPlayed(false);
    } else {
      try {
        const data = await apiFetch(`/grammar/sessions/${sessionId}/submit`, {
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

  function restart() {
    setPhase("start");
    setResult(null);
    setSessionId(null);
    setQuestions([]);
  }

  if (phase === "start") {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Audio Exercise</h1>
          <p className="mt-2 text-slate-600">
            Listen to Swedish grammar questions spoken aloud and pick the correct answer.
            Questions are fetched live from the database.
          </p>
        </div>
        {err && <p className="text-sm font-semibold text-red-600">{err}</p>}
        <button
          onClick={startSession}
          className="w-full rounded-2xl bg-pink-600 py-4 text-lg font-black text-white hover:bg-pink-700"
        >
          Start Audio Exercise →
        </button>
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-slate-500">Loading questions…</p>
      </div>
    );
  }

  if (phase === "quiz" && q) {
    const correct = q.correct_answer;
    return (
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Audio Exercise</h1>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full bg-slate-200">
            <div
              className="h-2 rounded-full bg-pink-500 transition-all"
              style={{ width: `${(i / total) * 100}%` }}
            />
          </div>
          <span className="text-xs text-slate-500">{i + 1}/{total}</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div className="text-center">
            <button
              onClick={handlePlay}
              className="rounded-2xl bg-pink-600 px-8 py-4 text-white font-bold text-lg hover:bg-pink-700 transition"
            >
              🔊 {played ? "Replay" : "Listen"}
            </button>
            <p className="mt-2 text-xs text-slate-400">Plays automatically · click to replay</p>
          </div>

          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-center">
            <p className="text-slate-700 font-medium">{q.question}</p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {(q.choices || q.options || []).map((c) => {
              let cls = "rounded-xl border px-4 py-3 text-sm font-semibold transition text-left ";
              if (!revealed) {
                cls += "border-slate-200 bg-slate-50 hover:border-pink-400 text-slate-700 cursor-pointer";
              } else if (c === correct) {
                cls += "border-green-400 bg-green-50 text-green-800";
              } else if (c === chosen) {
                cls += "border-red-400 bg-red-50 text-red-700";
              } else {
                cls += "border-slate-200 bg-slate-50 text-slate-400";
              }
              return (
                <button key={c} className={cls} onClick={() => handleChoice(c)} disabled={revealed}>
                  {c}
                </button>
              );
            })}
          </div>

          {revealed && (
            <p className={`text-sm font-semibold text-center ${chosen === correct ? "text-green-600" : "text-red-600"}`}>
              {chosen === correct ? "Correct ✓" : `Incorrect ✗ — correct: ${correct}`}
            </p>
          )}
        </div>

        {revealed && (
          <button
            onClick={handleNext}
            className="w-full rounded-xl bg-pink-600 py-3 text-sm font-bold text-white hover:bg-pink-700"
          >
            {isLast ? "See results" : "Next →"}
          </button>
        )}

        {err && <p className="text-sm text-red-600 font-semibold">{err}</p>}
      </div>
    );
  }

  if (phase === "result" && result) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <h1 className="text-3xl font-black tracking-tight">Audio Exercise</h1>
        <div className="rounded-2xl border border-pink-200 bg-pink-50 p-8 text-center space-y-2">
          <p className="text-4xl font-black">{result.score}/{result.total}</p>
          <p className="text-slate-600">{result.accuracy}% correct</p>
          <button
            onClick={restart}
            className="mt-4 rounded-xl bg-pink-600 px-6 py-2 text-sm font-semibold text-white hover:bg-pink-700"
          >
            Try again
          </button>
        </div>

        <AIFeedback
          exerciseType="test"
          score={result.score}
          total={result.total}
        />
      </div>
    );
  }

  return null;
}
