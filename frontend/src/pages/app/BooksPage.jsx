import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/api";

const levelColor = {
  A1: "bg-green-100 text-green-700",
  A2: "bg-blue-100 text-blue-700",
  B1: "bg-orange-100 text-orange-700",
  B2: "bg-red-100 text-red-700",
};

export default function BooksPage() {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    apiFetch("/reading/texts")
      .then(setTexts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Reading</h1>
        <p className="mt-2 text-slate-600">
          Read Swedish texts and answer comprehension questions.
        </p>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading texts...</p>}

      <div className="space-y-3">
        {texts.map((t) => (
          <button
            key={t.id}
            onClick={() => navigate(`/books/${t.id}`)}
            className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-left hover:border-blue-300 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-lg">{t.title}</p>
                {t.topic && (
                  <p className="text-sm text-slate-500 mt-0.5">{t.topic}</p>
                )}
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                  levelColor[t.level] ?? "bg-slate-100 text-slate-700"
                }`}
              >
                {t.level}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
