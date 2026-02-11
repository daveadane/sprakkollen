const stylesByConfidence = {
  confirmed: "bg-emerald-100 text-emerald-800",
  verified: "bg-blue-100 text-blue-800",
  predicted: "bg-amber-100 text-amber-800",
  unknown: "bg-slate-100 text-slate-700",
  error: "bg-red-100 text-red-800",
};

export default function ConfidenceBadge({ confidence = "unknown", source }) {
  const cls = stylesByConfidence[confidence] ?? stylesByConfidence.unknown;

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>
      {confidence.toUpperCase()}
      {source ? <span className="opacity-70">• {source}</span> : null}
    </span>
  );
}
