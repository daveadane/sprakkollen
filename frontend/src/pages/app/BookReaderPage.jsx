import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api";

export default function BookReaderPage() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiFetch(`/book-reader/library?page=${page}`),
      apiFetch("/book-reader/progress"),
    ])
      .then(([lib, prog]) => {
        setBooks(lib.books || []);
        setTotal(lib.total || 0);
        setHasNext(lib.has_next || false);
        setProgress(prog || []);
      })
      .catch((err) => setError(err?.message || "Could not load books."))
      .finally(() => setLoading(false));
  }, [page]);

  // Map gutenberg_id → highest chapter completed
  const progressMap = {};
  for (const p of progress) {
    if (!progressMap[p.gutenberg_id] || p.chapter_num > progressMap[p.gutenberg_id]) {
      progressMap[p.gutenberg_id] = p.chapter_num;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        Loading books from Project Gutenberg…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-4xl mb-2">⚠️</p>
        <p className="font-black text-red-800">Could not load books</p>
        <p className="text-red-600 text-sm mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">📚</span>
          <div>
            <h1 className="text-2xl font-black text-slate-800">Swedish Books</h1>
            <p className="text-sm text-amber-600 font-semibold">Project Gutenberg — free classics</p>
          </div>
        </div>
        <p className="text-slate-600 text-sm leading-relaxed">
          Read classic Swedish literature from Project Gutenberg. Each chapter comes with
          AI-generated comprehension questions to test your understanding.
        </p>
      </div>

      {/* Progress summary */}
      {progress.length > 0 && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 flex items-center gap-4">
          <span className="text-2xl">📖</span>
          <p className="font-black text-green-800 text-sm">
            You've completed {progress.length} chapter{progress.length !== 1 ? "s" : ""} across{" "}
            {new Set(progress.map((p) => p.gutenberg_id)).size} book
            {new Set(progress.map((p) => p.gutenberg_id)).size !== 1 ? "s" : ""}!
          </p>
        </div>
      )}

      {/* Book grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-500 uppercase tracking-wide">
            Swedish Books ({total} available)
          </h2>
          <p className="text-xs text-slate-400">Page {page}</p>
        </div>

        {books.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-8">
            No books found on this page. Try a different page.
          </p>
        )}

        {books.map((book) => {
          const chapDone = progressMap[book.id] || 0;
          return (
            <button
              key={book.id}
              onClick={() =>
                navigate(`/book-reader/${book.id}/chapter/1`, {
                  state: { book },
                })
              }
              className="w-full text-left rounded-2xl border border-slate-200 bg-white p-5 hover:border-amber-300 hover:shadow-md transition flex gap-4 items-start"
            >
              {/* Cover */}
              <div className="shrink-0">
                {book.cover_url ? (
                  <img
                    src={book.cover_url}
                    alt=""
                    className="w-14 h-20 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-14 h-20 rounded-lg bg-amber-100 flex items-center justify-center text-2xl">
                    📖
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-slate-800 text-sm leading-snug line-clamp-2">
                    {book.title}
                  </p>
                  {chapDone > 0 && (
                    <span className="shrink-0 rounded-full bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5">
                      Ch. {chapDone} ✓
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">{book.author}</p>
                {book.subjects.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {book.subjects.slice(0, 2).map((s) => (
                      <span
                        key={s}
                        className="rounded-full bg-amber-100 text-amber-700 text-xs px-2 py-0.5"
                      >
                        {s.length > 30 ? s.slice(0, 30) + "…" : s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <span className="shrink-0 text-slate-300 mt-1">›</span>
            </button>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-3 pb-4">
        {page > 1 && (
          <button
            onClick={() => setPage((p) => p - 1)}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            ← Previous
          </button>
        )}
        {hasNext && (
          <button
            onClick={() => setPage((p) => p + 1)}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Next →
          </button>
        )}
      </div>

      {/* Attribution */}
      <p className="text-center text-xs text-slate-400 pb-4">
        Books provided by{" "}
        <span className="font-semibold">Project Gutenberg</span> — free, public domain literature.
      </p>
    </div>
  );
}
