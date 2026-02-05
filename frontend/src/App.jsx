import { useState } from "react";

function App() {
  const [word, setWord] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function checkWord() {
    if (!word.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/lookup?word=${word}`
      );
      const data = await response.json();

      setResult(data);
    } catch (error) {
      console.error("Error fetching data:", error);
      setResult({ article: "error", confidence: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-slate-100">
      <h1 className="text-3xl font-bold">Språkkollen</h1>

      <input
        className="border p-2 rounded w-64"
        placeholder="Skriv ett ord"
        value={word}
        onChange={(e) => setWord(e.target.value)}
      />

      <button
        onClick={checkWord}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Kontrollera
      </button>

      {loading && <p>Laddar...</p>}

      {result && !loading && (
        <div className="text-center">
          {result.article === "unknown" ? (
            <p className="text-red-500 font-semibold">
              Okänt genus
            </p>
          ) : (
            <>
              <p className="text-xl font-bold">
                {result.article.toUpperCase()}
              </p>
              <p className="text-sm text-gray-500">
                Confidence: {result.confidence}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;

