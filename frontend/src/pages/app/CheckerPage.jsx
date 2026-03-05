import { useState } from "react";
import WordSearchInput from "../../components/checker/WordSearchInput";
import ResultCard from "../../components/checker/ResultCard";
import { apiFetch } from "../../utils/api";

export default function CheckerPage() {
  const [word, setWord] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [notFound, setNotFound] = useState(false);

  // Suggestion state
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestArticle, setSuggestArticle] = useState("en");
  const [suggestNote, setSuggestNote] = useState("");
  const [suggestType, setSuggestType] = useState("add");
  const [suggestStatus, setSuggestStatus] = useState("");

  async function handleSubmit() {
    const w = word.trim();
    if (!w) return;

    setLoading(true);
    setErrorMsg("");
    setResult(null);
    setNotFound(false);
    setShowSuggest(false);
    setSuggestStatus("");

    try {
      const data = await apiFetch(`/lookup?word=${encodeURIComponent(w)}`, { method: "GET" });
      setResult(data);
    } catch (e) {
      if (e.status === 404) {
        setErrorMsg("Word not found in dataset.");
        setNotFound(true);
        setSuggestArticle("en");
        setSuggestType("add");
      } else if (e.status === 401) {
        setErrorMsg("Please login again (session expired).");
      } else {
        setErrorMsg(e?.message || "Could not reach API. Is FastAPI running?");
      }
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  function openFlag() {
    setSuggestType("flag");
    setSuggestArticle(result?.article === "en" ? "ett" : "en");
    setSuggestNote("");
    setSuggestStatus("");
    setShowSuggest(true);
  }

  function openSuggest() {
    setSuggestType("add");
    setSuggestArticle("en");
    setSuggestNote("");
    setSuggestStatus("");
    setShowSuggest(true);
  }

  async function submitSuggestion() {
    const w = word.trim().toLowerCase();
    setSuggestStatus("sending");
    try {
      await apiFetch("/suggestions", {
        method: "POST",
        body: {
          word: w,
          article: suggestArticle,
          suggestion_type: suggestType,
          note: suggestNote || null,
        },
      });
      setSuggestStatus("done");
      setShowSuggest(false);
    } catch (e) {
      setSuggestStatus(e?.data?.detail || "Failed to submit suggestion.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Ett / En Checker</h1>
        <p className="mt-2 text-slate-600">
          Type a Swedish noun to find out if it is <strong>en</strong> or <strong>ett</strong>.
        </p>
      </div>

      <WordSearchInput
        value={word}
        onChange={setWord}
        onSubmit={handleSubmit}
        disabled={loading}
      />

      {loading && <p className="text-sm text-slate-500">Checking...</p>}
      {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

      {/* Suggest missing word (after 404) */}
      {notFound && !showSuggest && (
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-orange-700">
            Do you know the article for <strong>{word.trim()}</strong>?
          </p>
          <button
            onClick={openSuggest}
            className="shrink-0 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            Suggest word
          </button>
        </div>
      )}

      {/* Submission feedback */}
      {suggestStatus === "done" && (
        <p className="text-sm text-green-600 font-semibold">
          Thank you! Your suggestion has been sent for admin review.
        </p>
      )}
      {suggestStatus && suggestStatus !== "done" && suggestStatus !== "sending" && (
        <p className="text-sm text-red-600">{suggestStatus}</p>
      )}

      <ResultCard result={result} />

      {/* Flag incorrect word (after a successful result) */}
      {result && !showSuggest && (
        <div className="text-right">
          <button
            onClick={openFlag}
            className="text-xs text-slate-400 hover:text-red-500 underline"
          >
            Flag as incorrect
          </button>
        </div>
      )}

      {/* Suggestion / Flag form */}
      {showSuggest && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <p className="font-semibold">
            {suggestType === "add"
              ? `Suggest article for "${word.trim()}"`
              : `Flag incorrect article for "${word.trim()}"`}
          </p>

          <div className="flex gap-3">
            {["en", "ett"].map((a) => (
              <button
                key={a}
                onClick={() => setSuggestArticle(a)}
                className={`rounded-xl border px-6 py-2 text-sm font-bold transition ${
                  suggestArticle === a
                    ? "border-blue-500 bg-blue-50 text-blue-800"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-300"
                }`}
              >
                {a}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Optional note (e.g. source or reason)"
            value={suggestNote}
            onChange={(e) => setSuggestNote(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-blue-400"
          />

          <div className="flex gap-3">
            <button
              onClick={submitSuggestion}
              disabled={suggestStatus === "sending"}
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {suggestStatus === "sending" ? "Sending..." : "Submit"}
            </button>
            <button
              onClick={() => setShowSuggest(false)}
              className="rounded-xl border border-slate-200 px-5 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
