// src/pages/app/VocabularyPage.jsx
import { useEffect, useState } from "react";
import AddWordForm from "../../components/vocabulary/AddWordForm";
import WordList from "../../components/vocabulary/WordList";
import { apiFetch } from "../../utils/api";

export default function VocabularyPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const data = await apiFetch("/vocab", { method: "GET" });
      // expected: [{id, word, article, source?}, ...]
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.message || "Failed to load vocabulary");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addWord(newItem) {
    // newItem likely: { word, article, source? }
    setErr("");
    try {
      const created = await apiFetch("/vocab", {
        method: "POST",
        body: newItem, // apiFetch will JSON stringify plain object
      });
      setItems((prev) => [created, ...prev]);
    } catch (e) {
      setErr(e?.message || "Failed to add word");
    }
  }

  async function editWord(item) {
    // Your old UI toggled article. We'll keep that behavior.
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
          Save words and practice them later. (Backend CRUD)
        </p>

        {err ? (
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {err}
          </p>
        ) : null}
      </div>

      <AddWordForm onAdd={addWord} />

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
          Loading vocabulary…
        </div>
      ) : (
        <WordList items={items} onEdit={editWord} onDelete={deleteWord} />
      )}

      <button
        onClick={load}
        className="rounded-2xl border border-slate-200 bg-white px-5 py-3 font-bold text-slate-900 hover:bg-slate-50"
      >
        Refresh list
      </button>
    </div>
  );
}
