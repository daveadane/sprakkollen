export default function AnswerOptions({ disabled, onAnswer }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        disabled={disabled}
        onClick={() => onAnswer("en")}
        className="rounded-2xl border border-slate-200 bg-white py-4 text-lg font-bold hover:bg-slate-50 disabled:opacity-60"
      >
        EN
      </button>
      <button
        disabled={disabled}
        onClick={() => onAnswer("ett")}
        className="rounded-2xl border border-slate-200 bg-white py-4 text-lg font-bold hover:bg-slate-50 disabled:opacity-60"
      >
        ETT
      </button>
    </div>
  );
}
