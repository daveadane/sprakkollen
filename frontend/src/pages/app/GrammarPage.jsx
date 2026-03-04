import { useState } from "react";
import { apiFetch } from "../../utils/api";

export default function GrammarPage() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [started, setStarted] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  const [questions, setQuestions] = useState([]);
  const total = questions.length;

  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);

  const [picked, setPicked] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const [answers, setAnswers] = useState([]);

  const q = questions[i];

  async function start() {
    setErr("");
    setLoading(true);

    try {
      const created = await apiFetch("/grammar/sessions", { method: "POST" });
      const id = created?.id;
      if (!id) throw new Error("Backend did not return session id");

      const s = await apiFetch(`/grammar/sessions/${id}`, { method: "GET" });

      const rows = (s?.questions || []).map((row) => ({
        question_id: row.question_id,
        question: row.question,
        options: row.choices || [],
        correct_answer: row.correct_answer,
      }));

      if (!rows.length) throw new Error("No questions returned from backend");

      setSessionId(id);
      setQuestions(rows);
      setStarted(true);
      setI(0);
      setScore(0);
      setPicked(null);
      setShowFeedback(false);
      setAnswers([]);
    } catch (e) {
      setErr(e?.message || "Failed to start grammar session");
    } finally {
      setLoading(false);
    }
  }

  function choose(option) {
    if (!q || showFeedback) return;

    setPicked(option);
    setShowFeedback(true);

    if (isCorrect(q, option)) setScore((s) => s + 1);

    setAnswers((prev) => {
      const filtered = prev.filter((a) => a.question_id !== q.question_id);
      return [...filtered, { question_id: q.question_id, chosen: option }];
    });
  }

  async function finishAndSubmit() {
    if (!sessionId) return;

    setLoading(true);
    setErr("");

    try {
      const res = await apiFetch(`/grammar/sessions/${sessionId}/submit`, {
        method: "POST",
        body: { answers },
      });

      const backendScore = typeof res?.score === "number" ? res.score : score;
      const backendTotal = typeof res?.total === "number" ? res.total : total;

      setScore(backendScore);
      setI(backendTotal);
    } catch (e) {
      setErr(e?.message || "Failed to submit");
    } finally {
      setLoading(false);
    }
  }

  function next() {
    const nextIndex = i + 1;
    setPicked(null);
    setShowFeedback(false);

    if (nextIndex >= total) {
      finishAndSubmit();
      return;
    }
    setI(nextIndex);
  }

  // end screen
  if (started && total > 0 && i >= total) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <h1 className="text-3xl font-black tracking-tight">Grammar Quiz Complete</h1>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-slate-600">Your score</p>
          <p className="mt-2 text-5xl font-black">
            {score} / {total}
          </p>
          {err ? <p className="mt-3 text-sm font-semibold text-red-600">{err}</p> : null}
        </div>

        <button
          onClick={start}
          disabled={loading}
          className="w-full rounded-2xl bg-blue-600 py-4 font-bold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Starting..." : "Try Again"}
        </button>
      </div>
    );
  }

  // start screen
  if (!started) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Grammar</h1>
          <p className="mt-2 text-slate-600">5 random questions each round.</p>
          {err ? <p className="mt-2 text-sm font-semibold text-red-600">{err}</p> : null}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-2">
          <p className="font-semibold">Quiz length: 5 questions</p>
        </div>

        <button
          onClick={start}
          disabled={loading}
          className="w-full rounded-2xl bg-blue-600 py-4 font-bold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Creating session..." : "Start Grammar Quiz"}
        </button>
      </div>
    );
  }

  // question screen
  const correct = picked ? isCorrect(q, picked) : false;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Grammar Quiz</h1>
        {err ? <p className="mt-2 text-sm font-semibold text-red-600">{err}</p> : null}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-500">
          Question {i + 1} / {total}
        </p>

        <p className="mt-4 text-2xl font-black">{q?.question}</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {(q?.options?.length ? q.options : ["(no options)"]).map((opt) => (
            <button
              key={opt}
              onClick={() => choose(opt)}
              disabled={showFeedback || loading}
              className={`rounded-2xl border px-4 py-4 font-bold transition
                ${
                  showFeedback
                    ? isCorrect(q, opt)
                      ? "border-green-200 bg-green-50 text-green-800"
                      : opt === picked
                      ? "border-red-200 bg-red-50 text-red-800"
                      : "border-slate-200 bg-white text-slate-900 opacity-70"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
            >
              {opt}
            </button>
          ))}
        </div>

        {showFeedback && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className={`font-bold ${correct ? "text-green-700" : "text-red-700"}`}>
              {correct ? "Correct ✅" : `Not quite ❌ — correct answer: ${q?.correct_answer}`}
            </p>

            <button
              onClick={next}
              disabled={loading}
              className="mt-4 w-full rounded-2xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {i + 1 === total ? (loading ? "Submitting..." : "Finish") : "Next"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function isCorrect(q, chosen) {
  return normalize(chosen) === normalize(q?.correct_answer);
}

function normalize(s) {
  return String(s || "").trim().toLowerCase();
}
