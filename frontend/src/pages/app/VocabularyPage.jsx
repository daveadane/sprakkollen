// src/pages/app/VocabularyPage.jsx
import { useEffect, useState } from "react";
import AddWordForm from "../../components/vocabulary/AddWordForm";
import WordList from "../../components/vocabulary/WordList";
import { apiFetch } from "../../utils/api";

const LIMIT = 20;

export default function VocabularyPage() {
  const [items, setItems] = useState([]);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load(currentSkip = 0, reset = true) {
    setLoading(true);
    setErr("");
    try {
      const data = await apiFetch(`/vocab?skip=${currentSkip}&limit=${LIMIT}`);
      const rows = Array.isArray(data) ? data : [];

      if (reset) {
        setItems(rows);
      } else {
        setItems((prev) => [...prev, ...rows]);
      }

      setHasMore(rows.length === LIMIT);
      setSkip(currentSkip + rows.length);
    } catch (e) {
      setErr(e?.message || "Failed to load vocabulary");
      if (reset) setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(0, true);
  }, []);

  async function addWord(newItem) {
    setErr("");
    try {
      const created = await apiFetch("/vocab", {
        method: "POST",
        body: newItem,
      });
      setItems((prev) => [created, ...prev]);
    } catch (e) {
      setErr(e?.message || "Failed to add word");
    }
  }

  async function editWord(item) {
    const nextArticle = item.article === "en" ? "ett" : "en";
    setErr("");
    try {
      const updated = await apiFetch(`/vocab/${item.id}`, {
        method: "PUT",
        body: { article: nextArticle },
      });
      setItems((prev) => prev.map((x) => (x.id === item.id ? updated : x)));
    } catch (e) {
      setErr(e?.message || "Failed to update word");
    }
  }

  async function deleteWord(id) {
    setErr("");
    try {
      await apiFetch(`/vocab/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      setErr(e?.message || "Failed to delete word");
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Vocabulary</h1>
        <p className="mt-2 text-slate-600">
          Save words and practice them later.
        </p>

        {err ? (
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {err}
          </p>
        ) : null}
      </div>

      <AddWordForm onAdd={addWord} />

      {loading && items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
          Loading vocabulary…
        </div>
      ) : (
        <WordList items={items} onEdit={editWord} onDelete={deleteWord} />
      )}

      <div className="flex gap-3">
        {hasMore && (
          <button
            onClick={() => load(skip, false)}
            disabled={loading}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 font-bold text-slate-900 hover:bg-slate-50 disabled:opacity-60"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        )}

        <button
          onClick={() => load(0, true)}
          disabled={loading}
          className="rounded-2xl border border-slate-200 bg-white px-5 py-3 font-bold text-slate-900 hover:bg-slate-50 disabled:opacity-60"
        >
          Refresh list
        </button>
      </div>
    </div>
  );
}
