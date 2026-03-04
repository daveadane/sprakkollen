import ConfidenceBadge from "./ConfidenceBadge";

export default function ResultCard({ result }) {
  if (!result) return null;

  const { word, article, confidence, source, examples = [] } = result;

  const isUnknown = article === "unknown";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Result for</p>
          <h3 className="text-2xl font-black tracking-tight">{word}</h3>
        </div>

        <ConfidenceBadge confidence={confidence} source={source} />
      </div>

      <div>
        {isUnknown ? (
          <p className="text-red-600 font-semibold">Unknown gender</p>
        ) : (
          <p className="text-4xl font-black">{article.toUpperCase()}</p>
        )}
      </div>

      {examples.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-slate-500 mb-2">Examples</p>
          <ul className="space-y-2">
            {examples.map((ex, i) => (
              <li
                key={i}
                className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-sm text-slate-700"
              >
                {ex}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
