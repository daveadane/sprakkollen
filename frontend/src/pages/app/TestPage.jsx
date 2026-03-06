import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api";
import AIFeedback from "../../components/AIFeedback";

export default function TestPage() {
  const navigate = useNavigate();

  const [phase, setPhase] = useState("start"); // start | loading | quiz | result
  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");

  const q = questions[i];
  const total = questions.length;

  async function startTest() {
    setPhase("loading");
    setErr("");
    try {
      const data = await apiFetch("/test/sessions", { method: "POST" });
      setSessionId(data.id);
      setQuestions(data.questions);
      setI(0);
      setAnswers([]);
      setPicked(null);
      setShowFeedback(false);
      setPhase("quiz");
    } catch (e) {
      setErr(e?.message || "Failed to start test");
      setPhase("start");
    }
  }

  function pick(choice) {
    if (showFeedback) return;
    setPicked(choice);
    setShowFeedback(true);
  }

  async function next() {
    const newAnswers = [...answers, { id: q.id, chosen: picked }];
    setAnswers(newAnswers);

    if (i + 1 < total) {
      setI(i + 1);
      setPicked(null);
      setShowFeedback(false);
    } else {
      // submit
      try {
        const data = await apiFetch(`/test/sessions/${sessionId}/submit`, {
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

  if (phase === "start") {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Mixed Test</h1>
          <p className="mt-2 text-slate-600">
            10 questions combining article (en/ett) and grammar challenges. All questions are
            pulled from the Swedish word database and grammar bank.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-blue-100 px-3 py-1 text-sm font-bold text-blue-700">5 questions</span>
            <span className="text-slate-600 text-sm">Article — pick <strong>en</strong> or <strong>ett</strong></span>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-violet-100 px-3 py-1 text-sm font-bold text-violet-700">5 questions</span>
            <span className="text-slate-600 text-sm">Grammar — multiple choice</span>
          </div>
        </div>

        {err && <p className="text-sm font-semibold text-red-600">{err}</p>}

        <button
          onClick={startTest}
          className="w-full rounded-2xl bg-slate-900 py-4 text-lg font-black text-white hover:bg-slate-700"
        >
          Start Test →
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
    const isCorrect = picked === q.correct_answer;
    const isLast = i + 1 === total;

    return (
      <div className="mx-auto max-w-xl space-y-6">
        {/* Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-slate-500">
            <span>Question {i + 1} of {total}</span>
            <span className={q.type === "article" ? "text-blue-600 font-semibold" : "text-violet-600 font-semibold"}>
              {q.type === "article" ? "Article" : "Grammar"}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-slate-800 transition-all"
              style={{ width: `${((i + 1) / total) * 100}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-4">
          {q.type === "article" ? (
            <>
              <p className="text-sm text-slate-500">What is the article for…</p>
              <p className="text-5xl font-black text-slate-900">{q.word}</p>
            </>
          ) : (
            <p className="text-xl font-bold text-slate-800 leading-snug">{q.question}</p>
          )}
        </div>

        {/* Choices */}
        <div className={`grid gap-3 ${q.type === "article" ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2"}`}>
          {q.choices.map((c) => {
            let cls = "rounded-2xl border-2 p-4 text-left font-bold transition-all ";
            if (!showFeedback) {
              cls += "border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50 cursor-pointer";
            } else if (c === q.correct_answer) {
              cls += "border-green-500 bg-green-50 text-green-800";
            } else if (c === picked && c !== q.correct_answer) {
              cls += "border-red-400 bg-red-50 text-red-700";
            } else {
              cls += "border-slate-100 bg-slate-50 text-slate-400";
            }
            return (
              <button key={c} className={cls} onClick={() => pick(c)}>
                {q.type === "article" ? (
                  <span className="text-2xl">{c}</span>
                ) : (
                  <span>{c}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback + Next */}
        {showFeedback && (
          <div className="space-y-3">
            <div className={`rounded-2xl px-5 py-3 text-sm font-semibold ${isCorrect ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>
              {isCorrect ? "✓ Correct!" : `✗ The correct answer is "${q.correct_answer}"`}
            </div>
            <button
              onClick={next}
              className="w-full rounded-2xl bg-slate-900 py-3 font-black text-white hover:bg-slate-700"
            >
              {isLast ? "Finish Test" : "Next →"}
            </button>
          </div>
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
          <h2 className="text-3xl font-black text-slate-900">
            {result.score} / {result.total}
          </h2>
          <p className="text-xl font-bold text-slate-600">{pct}% correct</p>
          <p className="text-sm text-slate-400">
            {pct >= 80 ? "Great work! Keep it up." : pct >= 50 ? "Good effort — practice more to improve." : "Keep studying — you'll get there!"}
          </p>
        </div>

        <AIFeedback
          exerciseType="test"
          score={result.score}
          total={result.total}
          wrongAnswers={result.feedback
            .filter((f) => !f.correct)
            .map((f) => ({ word: f.correct_answer, typed: f.your_answer }))}
        />

        {/* Feedback breakdown */}
        <div className="space-y-2">
          <h3 className="font-black text-slate-700">Breakdown</h3>
          {result.feedback.map((f) => (
            <div
              key={f.id}
              className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${f.correct ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
            >
              <span className="mt-0.5 text-lg">{f.correct ? "✓" : "✗"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{f.question}</p>
                {!f.correct && (
                  <p className="text-xs text-red-700 mt-0.5">
                    You: <strong>{f.your_answer}</strong> · Correct: <strong>{f.correct_answer}</strong>
                  </p>
                )}
              </div>
              <span className={`text-xs font-bold rounded-full px-2 py-0.5 ${f.type === "article" ? "bg-blue-100 text-blue-700" : "bg-violet-100 text-violet-700"}`}>
                {f.type}
              </span>
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
