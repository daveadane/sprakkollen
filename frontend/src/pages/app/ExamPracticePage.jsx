import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api";

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return "Yesterday";
  return `${Math.floor(diff / 86400)} days ago`;
}

const LEVEL_COLORS = {
  sva1: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200" },
  sva3: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200" },
};

export default function ExamPracticePage() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch("/exam-practice/exams"),
      apiFetch("/exam-practice/history"),
    ])
      .then(([examsData, historyData]) => {
        setExams(examsData);
        setHistory(historyData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="rounded-2xl p-6 text-white" style={{ background: "linear-gradient(135deg,#006AA7,#004f80)" }}>
        <h1 className="text-3xl font-black tracking-tight">📋 Exam Practice</h1>
        <p className="mt-2 text-blue-100">
          Practice with SVA1 and SVA3 mock exams — reading comprehension and grammar, timed.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading exams...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {exams.map((exam) => {
            const colors = LEVEL_COLORS[exam.level] || LEVEL_COLORS.sva1;
            return (
              <div
                key={exam.level}
                className={`rounded-2xl border bg-white p-5 shadow-sm flex flex-col gap-3 ${colors.border}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${colors.bg} ${colors.text}`}>
                    {exam.level.toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-400">⏱ {exam.time_limit_minutes} min</span>
                </div>
                <div>
                  <p className="font-bold text-slate-800">{exam.title}</p>
                  <p className="text-sm text-slate-500 mt-1">{exam.description}</p>
                </div>
                <p className="text-xs text-slate-400">{exam.question_count} questions</p>
                <button
                  onClick={() => navigate(`/exam-practice/${exam.level}`)}
                  className="mt-auto w-full rounded-xl py-2.5 text-sm font-bold text-white transition hover:opacity-90"
                  style={{ background: "linear-gradient(135deg,#006AA7,#004f80)" }}
                >
                  Start Exam →
                </button>
              </div>
            );
          })}
        </div>
      )}

      {history.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-3">
          <h2 className="font-bold text-slate-800">Recent Attempts</h2>
          <div className="space-y-2">
            {history.slice(0, 5).map((h) => {
              const colors = LEVEL_COLORS[h.exam_level] || LEVEL_COLORS.sva1;
              const passed = h.percentage >= 60;
              return (
                <div
                  key={h.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${colors.bg} ${colors.text}`}>
                      {h.exam_level.toUpperCase()}
                    </span>
                    <span className="text-sm text-slate-600">{timeAgo(h.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-700">
                      {h.score}/{h.total_questions}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                      }`}
                    >
                      {passed ? "Pass" : "Fail"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
