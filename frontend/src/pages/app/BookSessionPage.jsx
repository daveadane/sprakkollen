import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api";

const levelColor = {
  A1: "bg-green-100 text-green-700",
  A2: "bg-blue-100 text-blue-700",
  B1: "bg-orange-100 text-orange-700",
  B2: "bg-red-100 text-red-700",
};

export default function BookSessionPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});       // { question_id: chosen }
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch(`/reading/texts/${id}`)
      .then(setText)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  function choose(questionId, choice) {
    if (result) return; // locked after submit
    setAnswers((prev) => ({ ...prev, [questionId]: choice }));
  }

  async function handleSubmit() {
    const payload = {
      answers: Object.entries(answers).map(([qid, chosen]) => ({
        question_id: Number(qid),
        chosen,
      })),
    };

    setSubmitting(true);
    try {
      const res = await apiFetch(`/reading/texts/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Loading...</p>;
  if (!text) return <p className="text-sm text-red-500">Text not found.</p>;

  const allAnswered = text.questions.every((q) => answers[q.id] !== undefined);
  const feedbackMap = result
    ? Object.fromEntries(result.feedback.map((f) => [f.question_id, f]))
    : {};

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => navigate("/books")}
            className="text-sm text-slate-500 hover:text-slate-700 mb-1"
          >
            ← Back to Reading
          </button>
          <h1 className="text-3xl font-black tracking-tight">{text.title}</h1>
          {text.topic && <p className="text-slate-500 text-sm">{text.topic}</p>}
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
            levelColor[text.level] ?? "bg-slate-100 text-slate-700"
          }`}
        >
          {text.level}
        </span>
      </div>

      {/* Reading text */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-slate-800 leading-relaxed whitespace-pre-line">{text.content}</p>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold">Comprehension Questions</h2>
        {text.questions.map((q, idx) => {
          const fb = feedbackMap[q.id];
          return (
            <div
              key={q.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3"
            >
              <p className="font-semibold">
                {idx + 1}. {q.question}
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {q.choices.map((choice) => {
                  const chosen = answers[q.id] === choice;
                  let cls =
                    "rounded-xl border px-4 py-2 text-sm text-left transition ";

                  if (fb) {
                    if (choice === fb.correct_answer) {
                      cls += "border-green-400 bg-green-50 text-green-800 font-semibold";
                    } else if (chosen && !fb.is_correct) {
                      cls += "border-red-400 bg-red-50 text-red-700";
                    } else {
                      cls += "border-slate-200 bg-slate-50 text-slate-500";
                    }
                  } else {
                    cls += chosen
                      ? "border-blue-500 bg-blue-50 text-blue-800 font-semibold"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300";
                  }

                  return (
                    <button
                      key={choice}
                      className={cls}
                      onClick={() => choose(q.id, choice)}
                      disabled={!!result}
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>
              {fb && (
                <p className={`text-sm font-semibold ${fb.is_correct ? "text-green-600" : "text-red-600"}`}>
                  {fb.is_correct ? "Correct ✓" : `Incorrect ✗ — correct: ${fb.correct_answer}`}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Result banner */}
      {result && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-center space-y-1">
          <p className="text-2xl font-black">
            {result.score}/{result.total}
          </p>
          <p className="text-slate-600">
            {result.accuracy}% correct
          </p>
          <button
            onClick={() => navigate("/books")}
            className="mt-3 rounded-xl bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Back to Reading
          </button>
        </div>
      )}

      {/* Submit button */}
      {!result && (
        <button
          onClick={handleSubmit}
          disabled={!allAnswered || submitting}
          className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-40"
        >
          {submitting ? "Submitting..." : "Submit Answers"}
        </button>
      )}
    </div>
  );
}
