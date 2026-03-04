// src/pages/app/GrammarPage.jsx
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../utils/api";

/**
 * IMPORTANT:
 * Your backend "submit" code you pasted expects:
 *   payload = { answers: [{ question: "...", chosen: "..." }] }
 * BUT your Swagger screenshot shows question_id + chosen.
 *
 * This frontend sends BOTH (question_id + question) so you’re safe either way.
 * - If your backend currently matches by question text: it will work.
 * - If you later change backend to match by question_id: it will also work.
 */

// Must match backend GRAMMAR_QUESTIONS "question" strings to show choices.
// If a question is not found here, we fallback to ["—"].
const CHOICES_BY_QUESTION = {
  "Choose correct word: Jag ___ i Sverige.": ["bor", "bott", "bo"],
  "Choose correct: Hon ___ en bok igår.": ["läser", "läste", "läs"],
  "Choose correct: Vi ___ till skolan varje dag.": ["går", "gick", "gå"],
  "Choose correct: De ___ hemma nu.": ["är", "var", "vara"],
  "Choose correct: Jag ___ kaffe just nu.": ["dricker", "drack", "dricka"],
};

export default function GrammarPage() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [started, setStarted] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  const [questions, setQuestions] = useState([]); // [{question_id, question, options}]
  const total = questions.length;

  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);

  const [picked, setPicked] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // Keep user's answers so we can submit at the end
  const [answers, setAnswers] = useState([]); // [{question_id, question, chosen}]

  const q = questions[i];

  async function start() {
    setErr("");
    setLoading(true);

    try {
      // 1) create session
      const created = await apiFetch("/grammar/sessions", { method: "POST" });
      const id = created?.id;
      if (!id) throw new Error("Backend did not return session id");

      // 2) fetch session questions
      const s = await apiFetch(`/grammar/sessions/${id}`, { method: "GET" });

      const rows = (s?.questions || []).map((row) => {
        const text = row.question;
        const options = CHOICES_BY_QUESTION[text] || [];
        return {
          question_id: row.question_id,
          question: text,
          options,
        };
      });

      if (!rows.length) throw new Error("No questions returned from backend");

      // reset UI state
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

    // Update local score immediately (UI feedback)
    // We also compute final score on backend on submit.
    const correct = isCorrect(q, option);
    if (correct) setScore((s) => s + 1);

    // Store answer for submission
    setAnswers((prev) => {
      const filtered = prev.filter((a) => a.question_id !== q.question_id);
      return [
        ...filtered,
        {
          question_id: q.question_id,
          question: q.question, // for your current backend mapping-by-text
          chosen: option,
        },
      ];
    });
  }

  async function finishAndSubmit() {
    if (!sessionId) return;

    setLoading(true);
    setErr("");

    try {
      const payload = { answers };

      const res = await apiFetch(`/grammar/sessions/${sessionId}/submit`, {
        method: "POST",
        body: payload,
      });

      // If backend returns {score,total,accuracy}, prefer that
      const backendScore = typeof res?.score === "number" ? res.score : score;
      const backendTotal = typeof res?.total === "number" ? res.total : total;

      // show end screen using backend results
      setScore(backendScore);
      setI(backendTotal); // triggers end screen
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
      // submit on finish
      finishAndSubmit();
      return;
    }
    setI(nextIndex);
  }

  // ===== UI SCREENS =====

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
          <p className="mt-2 text-sm text-slate-500">Saved to backend session.</p>
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
          <p className="mt-2 text-slate-600">
            Backend quiz session. Questions come from FastAPI.
          </p>
          {err ? <p className="mt-2 text-sm font-semibold text-red-600">{err}</p> : null}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-2">
          <p className="font-semibold">Quiz length: 5 questions</p>
          <p className="text-sm text-slate-600">
            Tip: make sure you are logged in (token exists) or backend will return 401.
          </p>
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
        <p className="mt-2 text-slate-600">
          Session ID: <span className="font-semibold">{sessionId}</span>
        </p>
        {err ? <p className="mt-2 text-sm font-semibold text-red-600">{err}</p> : null}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-500">
          Question {i + 1} / {total}
        </p>

        <p className="mt-4 text-2xl font-black">{q?.question}</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {(q?.options?.length ? q.options : ["(no options configured)"]).map((opt) => (
            <button
              key={opt}
              onClick={() => choose(opt)}
              disabled={showFeedback || loading || opt === "(no options configured)"}
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
              {correct ? "Correct ✅" : "Not quite ❌"}
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

/**
 * Frontend correctness:
 * Your backend stores correct_answer in DB but does not return it via GET.
 * So we decide correctness by the known question->choices map only if needed.
 * For UI feedback, we can’t truly know without backend sending correct_answer.
 *
 * Here, we treat the first option as “unknown” unless you later expose correct_answer.
 * If you want real correctness in UI: update backend GET to return correct_answer (admin-only)
 * or return choices+correct per question.
 */
function isCorrect(q, chosen) {
  // If you later add correct_answer to GET response, use it here:
  if (q?.correct_answer) {
    return normalize(chosen) === normalize(q.correct_answer);
  }
  // For now: UI feedback is “best effort” only.
  // We can infer correct based on your backend static questions:
  const inferredCorrect = inferCorrectAnswer(q?.question);
  if (!inferredCorrect) return false;
  return normalize(chosen) === normalize(inferredCorrect);
}

function inferCorrectAnswer(questionText) {
  // Must match backend GRAMMAR_QUESTIONS correct answers
  const m = {
    "Choose correct word: Jag ___ i Sverige.": "bor",
    "Choose correct: Hon ___ en bok igår.": "läste",
    "Choose correct: Vi ___ till skolan varje dag.": "går",
    "Choose correct: De ___ hemma nu.": "är",
    "Choose correct: Jag ___ kaffe just nu.": "dricker",
  };
  return m[questionText] || null;
}

function normalize(s) {
  return String(s || "")
    .trim()
    .toLowerCase();
}

