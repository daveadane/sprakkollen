// src/pages/app/VocabularyPage.jsx
import { useEffect, useState } from "react";
import AddWordForm from "../../components/vocabulary/AddWordForm";
import WordList from "../../components/vocabulary/WordList";
import { apiFetch } from "../../utils/api";
import useAuth from "../../state/useAuth";

const LIMIT = 50;

// ─── Admin: Global Swedish Word DB ───────────────────────────────────────────
function AdminVocabularyPage() {
  const [items, setItems] = useState([]);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editArticle, setEditArticle] = useState("en");

  async function load(currentSkip = 0, reset = true, q = search) {
    setLoading(true);
    setErr("");
    try {
      const params = new URLSearchParams({ skip: currentSkip, limit: LIMIT });
      if (q) params.set("search", q);
      const data = await apiFetch(`/admin/words?${params}`);
      const rows = Array.isArray(data) ? data : [];
      if (reset) setItems(rows);
      else setItems((prev) => [...prev, ...rows]);
      setHasMore(rows.length === LIMIT);
      setSkip(currentSkip + rows.length);
    } catch (e) {
      setErr(e?.message || "Failed to load words");
      if (reset) setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(0, true, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    setSearch(searchInput);
    load(0, true, searchInput);
  }

  async function addWord(newItem) {
    setErr("");
    try {
      const created = await apiFetch("/admin/words", { method: "POST", body: newItem });
      setItems((prev) => [created, ...prev]);
    } catch (e) {
      setErr(e?.message || "Failed to add word");
    }
  }

  async function saveEdit(item) {
    setErr("");
    try {
      const updated = await apiFetch(`/admin/words/${item.id}`, {
        method: "PUT",
        body: { article: editArticle },
      });
      setItems((prev) => prev.map((x) => (x.id === item.id ? updated : x)));
      setEditingId(null);
    } catch (e) {
      setErr(e?.message || "Failed to update word");
    }
  }

  async function deleteWord(id) {
    if (!confirm("Delete this word from the database?")) return;
    setErr("");
    try {
      await apiFetch(`/admin/words/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      setErr(e?.message || "Failed to delete word");
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Word Database</h1>
        <p className="mt-2 text-slate-600">
          Admin: add, edit, or delete words from the global checker database ({items.length} shown).
        </p>
        {err && (
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {err}
          </p>
        )}
      </div>

      <AddWordForm onAdd={addWord} />

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search words…"
          className="flex-1 rounded-2xl border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button
          type="submit"
          className="rounded-2xl bg-blue-600 px-5 py-2 font-bold text-white hover:bg-blue-700"
        >
          Search
        </button>
        {search && (
          <button
            type="button"
            onClick={() => { setSearchInput(""); setSearch(""); load(0, true, ""); }}
            className="rounded-2xl border border-slate-200 px-4 py-2 font-semibold hover:bg-slate-50"
          >
            Clear
          </button>
        )}
      </form>

      {/* Word table */}
      {loading && items.length === 0 ? (
        <p className="text-slate-500">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-slate-500">No words found.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-sm font-semibold text-slate-600">Word</th>
                <th className="px-4 py-3 text-sm font-semibold text-slate-600">Article</th>
                <th className="px-4 py-3 text-sm font-semibold text-slate-600">Confidence</th>
                <th className="px-4 py-3 text-sm font-semibold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((w) => (
                <tr key={w.id} className="border-t">
                  <td className="px-4 py-3 font-mono font-semibold">{w.word}</td>
                  <td className="px-4 py-3">
                    {editingId === w.id ? (
                      <select
                        value={editArticle}
                        onChange={(e) => setEditArticle(e.target.value)}
                        className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                      >
                        <option value="en">en</option>
                        <option value="ett">ett</option>
                      </select>
                    ) : (
                      <span className="font-medium text-blue-700">{w.article}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {w.confidence != null ? `${Math.round(w.confidence * 100)}%` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      {editingId === w.id ? (
                        <>
                          <button
                            onClick={() => saveEdit(w)}
                            className="rounded-xl border border-green-200 bg-white px-3 py-1.5 text-sm font-semibold text-green-700 hover:bg-green-50"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => { setEditingId(w.id); setEditArticle(w.article); }}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-slate-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteWord(w.id)}
                            className="rounded-xl border border-red-200 bg-white px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
      </div>
    </div>
  );
}

// ─── Regular user: Personal vocabulary list ──────────────────────────────────
const USER_LIMIT = 20;

function UserVocabularyPage() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const totalPages = Math.max(1, Math.ceil(total / USER_LIMIT));

  async function load(p = 1, q = search) {
    setLoading(true);
    setErr("");
    try {
      const params = new URLSearchParams({ skip: (p - 1) * USER_LIMIT, limit: USER_LIMIT });
      if (q) params.set("search", q);
      const [data, countData] = await Promise.all([
        apiFetch(`/vocab?${params}`),
        apiFetch(`/vocab/count${q ? `?search=${encodeURIComponent(q)}` : ""}`),
      ]);
      setItems(Array.isArray(data) ? data : []);
      setTotal(countData?.count ?? 0);
    } catch (e) {
      setErr(e?.message || "Failed to load vocabulary");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(1, ""); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearch(e) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
    load(1, searchInput);
  }

  function goToPage(p) {
    setPage(p);
    load(p, search);
  }

  async function addWord(newItem) {
    setErr("");
    try {
      await apiFetch("/vocab", { method: "POST", body: newItem });
      // Reload current page to reflect new count
      load(1, search);
      setPage(1);
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
      // If last item on page, go back one
      const newTotal = total - 1;
      const newPages = Math.max(1, Math.ceil(newTotal / USER_LIMIT));
      const newPage = Math.min(page, newPages);
      setPage(newPage);
      load(newPage, search);
    } catch (e) {
      setErr(e?.message || "Failed to delete word");
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Vocabulary</h1>
        <p className="mt-2 text-slate-600">
          Save words and practice them later.{" "}
          {total > 0 && <span className="text-slate-400">({total} words)</span>}
        </p>
        {err && (
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {err}
          </p>
        )}
      </div>

      <AddWordForm onAdd={addWord} />

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search your words…"
          className="flex-1 rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
        >
          Search
        </button>
        {search && (
          <button
            type="button"
            onClick={() => { setSearchInput(""); setSearch(""); setPage(1); load(1, ""); }}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
          >
            Clear
          </button>
        )}
      </form>

      {loading && items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
          Loading vocabulary…
        </div>
      ) : (
        <WordList items={items} onEdit={editWord} onDelete={deleteWord} />
      )}

      {/* Numbered pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 flex-wrap">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page === 1 || loading}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-semibold disabled:opacity-40 hover:bg-slate-50"
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => goToPage(n)}
              disabled={loading}
              className={`rounded-xl border px-3 py-1.5 text-sm font-semibold transition ${
                n === page
                  ? "border-blue-500 bg-blue-600 text-white"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page === totalPages || loading}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-semibold disabled:opacity-40 hover:bg-slate-50"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Entry point ─────────────────────────────────────────────────────────────
export default function VocabularyPage() {
  const { user } = useAuth();
  return user?.is_admin ? <AdminVocabularyPage /> : <UserVocabularyPage />;
}
