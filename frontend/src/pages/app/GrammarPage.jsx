import { useState } from "react";
import { apiFetch } from "../../utils/api";

export default function GrammarPage() {
  const [tab, setTab] = useState("quiz");
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="rounded-2xl p-6 text-white" style={{ background: "linear-gradient(135deg,#006AA7,#004f80)" }}>
        <h1 className="text-3xl font-black tracking-tight">📝 Grammar</h1>
        <p className="mt-2 text-blue-100">Test your grammar knowledge or check your own Swedish writing.</p>
      </div>
      <div className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
        <button
          onClick={() => setTab("quiz")}
          className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${tab === "quiz" ? "bg-blue-600 text-white shadow" : "text-slate-500 hover:text-slate-800"}`}
        >
          Grammar Quiz
        </button>
        <button
          onClick={() => setTab("checker")}
          className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${tab === "checker" ? "bg-blue-600 text-white shadow" : "text-slate-500 hover:text-slate-800"}`}
        >
          AI Checker
        </button>
      </div>
      {tab === "quiz" ? <GrammarQuiz /> : <GrammarChecker />}
    </div>
  );
}

function GrammarChecker() {
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function check() {
    if (!text.trim()) return;
    setErr("");
    setFeedback("");
    setLoading(true);
    try {
      const res = await apiFetch("/grammar/check-text", { method: "POST", body: { text } });
      setFeedback(res.feedback);
    } catch (e) {
      setErr(e?.message || "Failed to get feedback");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <p className="text-sm font-semibold text-slate-700">Paste or type your Swedish text below:</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder="Jag gå till skolan igår och lärde mycket saker..."
          className="w-full rounded-xl border border-slate-200 p-4 text-slate-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        {err && <p className="text-sm text-red-600 font-medium">{err}</p>}
        <button
          onClick={check}
          disabled={loading || !text.trim()}
          className="w-full rounded-2xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-60 transition"
        >
          {loading ? "Checking…" : "Check my Swedish"}
        </button>
      </div>

      {feedback && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6 space-y-2">
          <p className="text-sm font-bold text-blue-800">AI Feedback</p>
          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{feedback}</p>
          <button
            onClick={() => { setText(""); setFeedback(""); }}
            className="mt-2 text-xs text-blue-600 hover:underline"
          >
            Clear and check another
          </button>
        </div>
      )}
    </div>
  );
}

const DIFFICULTIES = [
  { label: "Easy", count: 5, desc: "5 questions", color: "border-green-300 bg-green-50 text-green-800" },
  { label: "Medium", count: 10, desc: "10 questions", color: "border-amber-300 bg-amber-50 text-amber-800" },
  { label: "Hard", count: 20, desc: "20 questions", color: "border-red-300 bg-red-50 text-red-800" },
];

function GrammarQuiz() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [difficulty, setDifficulty] = useState(DIFFICULTIES[0]);

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
      const created = await apiFetch(`/grammar/sessions?count=${difficulty.count}`, { method: "POST" });
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
    const answerMap = Object.fromEntries(answers.map((a) => [a.question_id, a.chosen]));
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-black tracking-tight">Grammar Quiz Complete</h1>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-slate-600">Your score</p>
          <p className="mt-2 text-5xl font-black">
            {score} / {total}
          </p>
          {err ? <p className="mt-3 text-sm font-semibold text-red-600">{err}</p> : null}
        </div>

        {/* Question review */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
          <h2 className="font-bold text-slate-800">Review</h2>
          {questions.map((q) => {
            const chosen = answerMap[q.question_id];
            const correct = normalize(chosen) === normalize(q.correct_answer);
            return (
              <div
                key={q.question_id}
                className={`rounded-xl border p-4 ${
                  correct ? "border-green-200 bg-green-50" : "border-red-100 bg-red-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg leading-none mt-0.5">{correct ? "✅" : "❌"}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">{q.question}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Your answer:{" "}
                      <span className={`font-medium ${correct ? "text-green-700" : "text-red-700"}`}>
                        {chosen || "—"}
                      </span>
                      {!correct && (
                        <>
                          {" · "}Correct:{" "}
                          <span className="font-medium text-green-700">{q.correct_answer}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => setStarted(false)}
          className="w-full rounded-2xl bg-blue-600 py-4 font-bold text-white hover:bg-blue-700"
        >
          Play Again
        </button>
      </div>
    );
  }

  // start screen
  if (!started) {
    return (
      <div className="space-y-4">
        {err ? <p className="text-sm font-semibold text-red-600">{err}</p> : null}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
          <p className="font-bold text-slate-700">Difficulty</p>
          <div className="grid grid-cols-3 gap-3">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.label}
                onClick={() => setDifficulty(d)}
                className={`rounded-2xl border-2 p-4 text-center font-bold transition ${
                  difficulty.label === d.label
                    ? d.color + " ring-2 ring-offset-1 ring-blue-400"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <p className="text-lg">{d.label}</p>
                <p className="text-xs font-normal mt-0.5 opacity-80">{d.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={start}
          disabled={loading}
          className="w-full rounded-2xl bg-blue-600 py-4 font-bold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Creating session..." : `Start — ${difficulty.desc}`}
        </button>
      </div>
    );
  }

  // question screen
  const correct = picked ? isCorrect(q, picked) : false;

  return (
    <div className="space-y-4">
      {err ? <p className="text-sm font-semibold text-red-600">{err}</p> : null}

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
