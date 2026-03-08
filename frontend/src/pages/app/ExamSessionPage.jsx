import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../../utils/api";

const LEVEL_LABELS = { sva1: "SVA1", sva3: "SVA3" };
const LEVEL_COLORS = {
  sva1: "bg-blue-100 text-blue-800",
  sva3: "bg-purple-100 text-purple-800",
};

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function ExamSessionPage() {
  const { level } = useParams();
  const navigate = useNavigate();

  const [phase, setPhase] = useState("loading"); // loading | instructions | exam | submitting | results
  const [exam, setExam] = useState(null);
  const [error, setError] = useState("");

  // Exam state
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const timerRef = useRef(null);

  // Results state
  const [results, setResults] = useState(null);

  // Confirm submit dialog
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    apiFetch(`/exam-practice/exams/${level}`)
      .then((data) => {
        setExam(data);
        setTimeLeft(data.time_limit_minutes * 60);
        setPhase("instructions");
      })
      .catch((e) => {
        setError(e?.message || "Failed to load exam.");
        setPhase("error");
      });
  }, [level]);

  function startExam() {
    setStartTime(Date.now());
    setPhase("exam");
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function pickAnswer(qId, choice) {
    setAnswers((prev) => ({ ...prev, [qId]: choice }));
  }

  const allAnswered = exam && Object.keys(answers).length === exam.questions.length;

  async function handleSubmit(autoSubmit = false) {
    if (!autoSubmit && !allAnswered) return;
    clearInterval(timerRef.current);
    setShowConfirm(false);
    setPhase("submitting");

    const timeTaken = startTime ? Math.floor((Date.now() - startTime) / 1000) : null;

    try {
      const data = await apiFetch("/exam-practice/submit", {
        method: "POST",
        body: { level, answers, time_taken_seconds: timeTaken },
      });
      setResults(data);
      setPhase("results");
    } catch (e) {
      setError(e?.message || "Failed to submit exam.");
      setPhase("exam");
    }
  }

  useEffect(() => () => clearInterval(timerRef.current), []);

  // Reading and grammar questions split
  const readingQs = exam?.questions?.filter((q) => q.section === "reading") || [];
  const grammarQs = exam?.questions?.filter((q) => q.section === "grammar") || [];

  if (phase === "loading") return <p className="text-sm text-slate-500 mt-8 text-center">Loading exam...</p>;
  if (phase === "error") return <p className="text-sm text-red-600 mt-8 text-center">{error}</p>;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 pb-12">
      {/* Instructions phase */}
      {phase === "instructions" && (
        <>
          <div className="rounded-2xl p-6 text-white" style={{ background: "linear-gradient(135deg,#006AA7,#004f80)" }}>
            <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${LEVEL_COLORS[level]} mr-2`}>
              {LEVEL_LABELS[level] || level.toUpperCase()}
            </span>
            <h1 className="mt-3 text-3xl font-black tracking-tight">{exam.title}</h1>
            <p className="mt-2 text-blue-100">{exam.description}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-800 text-lg">Before you start</h2>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex gap-2"><span>⏱</span><span>You have <strong>{exam.time_limit_minutes} minutes</strong>. The exam auto-submits when time runs out.</span></li>
              <li className="flex gap-2"><span>📝</span><span><strong>{exam.questions.length} multiple-choice questions</strong> — reading comprehension and grammar.</span></li>
              <li className="flex gap-2"><span>📖</span><span>The reading passage is always visible during the exam.</span></li>
              <li className="flex gap-2"><span>✅</span><span>You can change answers before submitting. Submit when ready.</span></li>
              <li className="flex gap-2"><span>🎯</span><span>Passing score: <strong>60%</strong> or higher.</span></li>
            </ul>
          </div>
          <button
            onClick={startExam}
            className="w-full rounded-2xl py-4 font-bold text-white text-lg transition hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#006AA7,#004f80)" }}
          >
            Start Exam →
          </button>
        </>
      )}

      {/* Exam phase */}
      {phase === "exam" && (
        <>
          {/* Sticky timer bar */}
          <div className="sticky top-0 z-10 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm flex items-center justify-between">
            <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${LEVEL_COLORS[level]}`}>
              {LEVEL_LABELS[level] || level.toUpperCase()}
            </span>
            <span className={`font-mono font-bold text-lg ${timeLeft < 300 ? "text-red-600" : "text-slate-700"}`}>
              ⏱ {formatTime(timeLeft)}
            </span>
            <span className="text-xs text-slate-400">
              {Object.keys(answers).length}/{exam.questions.length} answered
            </span>
          </div>

          {/* Reading passage */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <p className="text-xs font-bold uppercase text-blue-400 mb-2 tracking-wide">Reading Passage</p>
            <p className="text-sm text-slate-700 leading-relaxed">{exam.reading_passage}</p>
          </div>

          {/* Reading questions */}
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase text-slate-400 tracking-wide">Part A — Reading Comprehension</p>
            {readingQs.map((q, i) => (
              <QuestionCard key={q.id} q={q} index={i + 1} chosen={answers[q.id]} onPick={pickAnswer} />
            ))}
          </div>

          {/* Grammar questions */}
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase text-slate-400 tracking-wide">Part B — Grammar</p>
            {grammarQs.map((q, i) => (
              <QuestionCard key={q.id} q={q} index={readingQs.length + i + 1} chosen={answers[q.id]} onPick={pickAnswer} />
            ))}
          </div>

          {/* Submit button */}
          <button
            onClick={() => allAnswered && setShowConfirm(true)}
            disabled={!allAnswered}
            className="w-full rounded-2xl py-4 font-bold text-white text-lg transition hover:opacity-90 disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#006AA7,#004f80)" }}
          >
            Submit Exam
          </button>
          {!allAnswered && (
            <p className="text-center text-xs text-slate-400">
              Answer all {exam.questions.length} questions to submit.
            </p>
          )}

          {/* Confirm dialog */}
          {showConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="rounded-2xl bg-white p-6 shadow-xl max-w-sm w-full mx-4 space-y-4">
                <p className="font-bold text-slate-800 text-lg">Submit exam?</p>
                <p className="text-sm text-slate-500">You have answered all questions. Submit your answers now?</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleSubmit(false)}
                    className="flex-1 rounded-xl py-2.5 font-bold text-white text-sm"
                    style={{ background: "linear-gradient(135deg,#006AA7,#004f80)" }}
                  >
                    Yes, Submit
                  </button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Submitting phase */}
      {phase === "submitting" && (
        <div className="flex flex-col items-center gap-4 py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-slate-500 text-sm">Grading your exam...</p>
        </div>
      )}

      {/* Results phase */}
      {phase === "results" && results && (
        <>
          <div className="rounded-2xl p-6 text-white" style={{ background: "linear-gradient(135deg,#006AA7,#004f80)" }}>
            <h1 className="text-3xl font-black tracking-tight">Exam Complete!</h1>
            <p className="mt-1 text-blue-100">{exam.title}</p>
          </div>

          {/* Score card */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm text-center space-y-2">
            <p className="text-5xl font-black text-slate-800">
              {results.score} <span className="text-2xl text-slate-400">/ {results.total}</span>
            </p>
            <p className="text-slate-500">{results.percentage}%</p>
            <span
              className={`inline-block rounded-full px-4 py-1 text-sm font-bold ${
                results.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
              }`}
            >
              {results.passed ? "✓ Passed" : "✗ Not passed"}
            </span>
          </div>

          {/* Review */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-3">
            <h2 className="font-bold text-slate-800">Question Review</h2>
            <div className="space-y-3">
              {results.review.map((item, i) => (
                <div
                  key={item.id}
                  className={`rounded-xl border p-3 text-sm ${
                    item.is_correct ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex gap-2">
                    <span className={`font-bold ${item.is_correct ? "text-green-600" : "text-red-600"}`}>
                      {item.is_correct ? "✓" : "✗"}
                    </span>
                    <p className={item.is_correct ? "text-green-800" : "text-red-800"}>
                      <span className="font-semibold">Q{i + 1}:</span> {item.question}
                    </p>
                  </div>
                  {!item.is_correct && (
                    <p className="mt-1 ml-5 text-xs text-slate-500">
                      Correct answer: <span className="font-semibold text-slate-700">{item.correct_answer}</span>
                      {item.chosen && (
                        <> · Your answer: <span className="text-red-600">{item.chosen}</span></>
                      )}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/exam-practice/${level}`)}
              className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate("/exam-practice")}
              className="flex-1 rounded-xl py-3 text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg,#006AA7,#004f80)" }}
            >
              Back to Exams
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function QuestionCard({ q, index, chosen, onPick }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
      <p className="text-sm font-semibold text-slate-800">
        <span className="text-slate-400 mr-1">{index}.</span> {q.question}
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {q.choices.map((choice) => (
          <button
            key={choice}
            onClick={() => onPick(q.id, choice)}
            className={`rounded-xl border px-4 py-2.5 text-sm text-left transition ${
              chosen === choice
                ? "border-blue-500 bg-blue-50 text-blue-800 font-semibold"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300 hover:bg-blue-50"
            }`}
          >
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
}
