import { useState } from "react";
import WordSearchInput from "../../components/checker/WordSearchInput";
import ResultCard from "../../components/checker/ResultCard";

export default function CheckerPage() {
  const [word, setWord] = useState("");
  const [result, setResult] = useState(null);

  function handleSubmit() {
    // NO API YET — mock for now
    setResult({
      word: word.trim() || "(empty)",
      article: "unknown",
      confidence: "unknown",
      source: null,
    });
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Ett / En Checker</h1>
        <p className="mt-2 text-slate-600">
          Check Swedish noun gender with transparent confidence and source.
        </p>
      </div>

      <WordSearchInput
        value={word}
        onChange={setWord}
        onSubmit={handleSubmit}
        disabled={false}
      />

      <ResultCard result={result} />
    </div>
  );
}
