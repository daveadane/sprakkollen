import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../../utils/api";

// Phase: loading | reading | generating | quiz | result
export default function BookChapterPage() {
  const { bookId, chapterNum } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const book = state?.book || null;

  const chNum = parseInt(chapterNum, 10);

  const [phase, setPhase] = useState("loading");
  const [chapterData, setChapterData] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!book?.text_url) {
      navigate("/book-reader");
      return;
    }
    setPhase("loading");
    setChapterData(null);
    setResult(null);
    setAnswers([]);
    setError("");

    const params = new URLSearchParams({
      text_url: book.text_url,
      title: book.title || "",
    });

    apiFetch(`/book-reader/${bookId}/chapter/${chNum}?${params}`)
      .then((data) => {
        setChapterData(data);
        setAnswers(new Array(data.questions.length).fill(""));
        setPhase("reading");
      })
      .catch((err) => {
        setError(err?.message || "Could not load this chapter.");
        setPhase("reading");
      });
  }, [bookId, chNum, book]);

  async function handleSubmit() {
    if (answers.some((a) => !a)) {
      setError("Please answer all questions.");
      return;
    }
    setError("");
    try {
      const correctAnswers = chapterData.questions.map((q) => q.correct_answer);
      const data = await apiFetch("/book-reader/submit", {
        method: "POST",
        body: {
          gutenberg_id: bookId,
          book_title: chapterData.book_title,
          chapter_num: chNum,
          answers,
          correct_answers: correctAnswers,
        },
      });
      setResult(data);
      setPhase("result");
    } catch (err) {
      setError(err?.message || "Submission failed.");
    }
  }

  function goToChapter(num) {
    navigate(`/book-reader/${bookId}/chapter/${num}`, { state: { book } });
  }

  // ── Loading ────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-200 border-t-amber-500" />
        <p className="text-sm text-slate-500">Loading chapter {chNum}…</p>
      </div>
    );
  }

  // ── Reading phase ──────────────────────────────────────────────────────
  if (phase === "reading" && chapterData) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/book-reader")}
            className="text-slate-400 hover:text-slate-600 text-sm"
          >
            ← Library
          </button>
          <span className="text-sm font-bold text-amber-600 uppercase tracking-wide">
            Chapter {chNum} / {chapterData.total_chapters}
          </span>
        </div>

        {/* Book header */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-xs font-black text-amber-400 uppercase tracking-wide mb-1">Reading</p>
          <p className="font-black text-slate-800 text-lg leading-snug">{chapterData.book_title}</p>
          {book?.author && <p className="text-sm text-slate-500 mt-0.5">{book.author}</p>}
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-red-600 text-sm">
            {error}
          </p>
        )}

        {/* Chapter text */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-slate-800 leading-relaxed whitespace-pre-wrap text-sm">
            {chapterData.text}
          </p>
        </div>

        {/* Chapter navigation */}
        <div className="flex gap-3">
          {chNum > 1 && (
            <button
              onClick={() => goToChapter(chNum - 1)}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              ← Chapter {chNum - 1}
            </button>
          )}
          <button
            onClick={() => setPhase("quiz")}
            className="flex-1 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-white font-black shadow hover:from-amber-600 hover:to-orange-600 transition"
          >
            Take the Quiz →
          </button>
          {chNum < chapterData.total_chapters && (
            <button
              onClick={() => goToChapter(chNum + 1)}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Chapter {chNum + 1} →
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Quiz phase ─────────────────────────────────────────────────────────
  if (phase === "quiz" && chapterData) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPhase("reading")}
            className="text-slate-400 hover:text-slate-600 text-sm"
          >
            ← Back to reading
          </button>
          <span className="text-sm font-bold text-amber-500 uppercase tracking-wide">Quiz</span>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
          <p className="text-xs font-black text-amber-400 uppercase tracking-wide mb-1">Chapter {chNum}</p>
          <p className="font-bold text-slate-700 text-sm">{chapterData.book_title}</p>
        </div>

        {chapterData.questions.map((q, qi) => (
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
                      ? "border-amber-500 bg-amber-50 text-amber-700"
                      : "border-slate-200 text-slate-700 hover:border-amber-300 hover:bg-amber-50",
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
              : "bg-gradient-to-r from-amber-500 to-orange-500 shadow hover:from-amber-600 hover:to-orange-600",
          ].join(" ")}
        >
          {answers.some((a) => !a)
            ? `Answer all ${chapterData.questions.length} questions`
            : "Submit Answers"}
        </button>
      </div>
    );
  }

  // ── Result phase ───────────────────────────────────────────────────────
  if (phase === "result" && result && chapterData) {
    const pct = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
    const star = pct === 100 ? "🏆" : pct >= 75 ? "🎉" : pct >= 50 ? "👍" : "📖";
    const hasNext = chNum < chapterData.total_chapters;

    return (
      <div className="mx-auto max-w-xl space-y-6">
        {/* Score */}
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
          <p className="text-4xl mb-2">{star}</p>
          <p className="font-black text-green-800 text-xl">
            {result.score} / {result.total} correct
          </p>
          <p className="text-green-600 text-sm mt-1">{result.message}</p>
          <div className="mt-4 h-3 w-full rounded-full bg-green-200">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-green-600 mt-1">{pct}%</p>
        </div>

        {/* Review */}
        <div className="space-y-3">
          <h2 className="text-sm font-black text-slate-500 uppercase tracking-wide">Review</h2>
          {chapterData.questions.map((q, qi) => {
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
                  Q{qi + 1} — {correct ? "✓ Correct" : "✗ Incorrect"}
                </p>
                <p className="font-semibold text-slate-800 text-sm">{q.question}</p>
                {!correct && (
                  <p className="text-xs text-red-600">
                    Your answer: <span className="font-semibold">{answers[qi]}</span>
                  </p>
                )}
                <p className={`text-xs font-semibold ${correct ? "text-green-700" : "text-slate-700"}`}>
                  {correct ? "Your answer: " : "Correct: "}
                  {correct ? answers[qi] : q.correct_answer}
                </p>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/book-reader")}
            className="flex-1 rounded-2xl border border-slate-300 py-3 text-slate-700 font-black hover:bg-slate-50 transition"
          >
            Library
          </button>
          {hasNext ? (
            <button
              onClick={() => goToChapter(chNum + 1)}
              className="flex-1 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-white font-black shadow hover:from-amber-600 hover:to-orange-600 transition"
            >
              Chapter {chNum + 1} →
            </button>
          ) : (
            <button
              onClick={() => navigate("/book-reader")}
              className="flex-1 rounded-2xl bg-slate-800 py-3 text-white font-black hover:bg-slate-700 transition"
            >
              Find Another Book
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
