import ConfidenceBadge from "./ConfidenceBadge";

export default function ResultCard({ result }) {
  if (!result) return null;

  const { word, article, confidence, source } = result;

  const isUnknown = article === "unknown";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Result for</p>
          <h3 className="text-2xl font-black tracking-tight">{word}</h3>
        </div>

        <ConfidenceBadge confidence={confidence} source={source} />
      </div>

      <div className="mt-6">
        {isUnknown ? (
          <p className="text-red-600 font-semibold">Unknown gender</p>
        ) : (
          <p className="text-4xl font-black">
            {article.toUpperCase()}
          </p>
        )}
      </div>
    </div>
  );
}
