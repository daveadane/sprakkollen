import { useState } from "react";
import WordSearchInput from "../../components/checker/WordSearchInput";
import ResultCard from "../../components/checker/ResultCard";
import { lookupWord } from "../../api/lookup.api";

export default function CheckerPage() {
  const [word, setWord] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit() {
    const w = word.trim();
    if (!w) return;

    setLoading(true);
    setErrorMsg("");
    setResult(null);

    try {
      const data = await lookupWord(w);
      setResult(data);
    } catch (err) {
      console.error(err);
      setErrorMsg("Could not reach the API. Is FastAPI running on port 8000?");
      setResult({ word: w, article: "error", confidence: "error", source: null });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Ett / En Checker</h1>
        <p className="mt-2 text-slate-600">
          Transparent result: article + confidence + source.
        </p>
      </div>

      <WordSearchInput
        value={word}
        onChange={setWord}
        onSubmit={handleSubmit}
        disabled={loading}
      />

      {loading && (
        <p className="text-sm text-slate-500">Checking...</p>
      )}

      {errorMsg && (
        <p className="text-sm text-red-600">{errorMsg}</p>
      )}

      <ResultCard result={result} />
    </div>
  );
}
